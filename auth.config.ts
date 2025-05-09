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
      console.log('サインインコールバック詳細:', {
        userId: user?.id,
        userEmail: user?.email,
        provider: account?.provider,
        profileData: !!profile,
        timestamp: Date.now(),
      });

      // Googleログイン時の追加処理
      if (account?.provider === 'google' && user?.email) {
        const normalizedEmail = user.email.toLowerCase();

        try {
          // メールアドレスでユーザーを検索
          const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
          });

          if (!existingUser) {
            console.log('Google認証: 新規ユーザー', { email: normalizedEmail });
            // 新規ユーザーの場合の処理はadapterが行う
          } else {
            console.log('Google認証: 既存ユーザー', {
              userId: existingUser.id,
              email: existingUser.email,
            });
          }

          return true; // サインイン成功
        } catch (error) {
          console.error('Google認証処理エラー:', error);
          return false; // サインイン失敗
        }
      }

      return true; // その他のプロバイダーはそのまま処理
    },

    async jwt({ token, user, trigger }) {
      // トリガーとタイムスタンプをログに出力
      console.log('JWT生成:', {
        trigger,
        userId: user?.id || token.sub,
        timestamp: Date.now(),
      });

      // ユーザー情報がある場合はトークンに追加
      if (user) {
        token.role = user.role;
        // 明示的にユーザー情報を更新
        token.name = user.name;
        token.email = user.email;
      }

      return token;
    },

    async session({ session, token }) {
      // セッション更新時にユーザーIDを必ず設定
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      // ロール情報も設定
      if (token.role && session.user) {
        session.user.role = token.role;
      }

      console.log('セッション更新:', {
        userId: session.user?.id,
        userEmail: session.user?.email,
        timestamp: Date.now(),
        expires: session.expires,
      });

      return session;
    },
  },

  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signin',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/dashboard',
  },

  // デバッグモードは開発環境でのみ有効
  debug: process.env.NODE_ENV === 'development',
} satisfies NextAuthConfig;