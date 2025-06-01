// auth.config.ts (緊急修正版)
import { logger } from "@/lib/utils/logger";
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
          logger.debug('❌ [Auth] credentials が存在しません');
          return null;
        }
        
        try {
          const validatedFields = LoginSchema.safeParse(credentials);
          if (!validatedFields.success) {
            logger.debug('❌ [Auth] バリデーションエラー', validatedFields.error);
            return null;
          }
          
          const { email, password } = validatedFields.data;
          logger.debug('🔧 [Auth] 認証試行:', email);
          const normalizedEmail = email.toLowerCase();
          
          // データベース接続の確認
          try {
            await prisma.$connect();
          } catch (dbError) {
            logger.error('❌ [Auth] データベース接続エラー:', dbError);
            throw new Error('データベース接続に失敗しました');
          }
          
          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: {
              id: true,
              name: true,
              email: true,
              password: true,
              corporateRole: true,
              emailVerified: true,
            },
          });
          
          if (!user || !user.password) {
            logger.debug('❌ [Auth] ユーザーが見つかりません:', normalizedEmail);
            return null;
          }
          
          const passwordsMatch = await bcrypt.compare(password, user.password);
          if (!passwordsMatch) {
            logger.debug('❌ [Auth] パスワードが一致しません');
            return null;
          }
          
          logger.debug('✅ [Auth] 認証成功:', {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.corporateRole,
            emailVerified: user.emailVerified,
          });
          
          // 🚨 重要：完全なユーザーオブジェクトを返す
          return {
            id: user.id,
            name: user.name || '',
            email: user.email,
            role: user.corporateRole || undefined,
          };
        } catch (error) {
          logger.error('❌ [Auth] 認証中のエラー:', error);
          
          // データベース接続エラーの場合は、より詳細なエラーメッセージ
          if (error instanceof Error && error.message.includes('データベース')) {
            throw error;
          }
          
          return null;
        } finally {
          try {
            await prisma.$disconnect();
          } catch (disconnectError) {
            logger.error('❌ [Auth] データベース切断エラー:', disconnectError);
          }
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      try {
        logger.debug('🔧 [Auth] SignIn callback:', {
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
                emailVerified: true,
              },
            });
            
            if (existingUser) {
              logger.debug('✅ [Auth] Google認証: 既存ユーザー', existingUser);
              // 🚨 重要：userオブジェクトを更新
              user.id = existingUser.id;
              user.name = existingUser.name;
              user.email = existingUser.email;
              return true;
            } else {
              logger.error('❌ [Auth] Google認証: ユーザーが見つからない', { email: normalizedEmail });
              return false;
            }
          } catch (dbError) {
            logger.error('❌ [Auth] Google認証DB処理エラー:', dbError);
            return false;
          }
        }
        
        // Credentials認証の場合
        if (account?.provider === 'credentials') {
          if (!user?.id || !user?.email) {
            logger.error('❌ [Auth] Credentials認証: 必要な情報が不足', { user });
            return false;
          }
        }
        
        return true;
      } catch (error) {
        logger.error('❌ [Auth] SignIn callback全般エラー:', error);
        return false;
      }
    },
    async jwt({ token, user, trigger }) {
      logger.debug('🔧 [Auth] JWT callback開始:', {
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
          logger.error('emailVerified取得エラー:', error);
          token.emailVerified = false;
        }
        logger.debug('✅ [Auth] JWTトークン更新完了:', {
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
      logger.debug('🔧 [Auth] Session callback開始:', {
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
        logger.debug('✅ [Auth] Session更新完了:', session.user);
      } else {
        logger.error('❌ [Auth] トークンまたはセッションユーザーが存在しません:', {
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
  // エラーハンドリングの設定を追加
  debug: process.env.NODE_ENV === 'development',
} satisfies NextAuthConfig;