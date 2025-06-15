// app/api/auth/signin/route.ts (reCAPTCHA Enterprise対応版)
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { LoginSchema } from '@/schemas/auth';
import { logger } from '@/lib/utils/logger';

// reCAPTCHA Enterprise検証関数
async function verifyRecaptchaEnterprise(token: string): Promise<boolean> {
  try {
    const apiKey = process.env.RECAPTCHA_SECRET_KEY;
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

    if (!apiKey || !projectId || !siteKey) {
      logger.error('reCAPTCHA Enterprise設定が不完全です:', {
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
      logger.error('reCAPTCHA Enterprise API呼び出し失敗:', response.status, response.statusText);
      return false;
    }

    const data = await response.json();
    logger.info('reCAPTCHA Enterprise検証結果:', {
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
    logger.error('reCAPTCHA Enterprise検証エラー:', error);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // reCAPTCHAトークンの検証
    const { recaptchaToken, email, password } = body;

    if (!recaptchaToken) {
      return NextResponse.json({ error: 'reCAPTCHA認証が必要です。' }, { status: 400 });
    }

    // reCAPTCHA Enterprise検証実行
    const isValidRecaptcha = await verifyRecaptchaEnterprise(recaptchaToken);
    if (!isValidRecaptcha) {
      return NextResponse.json(
        { error: 'reCAPTCHA認証に失敗しました。再度お試しください。' },
        { status: 400 },
      );
    }

    logger.info('サインイン試行:', { email });

    // バリデーション
    const validatedFields = LoginSchema.safeParse({ email, password });
    if (!validatedFields.success) {
      return NextResponse.json(
        {
          error: '入力が正しくありません',
        },
        { status: 400 },
      );
    }

    // ユーザーを直接データベースで検索
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        {
          error: 'メールアドレスまたはパスワードが正しくありません',
        },
        { status: 401 },
      );
    }

    // パスワード検証
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          error: 'メールアドレスまたはパスワードが正しくありません',
        },
        { status: 401 },
      );
    }

    // 認証成功
    return NextResponse.json({
      success: true,
      userId: user.id,
      email: user.email,
    });
  } catch (error: unknown) {
    // エラータイプの明示
    const errorMessage = error instanceof Error ? error.message : '不明なエラー';
    logger.error('サインインエラー:', error, {
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      message: errorMessage,
    });
    return NextResponse.json(
      {
        error: 'ログイン処理中にエラーが発生しました',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 },
    );
  }
}