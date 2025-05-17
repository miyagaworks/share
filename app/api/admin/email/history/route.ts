// app/api/admin/email/history/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isAdminUser } from '@/lib/utils/admin-access';

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

    // 送信履歴を取得（最新順）
    const history = await prisma.adminEmailLog.findMany({
      select: {
        id: true,
        subject: true,
        title: true,
        targetGroup: true,
        sentCount: true,
        failCount: true,
        sentAt: true,
        sender: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        sentAt: 'desc',
      },
      take: 50, // 最新50件を取得
    });

    return NextResponse.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error('メール送信履歴取得エラー:', error);
    return NextResponse.json(
      {
        error: '履歴取得中にエラーが発生しました',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}