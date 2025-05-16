// app/api/notifications/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();

    // 有効期限内のお知らせを取得
    const activeNotifications = await prisma.notification.findMany({
      where: {
        AND: [
          { active: true },
          { startDate: { lte: now } },
          {
            OR: [{ endDate: null }, { endDate: { gte: now } }],
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 既読ステータス確認 - 手動で関連付け
    const readStatuses = await prisma.notificationRead.findMany({
      where: {
        user_id: userId,
        notificationId: {
          in: activeNotifications.map((n) => n.id),
        },
      },
    });

    // 既読情報を含むお知らせリストを作成
    const readStatusMap = new Map(readStatuses.map((status) => [status.notificationId, true]));

    const notificationsWithReadStatus = activeNotifications.map((notification) => ({
      ...notification,
      isRead: readStatusMap.has(notification.id),
    }));

    return NextResponse.json({
      notifications: notificationsWithReadStatus,
      unreadCount: notificationsWithReadStatus.filter((n) => !n.isRead).length,
    });
  } catch (error) {
    console.error('お知らせ取得エラー:', error);
    return NextResponse.json(
      {
        error: 'お知らせの取得に失敗しました',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}