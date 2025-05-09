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
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      authorization: {
        params: {
          prompt: 'select_account',
          access_type: 'offline',
          response_type: 'code',
        },
      },
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

          // メールアドレスを小文字に正規化
          const normalizedEmail = email.toLowerCase();

          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
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
            role: user.corporateRole || undefined,
          };
        } catch (error) {
          console.error('認証中のエラー:', error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('サインインコールバック:', {
        userId: user?.id,
        provider: account?.provider,
        email: user?.email,
        profileData: !!profile,
      });

      // Googleアカウントでログインする時の特別な処理
      if (account?.provider === 'google' && user?.email) {
        try {
          // すでに存在するユーザーを探す
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email.toLowerCase() },
          });

          console.log('既存ユーザーチェック:', existingUser ? `ID: ${existingUser.id}` : 'なし');

          // ユーザーが見つからなければ、新規作成する
          if (!existingUser) {
            console.log('Google認証: 新規ユーザー作成');
          }

          return true;
        } catch (error) {
          console.error('Google認証エラー:', error);
          return false;
        }
      }

      return true;
    },
    async session({ session, token }) {
      console.log('セッションコールバック詳細:', {
        sessionBefore: JSON.stringify(session),
        tokenData: JSON.stringify(token),
      });

      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.role && session.user) {
        session.user.role = token.role;
      }

      console.log('セッションコールバック完了:', {
        sessionAfter: JSON.stringify(session),
      });

      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }

      console.log('JWT callback called:', { token });

      return token;
    },
  },

  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signin',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/dashboard', // 新規ユーザー用のリダイレクト先
  },

  debug: process.env.NODE_ENV === 'development' || !!process.env.DEBUG,
} satisfies NextAuthConfig;