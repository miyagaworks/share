// auth.ts (デバッグ強化版)
import NextAuth from 'next-auth';
import authConfig from './auth.config';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import type { DefaultSession } from 'next-auth';

// 型定義の拡張
declare module 'next-auth' {
  interface User {
    role?: string;
  }
  interface Session {
    user: {
      id: string;
      role?: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    isAdmin?: boolean;
    tenantId?: string | null;
  }
}

// 🔥 デバッグ用ログ関数
const debugLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_AUTH === 'true') {
    console.log(`[NextAuth Debug] ${message}`, data);
  }
};

const errorLog = (message: string, error?: any) => {
  console.error(`[NextAuth Error] ${message}`, error);
};

// NextAuth設定
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8時間
  },
  // 🔥 本番環境でのCookie設定を追加
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-next-auth.session-token'
          : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        debugLog('SignIn attempt', {
          provider: account?.provider,
          userEmail: user?.email,
          userId: user?.id,
        });

        if (account?.provider === 'google' && user?.email) {
          const email = user.email.toLowerCase();

          // 🔥 修正: データベース接続テスト
          try {
            await prisma.$queryRaw`SELECT 1`;
            debugLog('Database connection successful');
          } catch (dbError) {
            errorLog('Database connection failed', dbError);
            return false;
          }

          // 既存ユーザーを検索
          const existingUser = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              name: true,
              email: true,
              emailVerified: true,
              subscriptionStatus: true,
              corporateRole: true,
            },
          });

          debugLog('Existing user search result', {
            email,
            found: !!existingUser,
            userId: existingUser?.id,
          });

          if (existingUser) {
            // 既存ユーザーの場合、情報を更新
            user.id = existingUser.id;
            user.name = existingUser.name || user.name;
            user.email = existingUser.email;

            debugLog('Existing user login successful', { userId: user.id });
            return true;
          }

          // 🔥 修正: 新規ユーザーも許可（管理者メールまたは招待されたユーザー）
          if (email === 'admin@sns-share.com') {
            debugLog('Admin user login allowed', { email });
            return true;
          }

          // 招待されたユーザーかチェック（メールアドレスが事前登録されているか）
          const invitedUser = await prisma.passwordResetToken.findFirst({
            where: {
              user: {
                email: email,
              },
            },
            include: {
              user: true,
            },
          });

          if (invitedUser) {
            debugLog('Invited user login allowed', { email });
            return true;
          }

          // 🔥 一時的: 本番デバッグのため全ユーザー許可
          if (process.env.ALLOW_ALL_USERS === 'true') {
            debugLog('All users allowed (debug mode)', { email });
            return true;
          }

          debugLog('User not found or not invited', { email });
          return false;
        }

        debugLog('Non-Google provider or missing email', {
          provider: account?.provider,
          hasEmail: !!user?.email,
        });
        return true;
      } catch (error) {
        errorLog('SignIn callback error', error);
        return false;
      }
    },

    async jwt({ token, user, trigger, session }) {
      try {
        debugLog('JWT callback triggered', {
          trigger,
          hasUser: !!user,
          tokenSub: token.sub,
        });

        // 基本的なユーザー情報設定
        if (user) {
          token.sub = user.id;
          token.name = user.name;
          token.email = user.email;
          debugLog('JWT: User info set from user object', {
            id: user.id,
            email: user.email,
          });
        }

        // ロール情報取得（初回またはupdate時のみ）
        if ((user || trigger === 'update') && token.sub) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: token.sub },
              select: {
                email: true,
                subscriptionStatus: true,
                corporateRole: true,
                adminOfTenant: {
                  select: {
                    id: true,
                    accountStatus: true,
                  },
                },
                tenant: {
                  select: {
                    id: true,
                    accountStatus: true,
                  },
                },
                subscription: {
                  select: {
                    plan: true,
                    status: true,
                  },
                },
              },
            });

            if (dbUser) {
              const userEmail = dbUser.email.toLowerCase();

              // ロール判定ロジック
              if (userEmail === 'admin@sns-share.com') {
                token.role = 'super-admin';
                token.isAdmin = true;
                token.tenantId = `admin-tenant-${token.sub}`;
              } else if (dbUser.subscriptionStatus === 'permanent') {
                token.role = 'permanent-admin';
                token.isAdmin = true;
                token.tenantId = `virtual-tenant-${token.sub}`;
              } else if (dbUser.adminOfTenant) {
                const isActive = dbUser.adminOfTenant.accountStatus !== 'suspended';
                token.role = isActive ? 'admin' : 'personal';
                token.isAdmin = isActive;
                token.tenantId = isActive ? dbUser.adminOfTenant.id : null;
              } else if (dbUser.corporateRole === 'member' && dbUser.tenant) {
                const isActive = dbUser.tenant.accountStatus !== 'suspended';
                token.role = isActive ? 'member' : 'personal';
                token.isAdmin = false;
                token.tenantId = isActive ? dbUser.tenant.id : null;
              } else if (dbUser.corporateRole === 'member' && !dbUser.tenant) {
                token.role = 'incomplete-member';
                token.isAdmin = false;
                token.tenantId = null;
              } else {
                token.role = 'personal';
                token.isAdmin = false;
                token.tenantId = null;
              }

              debugLog('JWT: Role determined', {
                userId: token.sub,
                email: userEmail,
                role: token.role,
                isAdmin: token.isAdmin,
                tenantId: token.tenantId,
              });
            } else {
              debugLog('JWT: User not found in database', { userId: token.sub });
              token.role = 'personal';
              token.isAdmin = false;
              token.tenantId = null;
            }
          } catch (dbError) {
            errorLog('JWT: Database query error', dbError);
            token.role = 'personal';
            token.isAdmin = false;
            token.tenantId = null;
          }
        }

        return token;
      } catch (error) {
        errorLog('JWT callback error', error);
        return token;
      }
    },

    async session({ session, token }) {
      try {
        if (token && session.user) {
          session.user.id = token.sub as string;
          session.user.name = token.name as string;
          session.user.email = token.email as string;
          session.user.role = token.role as string;

          debugLog('Session created', {
            userId: session.user.id,
            email: session.user.email,
            role: session.user.role,
          });
        }
        return session;
      } catch (error) {
        errorLog('Session callback error', error);
        return session;
      }
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signin',
    error: '/auth/error',
  },
  providers: authConfig.providers,

  // 🔥 本番環境でのデバッグ設定
  debug: process.env.NODE_ENV === 'development' || process.env.DEBUG_AUTH === 'true',

  // 🔥 詳細なログ設定（修正版）
  logger: {
    error(error: Error) {
      errorLog('NextAuth Error', error);
    },
    warn(code: string) {
      console.warn(`[NextAuth Warning] ${code}`);
    },
    debug(code: string, metadata?: any) {
      debugLog(`NextAuth Debug [${code}]`, metadata);
    },
  },
});