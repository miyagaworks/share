// app/api/notifications/route.ts (修正版 - エラー解決)
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// 型定義
interface Notification {
  id: string;
  title: string;
  content: string;
  type: string;
  priority: string;
  imageUrl: string | null;
  startDate: Date;
  endDate: Date | null;
  targetGroup: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface NotificationWithReadStatus extends Notification {
  isRead: boolean;
}

interface ReadStatus {
  notificationId: string;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    const userId: string = session.user.id;
    logger.debug('通知API: 認証済みユーザー:', userId);

    try {
      // 🔧 修正: Prismaクエリを簡素化
      const activeNotifications = await prisma.notification.findMany({
        where: {
          active: true,
          startDate: { lte: new Date() },
          OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      logger.debug('通知API: 取得したお知らせ数:', activeNotifications.length);

      // 🔧 修正: 既読ステータス取得を簡素化
      let readStatuses: ReadStatus[] = [];
      try {
        readStatuses = await prisma.notificationRead.findMany({
          where: {
            user_id: userId,
          },
          select: {
            notificationId: true,
          },
        });
      } catch (readError) {
        logger.error('通知API: 既読ステータス取得エラー:', readError);
        // 既読情報が取得できなくても処理を続行
      }

      logger.debug('通知API: 既読ステータス取得数:', readStatuses.length);

      // 既読情報をマップに変換
      const readStatusMap = new Map(
        readStatuses.map((status: ReadStatus) => [status.notificationId, true]),
      );

      // お知らせリストに既読情報を追加
      const notificationsWithReadStatus: NotificationWithReadStatus[] = activeNotifications.map(
        (notification: Notification) => ({
          ...notification,
          isRead: readStatusMap.has(notification.id),
        }),
      );

      const unreadCount = notificationsWithReadStatus.filter(
        (n: NotificationWithReadStatus) => !n.isRead,
      ).length;

      logger.debug('通知API: 未読数:', unreadCount);

      return NextResponse.json({
        notifications: notificationsWithReadStatus,
        unreadCount,
      });
    } catch (dbError) {
      logger.error('通知API: データベースクエリエラー:', dbError);

      // 🔧 修正: フォールバック処理を改善
      return NextResponse.json(
        {
          error: 'お知らせの取得に失敗しました',
          notifications: [],
          unreadCount: 0,
          details:
            process.env.NODE_ENV === 'development'
              ? dbError instanceof Error
                ? dbError.message
                : String(dbError)
              : undefined,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    logger.error('通知API: 全体エラー:', error);
    return NextResponse.json(
      {
        error: 'お知らせの取得に失敗しました',
        notifications: [],
        unreadCount: 0,
        details:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 },
    );
  }
}