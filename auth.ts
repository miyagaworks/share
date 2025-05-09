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
  debug: process.env.NODE_ENV === 'development',

  // セッション設定
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: undefined, // ドメイン設定不要
      },
    },
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

  // イベントロギング
  events: {
    async signIn({ user, account, isNewUser }) {
      console.log(
        `ユーザーログイン: ${user.id}, ${account?.provider || 'credentials'}, 新規: ${isNewUser ? 'はい' : 'いいえ'}`,
      );
    },
    async signOut() {
      // 引数を使用せず、単純にログメッセージだけ出力
      console.log(`ユーザーログアウト`);
    },
    async createUser({ user }) {
      console.log(`ユーザー作成: ${user.id}, ${user.email}`);
    },
    async linkAccount({ user, account }) {
      console.log(`アカウント連携: ${user.email}, ${account.provider}`);
    },
    async session(params) {
      // sessionオブジェクトがあることを確認してからアクセス
      if (
        params.session &&
        'user' in params.session &&
        params.session.user &&
        'email' in params.session.user
      ) {
        console.log(
          `セッション更新: ${params.session.user.email}, 有効期限: ${params.session.expires}`,
        );
      } else {
        console.log(`セッション更新: ユーザー情報なし`);
      }
    },
  },

  // 他の設定はauth.configから取得
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