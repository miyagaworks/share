// auth.ts（修正版）
import NextAuth from 'next-auth';
import authConfig from './auth.config';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import type { DefaultSession } from 'next-auth';

// 型定義の拡張
declare module 'next-auth' {
  interface User {
    role?: string;
    tenantId?: string | null;
    isAdmin?: boolean;
  }

  interface Session {
    user: {
      id: string;
      role?: string;
      tenantId?: string | null;
      isAdmin?: boolean;
    } & DefaultSession['user'];
  }
}

// JWT型の拡張
declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    tenantId?: string | null;
    isAdmin?: boolean;
  }
}

// authConfig設定を取得
const { callbacks: baseCallbacks, ...restAuthConfig } = authConfig;

// NextAuth設定
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: undefined,
      },
    },
    // 他のCookieも明示的に設定
    callbackUrl: {
      name: 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: undefined,
      },
    },
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: undefined,
      },
    },
  },
  callbacks: {
    // 既存のコールバックとマージ（必要なものだけ実装）
    async jwt({ token, user, ...rest }) {
      // 既存のjwtコールバックがあれば呼び出す
      if (baseCallbacks?.jwt) {
        token = await baseCallbacks.jwt({ token, user, ...rest });
      }

      // 初回サインイン時にユーザー情報をトークンに追加
      if (user) {
        try {
          // Prisma使用はサーバーサイドのみで行う
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
              tenant: true,
              adminOfTenant: true,
            },
          });

          if (dbUser) {
            token.isAdmin = !!dbUser.adminOfTenant;
            token.tenantId = dbUser.tenant?.id || null;
            token.role = dbUser.adminOfTenant
              ? 'admin'
              : dbUser.tenant
                ? 'corporate-member'
                : 'personal';
          }
        } catch (error) {
          console.error('JWTコールバックでのDB取得エラー:', error);
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role;
        session.user.isAdmin = token.isAdmin;
        session.user.tenantId = token.tenantId;
      }
      return session;
    },
  },
  // authConfigから残りの設定を取得
  ...restAuthConfig,
});

// セキュリティ問題発生時の強制ログアウト関数
export const forceSecurityLogout = async (reason: string): Promise<void> => {
  console.error(`セキュリティ上の理由によるログアウト: ${reason}`);
  await signOut({
    redirect: true,
    redirectTo: '/auth/signin?security=1',
  });
};

// トークン改ざんを検出する機能
export const detectTokenTampering = (token: Record<string, unknown>): boolean => {
  if (!token || typeof token !== 'object') return true;
  if (!token.sub || !token.iat || !token.exp) return true;
  const expTime = token.exp as number;
  if (Date.now() / 1000 > expTime) return true;
  return false;
};