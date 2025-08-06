// auth.ts (JWT設定修正版)
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

// NextAuth設定
export const { handlers, auth, signIn, signOut } = NextAuth({
  // 🔧 重要: PrismaAdapterを削除してJWT戦略のみ使用
  // adapter: PrismaAdapter(prisma), // これが問題の原因
  session: {
    strategy: 'jwt', // JWTストラテジーを明示
    maxAge: 4 * 60 * 60, // 4時間
  },
  jwt: {
    // 🔧 JWT設定を明示的に追加
    maxAge: 4 * 60 * 60, // 4時間
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
        maxAge: 4 * 60 * 60,
      },
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('🚀 SignIn callback started', {
        provider: account?.provider,
        userEmail: user?.email,
      });

      try {
        // 🔧 Credentials認証の場合は常に許可
        if (account?.provider === 'credentials') {
          console.log('✅ Credentials authentication successful for:', user?.email);
          return true;
        }

        // 🔧 Google認証の場合の処理（既存のロジック維持）
        if (account?.provider === 'google' && user?.email) {
          const email = user.email.toLowerCase();
          console.log('📧 Processing Google login for:', email);

          const existingUser = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              name: true,
              email: true,
              password: true,
              emailVerified: true,
              accounts: {
                select: {
                  provider: true,
                },
              },
            },
          });

          if (existingUser) {
            console.log('👤 既存ユーザー発見:', {
              id: existingUser.id,
              hasPassword: !!existingUser.password,
              accountProviders: existingUser.accounts.map((a: { provider: string }) => a.provider),
            });

            if (existingUser.password) {
              console.log('❌ パスワード登録ユーザーのGoogleログイン試行を拒否');
              return false;
            }

            const hasGoogleAccount = existingUser.accounts.some(
              (acc: { provider: string }) => acc.provider === 'google',
            );
            if (!hasGoogleAccount) {
              console.log('❌ Googleアカウント連携なし、ログイン拒否');
              return false;
            }

            console.log('✅ 正常なGoogleユーザーのログイン');
            user.id = existingUser.id;
            user.name = existingUser.name || user.name;
            user.email = existingUser.email;
            return true;
          }

          if (email === 'admin@sns-share.com') {
            console.log('👑 Admin user detected');
            return true;
          }

          console.log('🆕 Creating new Google user (no password)');
          try {
            const newUser = await prisma.user.create({
              data: {
                email: email,
                name: user.name || profile?.name || 'Google User',
                image: user.image || profile?.picture || null,
                emailVerified: new Date(),
                subscriptionStatus: 'trial',
                password: null,
              },
            });

            console.log('✅ New Google user created:', newUser.id);
            user.id = newUser.id;
            user.name = newUser.name;
            user.email = newUser.email;
            return true;
          } catch (createError) {
            console.error('❌ Failed to create new user:', createError);
            return false;
          }
        }

        console.log('✅ Other provider authentication successful');
        return true;
      } catch (error) {
        console.error('💥 SignIn callback error:', error);
        return false;
      }
    },

    async jwt({ token, user, account }) {
      console.log('🔑 JWT callback', {
        hasUser: !!user,
        hasToken: !!token,
        provider: account?.provider,
        tokenSub: token?.sub,
        userEmail: user?.email || token?.email,
      });

      // 🔧 ログイン時にユーザー情報をトークンに保存
      if (user) {
        token.sub = user.id;
        token.name = user.name;
        token.email = user.email;
        console.log('✅ JWT: User info saved to token', {
          sub: token.sub,
          email: token.email,
        });
      }

      // 🔧 ロール情報の取得（初回またはロールがない場合）
      if (token.sub && !token.role) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: {
              email: true,
              subscriptionStatus: true,
              corporateRole: true,
              isFinancialAdmin: true, // 🆕 追加
              adminOfTenant: { select: { id: true } },
              tenant: { select: { id: true } },
            },
          });

          if (dbUser) {
            const userEmail = dbUser.email.toLowerCase();

            if (userEmail === 'admin@sns-share.com') {
              token.role = 'super-admin';
            } else if (userEmail.endsWith('@sns-share.com') && dbUser.isFinancialAdmin) {
              token.role = 'financial-admin'; // 🆕 財務管理者ロール
            } else if (dbUser.subscriptionStatus === 'permanent') {
              token.role = 'permanent-admin';
            } else if (dbUser.adminOfTenant) {
              token.role = 'admin';
            } else if (dbUser.corporateRole === 'member' && dbUser.tenant) {
              token.role = 'member';
            } else {
              token.role = 'personal';
            }

            console.log('✅ JWT: Role assigned', {
              email: userEmail,
              role: token.role,
              isFinancialAdmin: dbUser.isFinancialAdmin,
            });
          }
        } catch (error) {
          console.error('❌ JWT callback error:', error);
          token.role = 'personal';
        }
      }

      return token;
    },

    async session({ session, token }) {
      console.log('📋 Session callback', {
        hasToken: !!token,
        tokenSub: token?.sub,
        tokenEmail: token?.email,
        tokenRole: token?.role,
      });

      // 🔧 セッションにトークン情報を設定
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;

        console.log('✅ Session: User info set', {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role,
        });
      }

      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signin',
    error: '/auth/error',
  },
  providers: authConfig.providers,
  debug: process.env.NODE_ENV === 'development', // 🔧 開発環境ではデバッグ有効
});