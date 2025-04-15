// auth.config.ts
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { LoginSchema } from '@/schemas/auth';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      async authorize(credentials) {
        try {
          const validatedFields = LoginSchema.safeParse(credentials);

          if (!validatedFields.success) {
            console.log('バリデーションエラー:', validatedFields.error);
            return null;
          }

          const { email, password } = validatedFields.data;

          // メールアドレスを小文字化
          const normalizedEmail = email.toLowerCase();

          console.log(`認証試行: ${normalizedEmail}`);

          // 大文字小文字を区別しないメールアドレス検索
          const user = await prisma.user.findFirst({
            where: {
              email: {
                mode: 'insensitive',
                equals: normalizedEmail,
              },
            },
          });

          if (!user) {
            console.log(`ユーザーが見つかりません: ${normalizedEmail}`);
            return null;
          }

          if (!user.password) {
            console.log(`パスワードが設定されていません（OAuthユーザー？）: ${user.id}`);
            return null;
          }

          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (!passwordsMatch) {
            console.log(`パスワードが一致しません: ${user.id}`);
            return null;
          }

          console.log(`認証成功: ${user.id}`);
          return user;
        } catch (error) {
          console.error('認証エラー:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  cookies: {
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.role && session.user) {
        session.user.role = token.role as string;
      }

      return session;
    },
    async jwt({ token }) {
      if (!token.sub) return token;

      return token;
    },
  },
} satisfies NextAuthConfig;