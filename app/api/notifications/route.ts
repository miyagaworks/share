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

    // ここを修正: ユーザーIDを文字列として確実に扱う
    const userId = String(session.user.id);
    console.log('認証済みユーザー:', userId);

    try {
      // 有効期限内のお知らせを取得
      const activeNotifications = await prisma.notification.findMany({
        where: {
          active: true,
          // 日付フィルターを追加
          startDate: { lte: new Date() }, // 現在時刻以前に開始
          OR: [
            { endDate: null }, // 終了日なし
            { endDate: { gte: new Date() } }, // または現在時刻より後に終了
          ],
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      console.log('取得したお知らせ:', activeNotifications.length);

      try {
        // 既読ステータス確認
        const readStatuses = await prisma.notificationRead.findMany({
          where: {
            user_id: userId,
          },
          select: {
            notificationId: true,
          },
        });

        console.log('既読ステータス取得:', readStatuses.length);

        // 既読情報を含むお知らせリストを作成
        const readStatusMap = new Map(readStatuses.map((status) => [status.notificationId, true]));

        const notificationsWithReadStatus = activeNotifications.map((notification) => ({
          ...notification,
          isRead: readStatusMap.has(notification.id),
        }));

        console.log('未読数:', notificationsWithReadStatus.filter((n) => !n.isRead).length);

        return NextResponse.json({
          notifications: notificationsWithReadStatus,
          unreadCount: notificationsWithReadStatus.filter((n) => !n.isRead).length,
        });
      } catch (readError) {
        console.error('既読状態取得エラー:', readError);
        // 既読状態がなくてもお知らせは返す
        return NextResponse.json({
          notifications: activeNotifications.map((n) => ({ ...n, isRead: false })),
          unreadCount: activeNotifications.length,
          warning: '既読状態の取得に失敗しました',
        });
      }
    } catch (dbError) {
      console.error('データベースクエリエラー:', dbError);
      return NextResponse.json(
        {
          error: 'お知らせの取得に失敗しました',
          details: dbError instanceof Error ? dbError.message : String(dbError),
        },
        { status: 500 },
      );
    }
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