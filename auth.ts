// auth.ts (強制デバッグ版)
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

// 🔥 強制ログ出力（本番でも必ず出力）
const forceLog = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`🔥 [${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : '');

  // 追加：エラー出力でも確認
  console.error(`🔥 [${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

// 🔥 環境変数チェック
forceLog('Environment Check', {
  NODE_ENV: process.env.NODE_ENV,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  hasSecret: !!process.env.NEXTAUTH_SECRET,
  hasGoogleId: !!process.env.GOOGLE_CLIENT_ID,
  hasGoogleSecret: !!process.env.GOOGLE_CLIENT_SECRET,
  hasDatabaseUrl: !!process.env.DATABASE_URL,
  DEBUG_AUTH: process.env.DEBUG_AUTH,
  ALLOW_ALL_USERS: process.env.ALLOW_ALL_USERS,
});

// NextAuth設定
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: process.env.SESSION_TIMEOUT_HOURS
      ? parseInt(process.env.SESSION_TIMEOUT_HOURS) * 60 * 60
      : 8 * 60 * 60, // デフォルト8時間
  },
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
      forceLog('🚀 SignIn Callback Started', {
        provider: account?.provider,
        userEmail: user?.email,
        userId: user?.id,
        accountType: account?.type,
        profileData: profile ? 'present' : 'missing',
      });

      try {
        if (account?.provider === 'google' && user?.email) {
          const email = user.email.toLowerCase();

          forceLog('📧 Processing Google Login', { email });

          // データベース接続テスト
          try {
            await prisma.$queryRaw`SELECT 1 as test`;
            forceLog('✅ Database connection successful');
          } catch (dbError) {
            forceLog('❌ Database connection failed', dbError);
            return '/auth/error?error=DatabaseConnection';
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

          forceLog('🔍 User Lookup Result', {
            email,
            found: !!existingUser,
            userId: existingUser?.id,
            role: existingUser?.corporateRole,
            subscriptionStatus: existingUser?.subscriptionStatus,
          });

          if (existingUser) {
            user.id = existingUser.id;
            user.name = existingUser.name || user.name;
            user.email = existingUser.email;

            forceLog('✅ Existing user login successful', {
              userId: user.id,
              userName: user.name,
            });
            return true;
          }

          // 管理者ユーザーチェック
          if (email === 'admin@sns-share.com') {
            forceLog('👑 Admin user detected', { email });
            return true;
          }

          // 全ユーザー許可モード
          if (process.env.ALLOW_ALL_USERS === 'true') {
            forceLog('🌍 All users allowed (debug mode)', { email });
            return true;
          }

          // 招待チェック
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
            forceLog('📨 Invited user found', { email });
            return true;
          }

          forceLog('🚫 User not authorized', {
            email,
            reason: 'Not existing user, not admin, not invited',
          });
          return false;
        }

        forceLog('⚠️ Non-Google login or missing email', {
          provider: account?.provider,
          hasEmail: !!user?.email,
        });
        return true;
      } catch (error) {
        forceLog('💥 SignIn callback error', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        return false;
      }
    },

    async jwt({ token, user, trigger }) {
      forceLog('🎫 JWT Callback', {
        trigger,
        hasUser: !!user,
        tokenSub: token.sub,
        tokenEmail: token.email,
      });

      try {
        if (user) {
          token.sub = user.id;
          token.name = user.name;
          token.email = user.email;
          forceLog('👤 JWT: User info updated', {
            id: user.id,
            email: user.email,
            name: user.name,
          });
        }

        if ((user || trigger === 'update') && token.sub) {
          forceLog('🔄 JWT: Fetching user role data', { userId: token.sub });

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
            },
          });

          if (dbUser) {
            const userEmail = dbUser.email.toLowerCase();

            // ロール判定
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
            } else {
              token.role = 'personal';
              token.isAdmin = false;
              token.tenantId = null;
            }

            forceLog('🏷️ JWT: Role assigned', {
              userId: token.sub,
              email: userEmail,
              role: token.role,
              isAdmin: token.isAdmin,
              tenantId: token.tenantId,
              corporateRole: dbUser.corporateRole,
              hasAdminTenant: !!dbUser.adminOfTenant,
              hasTenant: !!dbUser.tenant,
            });
          } else {
            forceLog('❌ JWT: User not found in database', { userId: token.sub });
            token.role = 'personal';
            token.isAdmin = false;
            token.tenantId = null;
          }
        }

        return token;
      } catch (error) {
        forceLog('💥 JWT callback error', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        return token;
      }
    },

    async session({ session, token }) {
      forceLog('📋 Session Callback', {
        hasToken: !!token,
        hasSession: !!session,
        tokenSub: token?.sub,
        sessionUserEmail: session?.user?.email,
      });

      try {
        if (token && session.user) {
          session.user.id = token.sub as string;
          session.user.name = token.name as string;
          session.user.email = token.email as string;
          session.user.role = token.role as string;

          forceLog('✅ Session created successfully', {
            userId: session.user.id,
            email: session.user.email,
            role: session.user.role,
            name: session.user.name,
          });
        }
        return session;
      } catch (error) {
        forceLog('💥 Session callback error', {
          error: error instanceof Error ? error.message : String(error),
        });
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
  debug: true, // 強制的にtrueに設定
});