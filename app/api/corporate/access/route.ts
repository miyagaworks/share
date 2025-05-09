// app/api/corporate/access/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma, disconnectPrisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const isMobile = url.searchParams.get('mobile') === '1';
  // 'force' パラメータを使用するか削除
  // const force = url.searchParams.get('force') === '1';

  console.log(
    `[API:corporate/access] API呼び出し開始 (t=${url.searchParams.get('t')}, mobile=${isMobile})`,
  );

  let prismaConnected = false;

  try {
    // セッションチェック
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json({ hasAccess: false, error: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.user.id;

    try {
      // 最適化されたクエリ - 必要なデータのみを取得
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          adminOfTenant: {
            select: {
              id: true,
              accountStatus: true,
            },
          },
          tenant: {
            select: {
              id: true,
              accountStatus: true,
            },
          },
          subscription: {
            select: {
              plan: true,
              status: true,
            },
          },
        },
      });

      prismaConnected = true;

      if (!user) {
        return NextResponse.json(
          {
            hasAccess: false,
            error: 'User not found',
          },
          { status: 404 },
        );
      }

      // テナント情報の取得と検証
      const tenant = user.adminOfTenant || user.tenant;
      const hasTenant = !!tenant;

      // テナントステータスの確認
      const isTenantSuspended = tenant?.accountStatus === 'suspended';

      // 法人サブスクリプションのチェック
      const planLower = (user.subscription?.plan || '').toLowerCase();
      const hasCorporateSubscription =
        user.subscription &&
        (planLower.includes('business') ||
          planLower.includes('corp') ||
          planLower.includes('pro')) &&
        user.subscription.status === 'active';

      // アクセス権の判定
      const hasAccess = hasTenant && !isTenantSuspended && hasCorporateSubscription;

      // テナントIDの取得（安全に）
      const tenantId = hasTenant && tenant ? tenant.id : null;

      // ユーザーロールの決定
      const isAdmin = !!user.adminOfTenant;
      const userRole = isAdmin ? 'admin' : 'member';

      // メモリ使用量ログ（開発環境のみ）
      if (process.env.NODE_ENV === 'development') {
        const memoryUsage = process.memoryUsage();
        console.log('[API:corporate/access] メモリ使用状況:', {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        });
      }

      return NextResponse.json({
        hasAccess,
        isAdmin,
        tenantId,
        userRole,
        error: !hasAccess
          ? isTenantSuspended
            ? 'テナントが停止されています'
            : !hasTenant
              ? 'テナントが関連付けられていません'
              : '有効な法人契約がありません'
          : null,
      });
    } catch (dbError) {
      console.error('[API:corporate/access] データベースエラー:', dbError);
      return NextResponse.json(
        {
          hasAccess: false,
          error: 'Database operation failed',
          details: dbError instanceof Error ? dbError.message : String(dbError),
          code: 'DB_ERROR',
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('[API:corporate/access] エラー:', error);
    return NextResponse.json(
      {
        hasAccess: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  } finally {
    // 確実に接続を閉じる
    if (prismaConnected) {
      await disconnectPrisma();
    }
  }
}