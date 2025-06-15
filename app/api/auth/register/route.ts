// app/api/auth/register/route.ts (reCAPTCHA Enterprise対応版)
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RegisterSchema } from '@/schemas/auth';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { sendEmail } from '@/lib/email';
import { getEmailVerificationTemplate } from '@/lib/email/templates/email-verification';
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
          expectedAction: 'register',
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
    const correctAction = data.tokenProperties?.action === 'register';

    return isValid && score >= 0.5 && correctAction;
  } catch (error) {
    logger.error('reCAPTCHA Enterprise検証エラー:', error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // reCAPTCHAトークンの検証
    const { recaptchaToken, ...otherData } = body;

    if (!recaptchaToken) {
      return NextResponse.json({ message: 'reCAPTCHA認証が必要です。' }, { status: 400 });
    }

    // reCAPTCHA Enterprise検証実行
    const isValidRecaptcha = await verifyRecaptchaEnterprise(recaptchaToken);
    if (!isValidRecaptcha) {
      return NextResponse.json(
        { message: 'reCAPTCHA認証に失敗しました。再度お試しください。' },
        { status: 400 },
      );
    }

    const validatedFields = RegisterSchema.safeParse(otherData);
    if (!validatedFields.success) {
      return NextResponse.json({ message: '入力内容に問題があります。' }, { status: 400 });
    }

    const { lastName, firstName, lastNameKana, firstNameKana, email, password } =
      validatedFields.data;

    // 姓名を結合して完全な名前を作成
    const name = `${lastName} ${firstName}`;
    const nameKana = `${lastNameKana} ${firstNameKana}`;
    const nameEn = '';

    // メールアドレスを小文字に正規化
    const normalizedEmail = email.toLowerCase();

    // 既存ユーザーのチェック
    const existingUser = await prisma.user.findFirst({
      where: {
        email: {
          mode: 'insensitive',
          equals: normalizedEmail,
        },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'このメールアドレスは既に登録されています。' },
        { status: 409 },
      );
    }

    // パスワードのハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    // 7日間の無料トライアル期間を設定
    const now = new Date();
    const trialEndsAt = new Date(now);
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    // メール認証トークンを生成
    const verificationToken = randomUUID();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24時間後

    // ユーザーとメール認証トークンを同時に作成
    const user = await prisma.user.create({
      data: {
        name,
        nameEn,
        nameKana,
        lastName,
        firstName,
        lastNameKana,
        firstNameKana,
        email: normalizedEmail,
        password: hashedPassword,
        mainColor: '#3B82F6',
        trialEndsAt,
        subscriptionStatus: 'trialing',
        emailVerified: null, // 未認証の状態
        emailVerificationToken: {
          create: {
            token: verificationToken,
            expires: verificationExpires,
          },
        },
      },
    });

    logger.info('ユーザー作成完了:', {
      userId: user.id,
      email: user.email,
    });

    // 認証メールを送信
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;

    try {
      const emailTemplate = getEmailVerificationTemplate({
        userName: name,
        verificationUrl: verificationUrl,
      });

      await sendEmail({
        to: normalizedEmail,
        subject: emailTemplate.subject,
        text: emailTemplate.text,
        html: emailTemplate.html,
      });

      logger.info('認証メール送信完了');
    } catch (emailError) {
      logger.error('認証メール送信エラー:', emailError);
      // メール送信に失敗してもユーザー作成は成功とする
    }

    // 成功レスポンスを返す
    return NextResponse.json(
      {
        message:
          'ユーザーが正常に登録されました。認証メールを送信しましたので、メールをご確認ください。',
        userId: user.id,
        requiresEmailVerification: true,
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error('新規登録処理エラー:', error);
    return NextResponse.json(
      { message: 'ユーザー登録中にエラーが発生しました。' },
      { status: 500 },
    );
  }
}