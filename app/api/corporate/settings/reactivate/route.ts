// app/api/corporate/settings/reactivate/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // ユーザーとテナント情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        adminOfTenant: true,
        tenant: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // テナント情報を取得（管理者または一般メンバーのいずれか）
    const tenant = user.adminOfTenant || user.tenant;

    if (!tenant) {
      return NextResponse.json({ error: '法人テナント情報が見つかりません' }, { status: 404 });
    }

    // 管理者権限の確認（管理者のみが再アクティブ化できる）
    if (!user.adminOfTenant) {
      return NextResponse.json(
        { error: 'アカウントの再アクティブ化には管理者権限が必要です' },
        { status: 403 },
      );
    }

    // 現在のステータスが suspended の場合のみ再アクティブ化
    if (tenant.accountStatus !== 'suspended') {
      return NextResponse.json(
        { error: 'アカウントは一時停止状態ではありません' },
        { status: 400 },
      );
    }

    // テナントを再アクティブ化
    const updatedTenant = await prisma.corporateTenant.update({
      where: { id: tenant.id },
      data: {
        accountStatus: 'active',
      },
    });

    // 監査ログの記録（オプション）
    // await prisma.auditLog.create({
    //   data: {
    //     action: 'TENANT_REACTIVATED',
    //     userId: session.user.id,
    //     tenantId: tenant.id,
    //     metadata: {
    //       previousStatus: tenant.accountStatus,
    //       newStatus: 'active',
    //     },
    //   },
    // });

    return NextResponse.json({
      success: true,
      message: 'アカウントを再アクティブ化しました',
      status: updatedTenant.accountStatus,
    });
  } catch (error) {
    console.error('アカウント再アクティブ化エラー:', error);
    return NextResponse.json(
      { error: 'アカウントの再アクティブ化に失敗しました' },
      { status: 500 },
    );
  }
}
