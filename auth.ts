// auth.ts
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

// JWT型の拡張
declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
  }
}

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
        domain: process.env.NODE_ENV === 'production' ? '.sns-share.com' : undefined,
      },
    },
  },
  // 既存の設定...
  ...authConfig,
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