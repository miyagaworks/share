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

export async function POST(request: Request) {
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

    // リクエストボディからIDリストを取得
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: '削除する履歴IDのリストが必要です' }, { status: 400 });
    }

    // 履歴を一括削除
    const result = await prisma.adminEmailLog.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `${result.count}件のメール送信履歴を削除しました`,
    });
  } catch (error) {
    console.error('メール履歴一括削除エラー:', error);
    return NextResponse.json(
      {
        error: 'メール履歴の一括削除に失敗しました',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}