// auth.ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    Credentials({
      async authorize(credentials) {
        try {
          // 型安全なcredentials処理
          if (!credentials) return null;

          const email = credentials.email as string;
          const password = credentials.password as string;

          if (!email || !password) {
            return null;
          }

          const normalizedEmail = email.toLowerCase();

          // ユーザー検索（既存のスキーマを使用）
          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: {
              id: true,
              name: true,
              email: true,
              password: true,
              // 既存スキーマの他のフィールドも必要に応じて選択可能
            },
          });

          if (!user || !user.password) {
            return null;
          }

          const passwordsMatch = await bcrypt.compare(password, user.password);
          if (!passwordsMatch) {
            return null;
          }

          // 認証成功
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            // 他の必要なユーザー情報
          };
        } catch (error) {
          console.error('認証エラー:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  session: { strategy: 'jwt' },
  callbacks: {
    async session({ token, session }) {
      if (session.user) {
        session.user.id = token.sub || '';
        session.user.role = token.role; // roleプロパティを処理
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role; // roleプロパティを処理
      }
      return token;
    },
  },
});
