// auth.ts (ヘッダーサイズ最適化版)
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
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    // 🔧 セッション時間を短縮してサイズ削減
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
        // 🔧 cookieサイズ制限
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
        // 🔧 Google認証の場合の厳格なチェック
        if (account?.provider === 'google' && user?.email) {
          const email = user.email.toLowerCase();
          console.log('📧 Processing Google login for:', email);

          // 🚨 重要：既存ユーザーの徹底チェック
          const existingUser = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              name: true,
              email: true,
              password: true, // パスワードの有無をチェック
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
              accountProviders: existingUser.accounts.map((a) => a.provider),
            });

            // 🚨 メール/パスワードで登録されたユーザーは絶対にGoogleログインを拒否
            if (existingUser.password) {
              console.log('❌ パスワード登録ユーザーのGoogleログイン試行を拒否');
              // エラーを投げてログインを阻止
              return false;
            }

            // 🚨 Googleアカウントが既に存在する場合のみ許可
            const hasGoogleAccount = existingUser.accounts.some((acc) => acc.provider === 'google');
            if (!hasGoogleAccount) {
              console.log('❌ Googleアカウント連携なし、ログイン拒否');
              return false;
            }

            // ✅ 正常なGoogleユーザー
            console.log('✅ 正常なGoogleユーザーのログイン');
            user.id = existingUser.id;
            user.name = existingUser.name || user.name;
            user.email = existingUser.email;
            return true;
          }

          // 🔧 管理者アカウントの特別処理
          if (email === 'admin@sns-share.com') {
            console.log('👑 Admin user detected');
            return true;
          }

          // 🔧 新規Googleユーザーの作成（パスワードなし）
          console.log('🆕 Creating new Google user (no password)');
          try {
            const newUser = await prisma.user.create({
              data: {
                email: email,
                name: user.name || profile?.name || 'Google User',
                image: user.image || profile?.picture || null,
                emailVerified: new Date(),
                subscriptionStatus: 'trial',
                // 🚨 重要：パスワードはnullのまま（Googleユーザーとして識別）
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

        // 🔧 Credentials認証の場合はそのまま通す
        if (account?.provider === 'credentials') {
          console.log('✅ Credentials authentication successful');
          return true;
        }

        console.log('✅ Other provider authentication successful');
        return true;
      } catch (error) {
        console.error('💥 SignIn callback error:', error);
        return false;
      }
    },

    async jwt({ token, user }) {
      // 🔧 最小限の情報のみトークンに保存
      if (user) {
        token.sub = user.id;
        token.name = user.name;
        token.email = user.email;
      }

      // 🔧 ロール情報の簡素化
      if (token.sub && !token.role) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: {
              email: true,
              subscriptionStatus: true,
              corporateRole: true,
              adminOfTenant: { select: { id: true } },
              tenant: { select: { id: true } },
            },
          });

          if (dbUser) {
            const userEmail = dbUser.email.toLowerCase();

            if (userEmail === 'admin@sns-share.com') {
              token.role = 'super-admin';
            } else if (dbUser.subscriptionStatus === 'permanent') {
              token.role = 'permanent-admin';
            } else if (dbUser.adminOfTenant) {
              token.role = 'admin';
            } else if (dbUser.corporateRole === 'member' && dbUser.tenant) {
              token.role = 'member';
            } else {
              token.role = 'personal';
            }
          }
        } catch (error) {
          console.error('JWT callback error:', error);
          token.role = 'personal';
        }
      }

      return token;
    },

    async session({ session, token }) {
      // 🔧 セッションデータを最小限に
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        // 🔧 name と email は必要最小限のみ
        session.user.name = token.name as string;
        session.user.email = token.email as string;
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
  debug: false, // 🔧 デバッグを無効化してログ削減
});