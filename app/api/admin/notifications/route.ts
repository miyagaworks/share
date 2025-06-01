// app/api/admin/notifications/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from "@/lib/utils/logger";
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isAdminUser } from '@/lib/utils/admin-access-server';
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }
    // 管理者チェック
    const isAdmin = await isAdminUser(session.user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: '管理者権限がありません' }, { status: 403 });
    }
    // お知らせ一覧を取得（作成日時の降順）
    const notifications = await prisma.notification.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json({ notifications });
  } catch (error) {
    logger.error('お知らせ一覧取得エラー:', error);
    return NextResponse.json({ error: 'お知らせ一覧の取得に失敗しました' }, { status: 500 });
  }
}