// app/api/notifications/read/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from "@/lib/utils/logger";
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { markNotificationAsRead } from '@/lib/utils/notification-helpers';
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
    try {
      // 専用ヘルパー関数を使用
      await markNotificationAsRead(notificationId, userId);
      return NextResponse.json({
        success: true,
        message: 'お知らせを既読にしました',
      });
    } catch (error) {
      logger.error('既読設定エラー:', error);
      return NextResponse.json(
        {
          error: '既読設定処理中にエラーが発生しました',
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      );
    }
  } catch (error) {
    logger.error('お知らせ既読設定エラー:', error);
    return NextResponse.json({ error: 'お知らせの既読設定に失敗しました' }, { status: 500 });
  }
}