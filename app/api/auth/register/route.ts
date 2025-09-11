// app/api/auth/register/route.ts (従来のreCAPTCHA版)
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RegisterSchema } from '@/schemas/auth';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { sendEmail } from '@/lib/email';
import { getEmailVerificationTemplate } from '@/lib/email/templates/email-verification';
import { logger } from '@/lib/utils/logger';

// 従来のreCAPTCHA検証関数
async function verifyRecaptcha(token: string): Promise<boolean> {
  // fallbackトークンの場合は検証をスキップ
  if (token === 'fallback-token' || token === 'dummy-token-for-non-production') {
    console.log('Fallbackトークンのため検証をスキップ');
    return true;
  }

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
    return data.success && (data.score === undefined || data.score > 0.5);
  } catch (error) {
    console.error('reCAPTCHA検証エラー:', error);
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

    // reCAPTCHA検証実行
    const isValidRecaptcha = await verifyRecaptcha(recaptchaToken);
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