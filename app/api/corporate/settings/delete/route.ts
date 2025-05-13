// app/api/corporate/settings/delete/route.ts
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
      },
    });

    if (!user || !user.adminOfTenant) {
      return NextResponse.json(
        { error: 'アカウントの削除には管理者権限が必要です' },
        { status: 403 },
      );
    }

    const tenantId = user.adminOfTenant.id;

    // トランザクションを使用して一連の削除操作を実行
    // これにより、途中でエラーが発生した場合に全ての操作がロールバックされる
    await prisma.$transaction(async (tx) => {
      // 1. まず部署を削除
      await tx.department.deleteMany({
        where: {
          tenantId: tenantId,
        },
      });

      // 2. テナントに所属するユーザーのテナント関連情報をクリア
      await tx.user.updateMany({
        where: {
          tenantId: tenantId,
        },
        data: {
          tenantId: null,
          corporateRole: null,
          departmentId: null,
        },
      });

      // 3. 管理者のテナント関連情報をクリア
      await tx.user.update({
        where: {
          id: session.user.id,
        },
        data: {
          adminOfTenant: {
            disconnect: true,
          },
        },
      });

      // 4. サブスクリプション情報の取得（削除前に保存しておく）
      const tenant = await tx.corporateTenant.findUnique({
        where: { id: tenantId },
        include: {
          subscription: true,
        },
      });

      const subscriptionId = tenant?.subscription?.id;

      // 5. テナントを削除
      await tx.corporateTenant.delete({
        where: {
          id: tenantId,
        },
      });

      // 6. サブスクリプションの状態を更新（オプション）
      if (subscriptionId) {
        await tx.subscription.update({
          where: {
            id: subscriptionId,
          },
          data: {
            status: 'canceled',
            canceledAt: new Date(),
            cancelReason: 'Tenant deleted by user',
          },
        });
      }

      // 7. 監査ログに記録（オプション）
      // await tx.auditLog.create({
      //   data: {
      //     action: 'TENANT_DELETED',
      //     userId: session.user.id,
      //     metadata: {
      //       tenantId: tenantId,
      //       tenantName: tenant?.name,
      //       deletedAt: new Date().toISOString(),
      //     },
      //   },
      // });
    });

    return NextResponse.json({
      success: true,
      message: 'アカウントを完全に削除しました',
      redirectTo: '/dashboard',
    });
  } catch (error) {
    console.error('アカウント削除エラー:', error);
    return NextResponse.json({ error: 'アカウントの削除に失敗しました' }, { status: 500 });
  }
}
