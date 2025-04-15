// auth.config.ts
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { LoginSchema } from '@/schemas/auth';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { NextAuthOptions } from 'next-auth';

export const authOptions: NextAuthOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials) return null;

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
      if (token && token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token && token.role && session.user) {
        session.user.role = token.role as string;
      }

      return session;
    },
    async jwt({ token }) {
      if (!token.sub) return token;

      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default authOptions;