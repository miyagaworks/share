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
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.role && session.user) {
        session.user.role = token.role;
      }

      // デバッグ用：セッション情報をコンソールに出力
      console.log('Session callback called:', { session });

      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }

      // デバッグ用：トークン情報をコンソールに出力
      console.log('JWT callback called:', { token });

      return token;
    },
  },
  debug: process.env.NODE_ENV === 'development', // 開発環境ではデバッグモードを有効に
  ...authConfig,
});