export const dynamic = "force-dynamic";
// app/api/corporate/settings/suspend/route.ts
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
      },
    });

    if (!user || !user.adminOfTenant) {
      return NextResponse.json(
        { error: 'アカウントの一時停止には管理者権限が必要です' },
        { status: 403 },
      );
    }

    const tenantId = user.adminOfTenant.id;

    // テナントを一時停止状態に更新
    const updatedTenant = await prisma.corporateTenant.update({
      where: { id: tenantId },
      data: {
        accountStatus: 'suspended',
      },
    });

    // 監査ログの記録（オプション）
    // await prisma.auditLog.create({
    //   data: {
    //     action: 'TENANT_SUSPENDED',
    //     userId: session.user.id,
    //     tenantId: tenantId,
    //     metadata: {
    //       reason: req.body?.reason || 'User requested suspension',
    //     },
    //   },
    // });

    // 関連するユーザーにメール通知を送るなどの処理も可能
    // if (updatedTenant.notificationSettings?.email?.securityAlerts) {
    //   // メール通知処理
    // }

    return NextResponse.json({
      success: true,
      message: 'アカウントを一時停止しました',
      status: updatedTenant.accountStatus,
    });
  } catch (error) {
    console.error('アカウント一時停止エラー:', error);
    return NextResponse.json({ error: 'アカウントの一時停止に失敗しました' }, { status: 500 });
  }
}