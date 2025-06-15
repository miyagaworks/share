// auth.config.ts (reCAPTCHA Enterprise対応版)
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { LoginSchema } from '@/schemas/auth';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

// reCAPTCHA Enterprise検証関数
async function verifyRecaptchaEnterprise(token: string): Promise<boolean> {
  try {
    const apiKey = process.env.RECAPTCHA_SECRET_KEY;
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

    if (!apiKey || !projectId || !siteKey) {
      console.error('reCAPTCHA Enterprise設定が不完全です:', {
        hasApiKey: !!apiKey,
        hasProjectId: !!projectId,
        hasSiteKey: !!siteKey,
      });
      return false;
    }

    const url = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: {
          token: token,
          siteKey: siteKey,
          expectedAction: 'login',
        },
      }),
    });

    if (!response.ok) {
      console.error('reCAPTCHA Enterprise API呼び出し失敗:', response.status, response.statusText);
      return false;
    }

    const data = await response.json();
    console.log('reCAPTCHA Enterprise検証結果:', {
      score: data.riskAnalysis?.score,
      valid: data.tokenProperties?.valid,
      action: data.tokenProperties?.action,
    });

    // スコアと有効性をチェック（0.5以上を人間と判定）
    const isValid = data.tokenProperties?.valid === true;
    const score = data.riskAnalysis?.score || 0;
    const correctAction = data.tokenProperties?.action === 'login';

    return isValid && score >= 0.5 && correctAction;
  } catch (error) {
    console.error('reCAPTCHA Enterprise検証エラー:', error);
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
          // reCAPTCHA Enterprise検証
          const isValidRecaptcha = await verifyRecaptchaEnterprise(
            credentials.recaptchaToken as string,
          );
          if (!isValidRecaptcha) {
            console.log('❌ reCAPTCHA Enterprise検証に失敗しました');
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