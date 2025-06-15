// app/api/auth/signin/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { LoginSchema } from '@/schemas/auth';
import { logger } from '@/lib/utils/logger';

// reCAPTCHA検証関数
async function verifyRecaptcha(token: string): Promise<boolean> {
  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!secretKey) {
      logger.error('RECAPTCHA_SECRET_KEY が設定されていません');
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
    logger.info('reCAPTCHA検証結果:', { success: data.success, score: data.score });

    // v3の場合はスコアもチェック、v2の場合はsuccessのみ
    return data.success && (data.score === undefined || data.score > 0.5);
  } catch (error) {
    logger.error('reCAPTCHA検証エラー:', error);
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

    // reCAPTCHA検証実行
    const isValidRecaptcha = await verifyRecaptcha(recaptchaToken);
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