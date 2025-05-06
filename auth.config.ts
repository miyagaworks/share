// auth.config.ts の修正
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { LoginSchema } from '@/schemas/auth';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      credentials: {
        email: { label: 'メールアドレス', type: 'email' },
        password: { label: 'パスワード', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) {
          console.log('認証失敗: credentials が存在しません');
          return null;
        }

        try {
          const validatedFields = LoginSchema.safeParse(credentials);

          if (!validatedFields.success) {
            console.log('認証失敗: バリデーションエラー', validatedFields.error);
            return null;
          }

          const { email, password } = validatedFields.data;
          console.log('認証試行:', email);

          const user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              name: true,
              email: true,
              password: true,
              corporateRole: true,
            },
          });

          if (!user || !user.password) {
            console.log('認証失敗: ユーザーが見つかりません');
            return null;
          }

          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (!passwordsMatch) {
            console.log('認証失敗: パスワードが一致しません');
            return null;
          }

          console.log('認証成功:', user.id);

          // User 型に合わせる
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.corporateRole || undefined, // null の代わりに undefined を使用
          };
        } catch (error) {
          console.error('認証中のエラー:', error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    // 認証関連のコールバックをここに集約
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.role && session.user) {
        session.user.role = token.role;
      }

      console.log('Session callback called:', { session });

      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }

      console.log('JWT callback called:', { token });

      return token;
    },
    // 未使用の profile パラメータを削除
    async signIn({ user, account }) {
      console.log('サインインコールバック:', { userId: user?.id, provider: account?.provider });
      return true;
    },
  },

  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signin',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/dashboard', // 新規ユーザー用のリダイレクト先
  },

  debug: process.env.NODE_ENV === 'development',
} satisfies NextAuthConfig;