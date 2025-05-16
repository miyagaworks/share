// app/api/notifications/read/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    const userId = session.user.id;
    const { notificationId } = await request.json();

    if (!notificationId) {
      return NextResponse.json({ error: 'お知らせIDが必要です' }, { status: 400 });
    }

    // お知らせの存在確認
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return NextResponse.json({ error: 'お知らせが見つかりません' }, { status: 404 });
    }

    // 既読状態の作成（既に存在する場合は無視）
    await prisma.notificationRead.upsert({
      where: {
        notificationId_user_id: {
          notificationId,
          user_id: userId,
        },
      },
      update: {}, // 既に存在する場合は更新しない
      create: {
        notificationId,
        user_id: userId,
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'お知らせを既読にしました',
    });
  } catch (error) {
    console.error('お知らせ既読設定エラー:', error);
    return NextResponse.json({ error: 'お知らせの既読設定に失敗しました' }, { status: 500 });
  }
}