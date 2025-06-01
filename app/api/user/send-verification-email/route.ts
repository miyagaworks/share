// app/api/auth/send-verification-email/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({
        message: 'メールアドレスは既に認証済みです',
        alreadyVerified: true,
      });
    }

    logger.info('メール認証送信要求:', {
      userId: user.id,
      email: user.email,
    });

    // 仮の実装
    return NextResponse.json({
      message: 'メール認証リンクを送信しました',
      sent: true,
    });
  } catch (error) {
    logger.error('メール認証送信エラー:', error);
    return NextResponse.json({ error: 'メール認証送信に失敗しました' }, { status: 500 });
  }
}