// app/api/admin/email/history/[id]/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from "@/lib/utils/logger";
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isAdminUser } from '@/lib/utils/admin-access-server';
// 送信履歴削除API
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const emailLogId = params.id;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }
    // 管理者チェック
    const isAdmin = await isAdminUser(session.user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: '管理者権限がありません' }, { status: 403 });
    }
    // 履歴の存在確認
    const existingLog = await prisma.adminEmailLog.findUnique({
      where: { id: emailLogId },
    });
    if (!existingLog) {
      return NextResponse.json({ error: '指定された履歴が見つかりません' }, { status: 404 });
    }
    // 履歴を削除
    await prisma.adminEmailLog.delete({
      where: { id: emailLogId },
    });
    return NextResponse.json({
      success: true,
      message: 'メール送信履歴を削除しました',
    });
  } catch (error) {
    logger.error('メール履歴削除エラー:', error);
    return NextResponse.json(
      {
        error: 'メール履歴の削除に失敗しました',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
// 複数履歴の一括削除API
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
    const { ids } = (await request.json()) as { ids: string[] };
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
    logger.error('メール履歴一括削除エラー:', error);
    return NextResponse.json(
      {
        error: 'メール履歴の一括削除に失敗しました',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}