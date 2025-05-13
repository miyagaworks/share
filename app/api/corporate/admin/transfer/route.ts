// app/api/corporate/admin/transfer/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    console.log('[API] /api/corporate/admin/transfer POSTリクエスト受信');

    // セッション認証チェック
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const userId = session.user.id;

    // リクエストボディを取得
    const { newAdminId } = await request.json();

    if (!newAdminId) {
      return NextResponse.json({ error: '新しい管理者IDが必要です' }, { status: 400 });
    }

    // 現在のテナント情報を取得
    const currentTenant = await prisma.corporateTenant.findFirst({
      where: { adminId: userId },
    });

    if (!currentTenant) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    // 新しい管理者が同じテナントに所属しているか確認
    const newAdmin = await prisma.user.findUnique({
      where: {
        id: newAdminId,
        tenantId: currentTenant.id,
      },
    });

    if (!newAdmin) {
      return NextResponse.json({ error: '指定されたユーザーが見つかりません' }, { status: 404 });
    }

    // トランザクションで管理者を変更
    await prisma.$transaction([
      // 新しい管理者の役割を更新
      prisma.user.update({
        where: { id: newAdminId },
        data: { corporateRole: 'admin' },
      }),
      // テナントの管理者を更新
      prisma.corporateTenant.update({
        where: { id: currentTenant.id },
        data: { adminId: newAdminId },
      }),
      // 元の管理者の役割を変更
      prisma.user.update({
        where: { id: userId },
        data: { corporateRole: 'member' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: '管理者権限を移譲しました',
    });
  } catch (error) {
    console.error('[API] 管理者権限移譲エラー:', error);
    return NextResponse.json(
      {
        error: '管理者権限の移譲に失敗しました',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
