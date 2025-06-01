// app/api/auth/send-verification-email/route.ts (完全実装版)
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { sendEmail } from '@/lib/email';
import { getEmailVerificationTemplate } from '@/lib/email/templates/email-verification';
import { logger } from '@/lib/utils/logger';

export async function POST() {
  try {
    logger.info('メール認証再送信API開始');

    const session = await auth();

    if (!session?.user?.id) {
      logger.warn('未認証ユーザーからの再送信要求');
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        emailVerificationToken: true,
      },
    });

    if (!user) {
      logger.warn('ユーザーが見つからない:', session.user.id);
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 既に認証済みの場合
    if (user.emailVerified) {
      logger.info('既に認証済みのユーザー:', user.email);
      return NextResponse.json({
        message: 'メールアドレスは既に認証済みです',
        alreadyVerified: true,
      });
    }

    logger.info('メール認証再送信処理開始:', {
      userId: user.id,
      email: user.email,
    });

    // 新しい認証トークンを生成
    const verificationToken = randomUUID();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24時間後

    logger.debug('新しい認証トークン生成:', {
      tokenPrefix: verificationToken.substring(0, 8) + '...',
      expires: verificationExpires.toISOString(),
    });

    // データベーストランザクションで既存トークンを削除して新しいトークンを作成
    await prisma.$transaction(async (tx) => {
      // 既存のトークンがあれば削除
      if (user.emailVerificationToken) {
        await tx.emailVerificationToken.delete({
          where: { userId: user.id },
        });
        logger.debug('既存の認証トークンを削除');
      }

      // 新しいトークンを作成
      await tx.emailVerificationToken.create({
        data: {
          userId: user.id,
          token: verificationToken,
          expires: verificationExpires,
        },
      });
      logger.debug('新しい認証トークンを作成');
    });

    // 認証メールを送信
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;

    logger.debug('メール送信準備:', {
      baseUrl,
      verificationUrlPrefix: verificationUrl.substring(0, 50) + '...',
    });

    try {
      // 新しいテンプレートを使用してメール送信
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

      logger.info('認証メール再送信完了:', {
        userId: user.id,
        email: user.email,
      });

      return NextResponse.json({
        message: '認証メールを再送信しました。メールをご確認ください。',
        sent: true,
        // 開発環境では追加情報を含める
        ...(process.env.NODE_ENV === 'development' && {
          debug: {
            verificationUrl,
            tokenPrefix: verificationToken.substring(0, 8) + '...',
            userEmail: user.email,
          },
        }),
      });
    } catch (emailError) {
      logger.error('認証メール送信エラー:', emailError);

      // メール送信に失敗した場合はトークンも削除
      await prisma.emailVerificationToken
        .delete({
          where: { userId: user.id },
        })
        .catch(() => {
          // トークン削除に失敗してもログのみ出力
          logger.warn('メール送信失敗後のトークン削除に失敗');
        });

      return NextResponse.json(
        {
          error: 'メール送信に失敗しました。しばらく時間をおいて再度お試しください。',
          // 開発環境ではエラー詳細を含める
          ...(process.env.NODE_ENV === 'development' && {
            debug: {
              error: emailError instanceof Error ? emailError.message : String(emailError),
            },
          }),
        },
        { status: 500 },
      );
    }
  } catch (error) {
    logger.error('メール認証再送信処理エラー:', error);

    return NextResponse.json(
      {
        error: 'メール認証再送信中にエラーが発生しました。',
        // 開発環境ではエラー詳細を含める
        ...(process.env.NODE_ENV === 'development' && {
          debug: {
            error: error instanceof Error ? error.message : String(error),
          },
        }),
      },
      { status: 500 },
    );
  }
}