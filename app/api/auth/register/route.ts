// app/api/auth/register/route.ts (修正版 - 新テンプレート使用)
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RegisterSchema } from '@/schemas/auth';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { sendEmail } from '@/lib/email';
import { getEmailVerificationTemplate } from '@/lib/email/templates/email-verification';

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 新規登録API開始');

    const body = await req.json();
    console.log('📝 リクエストボディ受信:', {
      hasLastName: !!body.lastName,
      hasFirstName: !!body.firstName,
      hasEmail: !!body.email,
      hasPassword: !!body.password,
    });

    const validatedFields = RegisterSchema.safeParse(body);

    if (!validatedFields.success) {
      console.log('❌ バリデーションエラー:', validatedFields.error);
      return NextResponse.json({ message: '入力内容に問題があります。' }, { status: 400 });
    }

    const { lastName, firstName, lastNameKana, firstNameKana, email, password } =
      validatedFields.data;

    console.log('✅ バリデーション成功');

    // 姓名を結合して完全な名前を作成
    const name = `${lastName} ${firstName}`;
    const nameKana = `${lastNameKana} ${firstNameKana}`;
    const nameEn = '';

    // メールアドレスを小文字に正規化
    const normalizedEmail = email.toLowerCase();
    console.log('📧 正規化メールアドレス:', normalizedEmail);

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
      console.log('❌ ユーザー既存:', normalizedEmail);
      return NextResponse.json(
        { message: 'このメールアドレスは既に登録されています。' },
        { status: 409 },
      );
    }

    console.log('✅ ユーザー重複チェック完了');

    // パスワードのハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ パスワードハッシュ化完了');

    // 7日間の無料トライアル期間を設定
    const now = new Date();
    const trialEndsAt = new Date(now);
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    // メール認証トークンを生成
    const verificationToken = randomUUID();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24時間後

    console.log('🔑 認証トークン生成:', {
      tokenPrefix: verificationToken.substring(0, 8) + '...',
      expires: verificationExpires.toISOString(),
    });

    // ユーザーとメール認証トークンを同時に作成
    console.log('💾 データベース書き込み開始');
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

    console.log('✅ ユーザー作成完了:', {
      userId: user.id,
      email: user.email,
    });

    // 認証メールを送信
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;

    console.log('📨 メール送信準備:', {
      baseUrl,
      verificationUrlPrefix: verificationUrl.substring(0, 50) + '...',
    });

    try {
      console.log('📧 メール送信開始...');

      // 🚀 新しいスタイリッシュなテンプレートを使用
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

      console.log('✅ 認証メール送信完了');
    } catch (emailError) {
      console.error('❌ 認証メール送信エラー:', emailError);
      // メール送信に失敗してもユーザー作成は成功とする
    }

    console.log('🎉 新規登録処理完了');

    // 成功レスポンスを返す
    const response = {
      message:
        'ユーザーが正常に登録されました。認証メールを送信しましたので、メールをご確認ください。',
      userId: user.id,
      requiresEmailVerification: true,
      // 開発環境では追加情報を含める
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          verificationUrl,
          tokenPrefix: verificationToken.substring(0, 8) + '...',
          userEmail: normalizedEmail,
        },
      }),
    };

    console.log('📤 レスポンス送信:', {
      status: 201,
      hasDebugInfo: 'debug' in response,
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('💥 新規登録処理エラー:', error);

    // 詳細エラー情報をログに出力
    if (error instanceof Error) {
      console.error('エラー詳細:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }

    return NextResponse.json(
      {
        message: 'ユーザー登録中にエラーが発生しました。',
        // 開発環境ではエラー詳細を含める
        ...(process.env.NODE_ENV === 'development' && {
          error: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 },
    );
  }
}