// auth.config.ts (従来のreCAPTCHA版)
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { LoginSchema } from '@/schemas/auth';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

// 従来のreCAPTCHA検証関数
async function verifyRecaptcha(token: string): Promise<boolean> {
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
    console.log('reCAPTCHA検証結果:', { success: data.success, score: data.score });

    // v3の場合はスコアもチェック、v2の場合はsuccessのみ
    return data.success && (data.score === undefined || data.score > 0.5);
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
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          scope: 'openid email profile',
          prompt: 'consent',
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
          // reCAPTCHA検証
          const isValidRecaptcha = await verifyRecaptcha(credentials.recaptchaToken as string);
          if (!isValidRecaptcha) {
            console.log('❌ reCAPTCHA検証に失敗しました');
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
  debug: process.env.NODE_ENV === 'development',
} satisfies NextAuthConfig;