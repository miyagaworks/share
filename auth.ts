// auth.ts
import NextAuth from 'next-auth';
import authConfig from './auth.config';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import type { DefaultSession } from 'next-auth';
import { signOut as nextAuthSignOut } from 'next-auth/react';

// 型定義の拡張
declare module 'next-auth' {
  interface User {
    role?: string | null;
  }

  interface Session {
    user: {
      id: string;
      role?: string | null;
    } & DefaultSession['user'];
  }
}


// JWT型の拡張
declare module 'next-auth/jwt' {
  interface JWT {
    role?: string | null;
  }
}

// NextAuth設定
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.role && session.user) {
        session.user.role = token.role;
      }

      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }

      return token;
    },
  },
  ...authConfig,
});

export const enhancedSignIn = async (
  provider: string,
  credentials?: Record<string, string>, // any から string に変更
  redirectTo?: string,
) => {
  try {
    const result = await signIn(provider, {
      redirect: !!redirectTo,
      callbackUrl: redirectTo,
      ...credentials,
    });
    return result;
  } catch (error) {
    console.error('認証エラー:', error);
    return { error: '認証処理中にエラーが発生しました', success: false };
  }
};

// セキュリティ問題発生時の強制ログアウト
export const forceSecurityLogout = async (reason: string): Promise<void> => {
  // セキュリティイベントをログに記録
  console.error(`セキュリティ上の理由によるログアウト: ${reason}`);

  // nextAuthのsignOutを使用
  await nextAuthSignOut({
    redirect: true,
    callbackUrl: '/auth/signin?security=1',
  });
};

// トークン改ざんを検出する機能
export const detectTokenTampering = (token: Record<string, unknown>): boolean => {
  // トークンの基本構造チェック
  if (!token || typeof token !== 'object') return true;

  // 必須フィールドのチェック
  if (!token.sub || !token.iat || !token.exp) return true;

  // 有効期限チェック（型を保証）
  const expTime = token.exp as number;
  if (Date.now() / 1000 > expTime) return true;

  // 問題なし
  return false;
};