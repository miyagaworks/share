// app/api/corporate/access/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma, disconnectPrisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const isMobile = url.searchParams.get('mobile') === '1';

  console.log(
    `[API:corporate/access] API呼び出し開始 (t=${url.searchParams.get('t')}, mobile=${isMobile})`,
  );

  try {
    // セッションチェック
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json({ hasAccess: false, error: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.user.id;

    try {
      // ユーザー情報を取得
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          subscriptionStatus: true,
          corporateRole: true, // 追加：法人ロール情報
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

      if (!user) {
        return NextResponse.json(
          {
            hasAccess: false,
            error: 'User not found',
          },
          { status: 404 },
        );
      }

      // 管理者メールアドレスリスト
      const ADMIN_EMAILS = ['admin@sns-share.com'];
      const isAdminEmail = ADMIN_EMAILS.includes(user.email.toLowerCase());

      // 管理者メールアドレスの場合はスーパー管理者権限を付与
      if (isAdminEmail) {
        console.log(
          `[API:corporate/access] 管理者メールユーザーにスーパー管理者権限を付与 (userId=${userId})`,
        );
        return NextResponse.json({
          hasAccess: true,
          isAdmin: true,
          isSuperAdmin: true,
          tenantId: user.adminOfTenant?.id || `admin-tenant-${userId}`,
          userRole: 'admin',
          error: null,
        });
      }

      // 永久利用権ユーザーの場合、即時アクセス権を付与（管理者権限なし）
      if (user.subscriptionStatus === 'permanent') {
        console.log(`[API:corporate/access] 永久利用権ユーザーにアクセス権付与 (userId=${userId})`);
        return NextResponse.json({
          hasAccess: true,
          isAdmin: true,
          isSuperAdmin: false,
          tenantId: `virtual-tenant-${userId}`,
          userRole: 'admin',
          error: null,
        });
      }

      // テナント情報の取得と検証
      const tenant = user.adminOfTenant || user.tenant;
      const hasTenant = !!tenant;

      // テナントIDの取得（安全に）
      const tenantId = tenant?.id || null;

      // テナントステータスの確認
      const isTenantSuspended = tenant?.accountStatus === 'suspended';

      // 法人サブスクリプションのチェック - より厳密に判定
      const planLower = (user.subscription?.plan || '').toLowerCase();

      // 完全一致の法人プラン判定（部分一致ではなく）
      const corporatePlans = [
        'business',
        'business_plus',
        'business_yearly',
        'enterprise',
        'enterprise_yearly',
        'starter',
        'starter_yearly',
      ];

      const hasCorporateSubscription =
        user.subscription &&
        user.subscription.status === 'active' &&
        (corporatePlans.includes(planLower) ||
          // 互換性のための後方互換チェック
          (planLower.includes('corp') && !planLower.includes('personal')) ||
          planLower.includes('pro'));

      // アクセス権の判定
      const hasAccess = hasTenant && !isTenantSuspended && hasCorporateSubscription;

      // ユーザーロールの決定（より詳細に）
      const isAdmin = !!user.adminOfTenant;
      let userRole = null;

      if (isAdmin) {
        userRole = 'admin';
      } else if (hasTenant && user.corporateRole === 'member') {
        userRole = 'member'; // 明示的にmemberロールを設定
      } else if (hasTenant) {
        userRole = 'member'; // テナントがあればmemberとして扱う
      }

      // hasAccessの判定を拡張（memberロールでもアクセス許可）
      const finalHasAccess =
        hasAccess || (hasTenant && !isTenantSuspended && userRole === 'member');

      console.log('[API:corporate/access] アクセス権判定結果:', {
        userId,
        hasTenant,
        isTenantSuspended,
        hasCorporateSubscription,
        corporateRole: user.corporateRole,
        userRole,
        finalHasAccess,
        tenantId,
      });

      // メモリ使用量ログ（開発環境のみ）
      if (process.env.NODE_ENV === 'development') {
        const memoryUsage = process.memoryUsage();
        console.log('[API:corporate/access] メモリ使用状況:', {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        });
      }

      return NextResponse.json({
        hasAccess: finalHasAccess,
        isAdmin,
        isSuperAdmin: isAdminEmail,
        tenantId,
        userRole,
        error: !finalHasAccess
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
    // Prismaに接続していたらクリーンアップ
    try {
      await disconnectPrisma();
    } catch (cleanupError) {
      console.error('[API:corporate/access] クリーンアップエラー:', cleanupError);
    }
  }
}