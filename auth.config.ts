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
      // これをfalseに変更するとアカウントのリンクが厳格になります
      allowDangerousEmailAccountLinking: false,
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
    async signIn({ user, account }) {
      console.log('サインインコールバック:', { userId: user?.id, provider: account?.provider });

      if (account?.provider === 'google') {
        try {
          // Googleログイン時にメールアドレスが存在するか確認
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email?.toLowerCase() || '' },
          });

          if (!existingUser) {
            console.log('Google認証: 新規ユーザー');
            // 新規ユーザーの場合、プロフィールなどを作成する処理を追加
          } else {
            console.log('Google認証: 既存ユーザー', existingUser.id);
          }
        } catch (error) {
          console.error('Google認証中のエラー:', error);
        }
      }

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

  debug: process.env.NODE_ENV === 'development' || !!process.env.DEBUG,
} satisfies NextAuthConfig;