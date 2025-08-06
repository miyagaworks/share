// auth.config.ts
// Prisma接続確保後に認証処理を行う修正版

import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { LoginSchema } from '@/schemas/auth';
import bcrypt from 'bcryptjs';
import { prisma, ensurePrismaConnection } from '@/lib/prisma'; // 🆕 ensurePrismaConnection追加

// reCAPTCHA v3検証関数
async function verifyRecaptchaV3(
  token: string,
  expectedAction: string = 'submit',
): Promise<boolean> {
  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!secretKey) {
      console.error('RECAPTCHA_SECRET_KEY が設定されていません');
      return false;
    }

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json();
    console.log('reCAPTCHA v3検証結果:', {
      success: data.success,
      score: data.score,
      action: data.action,
    });

    return data.success && data.score >= 0.5 && data.action === expectedAction;
  } catch (error) {
    console.error('reCAPTCHA検証エラー:', error);
    return false;
  }
}

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      allowDangerousEmailAccountLinking: false,
      authorization: {
        params: {
          scope: 'openid email profile',
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
        recaptchaToken: { label: 'reCAPTCHA Token', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.recaptchaToken) {
          console.log('❌ 必要な認証情報が不足しています');
          return null;
        }

        try {
          // 🆕 Prisma接続を確保
          const isConnected = await ensurePrismaConnection();
          if (!isConnected) {
            console.error('❌ Prisma接続に失敗しました');
            return null;
          }

          const isValidRecaptcha = await verifyRecaptchaV3(
            credentials.recaptchaToken as string,
            'login',
          );
          if (!isValidRecaptcha) {
            console.log('❌ reCAPTCHA v3検証に失敗しました');
            return null;
          }

          const validatedFields = LoginSchema.safeParse({
            email: credentials.email,
            password: credentials.password,
          });

          if (!validatedFields.success) {
            console.log('❌ バリデーションに失敗しました');
            return null;
          }

          const { email, password } = validatedFields.data;
          const normalizedEmail = email.toLowerCase();

          // 🔧 修正: Prisma接続確保後にクエリ実行
          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: {
              id: true,
              name: true,
              email: true,
              password: true,
              emailVerified: true,
            },
          });

          if (!user || !user.password) {
            console.log('❌ ユーザーが見つからないかパスワードが設定されていません');
            return null;
          }

          const passwordsMatch = await bcrypt.compare(password, user.password);
          if (!passwordsMatch) {
            console.log('❌ パスワードが一致しません');
            return null;
          }

          console.log('✅ 認証成功:', user.email);
          return {
            id: user.id,
            name: user.name || '',
            email: user.email,
          };
        } catch (error) {
          console.error('❌ 認証エラー:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signin',
    error: '/auth/error',
  },
  debug: false,
} satisfies NextAuthConfig;