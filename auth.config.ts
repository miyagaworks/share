// auth.config.ts (緊急修正版)
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
      allowDangerousEmailAccountLinking: false,
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
          console.log('❌ [Auth] credentials が存在しません');
          return null;
        }

        try {
          const validatedFields = LoginSchema.safeParse(credentials);

          if (!validatedFields.success) {
            console.log('❌ [Auth] バリデーションエラー', validatedFields.error);
            return null;
          }

          const { email, password } = validatedFields.data;
          console.log('🔧 [Auth] 認証試行:', email);

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
            console.log('❌ [Auth] ユーザーが見つかりません');
            return null;
          }

          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (!passwordsMatch) {
            console.log('❌ [Auth] パスワードが一致しません');
            return null;
          }

          console.log('✅ [Auth] 認証成功:', {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.corporateRole,
          });

          // 🚨 重要：完全なユーザーオブジェクトを返す
          return {
            id: user.id,
            name: user.name || '',
            email: user.email,
            role: user.corporateRole || undefined,
          };
        } catch (error) {
          console.error('❌ [Auth] 認証中のエラー:', error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      console.log('🔧 [Auth] SignIn callback:', {
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        provider: account?.provider,
      });

      if (account?.provider === 'google' && user?.email) {
        const normalizedEmail = user.email.toLowerCase();

        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: {
              id: true,
              name: true,
              email: true,
            },
          });

          if (existingUser) {
            console.log('✅ [Auth] Google認証: 既存ユーザー', existingUser);
            // 🚨 重要：userオブジェクトを更新
            user.id = existingUser.id;
            user.name = existingUser.name;
            user.email = existingUser.email;
          }

          return true;
        } catch (error) {
          console.error('❌ [Auth] Google認証処理エラー:', error);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user, trigger }) {
      console.log('🔧 [Auth] JWT callback開始:', {
        trigger,
        hasUser: !!user,
        userId: user?.id,
        userName: user?.name,
        tokenSub: token.sub,
        tokenName: token.name,
      });

      // 🚨 重要：ユーザー情報がある場合は必ずトークンを更新
      if (user) {
        token.sub = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;

        // 🔥 追加: データベースからemailVerified情報を取得
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { emailVerified: true },
          });

          token.emailVerified = !!dbUser?.emailVerified;
        } catch (error) {
          console.error('emailVerified取得エラー:', error);
          token.emailVerified = false;
        }

        console.log('✅ [Auth] JWTトークン更新完了:', {
          sub: token.sub,
          name: token.name,
          email: token.email,
          role: token.role,
          emailVerified: token.emailVerified, // 追加
        });
      }

      return token;
    },

    async session({ session, token }) {
      console.log('🔧 [Auth] Session callback開始:', {
        hasToken: !!token,
        tokenSub: token.sub,
        tokenName: token.name,
        tokenEmail: token.email,
        sessionUserBefore: session.user,
      });

      // 🚨 重要：セッションユーザー情報を確実に設定
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.name = (token.name as string) || '';
        session.user.email = (token.email as string) || '';
        session.user.role = token.role as string;

        console.log('✅ [Auth] Session更新完了:', session.user);
      } else {
        console.error('❌ [Auth] トークンまたはセッションユーザーが存在しません:', {
          hasToken: !!token,
          hasSessionUser: !!session.user,
        });
      }

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
} satisfies NextAuthConfig;