// app/api/auth/send-verification-email/route.ts (セッション不要版)
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import { randomUUID } from 'crypto';
import { sendEmail } from '@/lib/email';
import { getEmailVerificationTemplate } from '@/lib/email/templates/email-verification';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    // メールアドレスが提供されていない場合
    if (!email) {
      return NextResponse.json({ error: 'メールアドレスが必要です' }, { status: 400 });
    }

    // メールアドレスを正規化
    const normalizedEmail = email.toLowerCase().trim();

    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 既に認証済みの場合
    if (user.emailVerified) {
      return NextResponse.json({
        message: 'メールアドレスは既に認証済みです',
        alreadyVerified: true,
      });
    }

    // 新しい認証トークンを生成
    const verificationToken = randomUUID();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24時間後

    // 既存のトークンを削除して新しいトークンを作成
    await prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id },
    });

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expires: verificationExpires,
      },
    });

    // 認証メールを送信
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;

    try {
      const emailTemplate = getEmailVerificationTemplate({
        userName: user.name || 'ユーザー',
        verificationUrl: verificationUrl,
      });

      await sendEmail({
        to: user.email,
        subject: emailTemplate.subject,
        text: emailTemplate.text,
        html: emailTemplate.html,
      });

      logger.info('メール認証再送信完了:', {
        userId: user.id,
        email: user.email,
      });

      return NextResponse.json({
        message: 'メール認証リンクを再送信しました',
        sent: true,
      });
    } catch (emailError) {
      logger.error('メール送信エラー:', emailError);
      return NextResponse.json({ error: 'メール送信に失敗しました' }, { status: 500 });
    }
  } catch (error) {
    logger.error('メール認証送信エラー:', error);
    return NextResponse.json({ error: 'メール認証送信に失敗しました' }, { status: 500 });
  }
}