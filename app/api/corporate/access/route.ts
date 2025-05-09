// app/api/corporate/access/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // URLからクエリパラメータを取得
    const url = new URL(request.url);
    const isMobile = url.searchParams.get('mobile') === '1';
    const timestamp = url.searchParams.get('t') || Date.now().toString();

    console.log(
      `[API:corporate/access] API呼び出し開始 (t=${timestamp}, mobile=${isMobile ? 'true' : 'false'})`,
    );

    const session = await auth();
    console.log('[API:corporate/access] 認証セッション:', session ? '取得済み' : 'なし');

    if (!session?.user?.id) {
      console.log('[API:corporate/access] 認証されていません');
      return NextResponse.json({ hasAccess: false, error: '認証されていません' }, { status: 401 });
    }

    console.log('[API:corporate/access] ユーザーID:', session.user.id);

    // ユーザーの法人テナント情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        corporateRole: true,
        adminOfTenant: {
          select: {
            id: true,
            name: true,
            accountStatus: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            accountStatus: true,
          },
        },
        subscription: {
          select: {
            id: true,
            plan: true,
            status: true,
          },
        },
      },
    });

    // ユーザーデータの詳細ログ
    console.log(
      '[API:corporate/access] ユーザー詳細データ:',
      JSON.stringify({
        id: user?.id,
        email: user?.email,
        role: user?.corporateRole,
        adminTenant: user?.adminOfTenant
          ? {
              id: user.adminOfTenant.id,
              status: user.adminOfTenant.accountStatus,
            }
          : null,
        memberTenant: user?.tenant
          ? {
              id: user.tenant.id,
              status: user.tenant.accountStatus,
            }
          : null,
        subscription: user?.subscription
          ? {
              plan: user.subscription.plan,
              status: user.subscription.status,
            }
          : null,
      }),
    );

    console.log('[API:corporate/access] ユーザー情報取得:', user ? '成功' : '失敗');

    if (!user) {
      console.log('[API:corporate/access] ユーザーが見つかりません');
      return NextResponse.json(
        { hasAccess: false, error: 'ユーザーが見つかりません' },
        { status: 404 },
      );
    }

    // 法人テナントが存在するかチェック
    const hasTenant = !!user.adminOfTenant || !!user.tenant;
    const tenant = user.adminOfTenant || user.tenant;

    console.log(
      '[API:corporate/access] テナント情報:',
      '管理者テナント:',
      !!user.adminOfTenant,
      '管理者テナントID:',
      user.adminOfTenant?.id,
      'メンバーテナント:',
      !!user.tenant,
      'メンバーテナントID:',
      user.tenant?.id,
    );

    // テナントのステータスをチェック - accountStatusを確認
    const isSuspended = tenant?.accountStatus === 'suspended';

    // 法人サブスクリプションが有効かチェック - 専用関数を使用
    const hasCorporateSubscription = checkCorporateSubscription(user.subscription);

    console.log(
      '[API:corporate/access] サブスクリプション情報:',
      'サブスクリプションあり:',
      !!user.subscription,
      'プラン:',
      user.subscription?.plan,
      'ステータス:',
      user.subscription?.status,
      'テナント停止:',
      isSuspended,
    );

    // 全ての条件を満たす場合のみアクセス権あり
    const hasAccess = hasTenant && !isSuspended && hasCorporateSubscription;

    // 問題診断用の詳細ログ
    console.log('[API:corporate/access] 詳細診断:', {
      session: session?.user?.id ? '有効' : '無効',
      user: user?.id ? '取得済み' : '取得失敗',
      hasTenant,
      tenantId: tenant?.id || 'なし',
      isSuspended,
      subscriptionPlan: user?.subscription?.plan || 'なし',
      subscriptionStatus: user?.subscription?.status || 'なし',
      hasCorporateSubscription,
      hasAccess,
      normalizedPlan: user?.subscription?.plan?.toLowerCase().trim() || 'なし',
    });

    console.log(
      '[API:corporate/access] 法人アクセス権判定:',
      'テナントあり:',
      hasTenant,
      'テナントが有効:',
      !isSuspended,
      '法人サブスクリプションあり:',
      hasCorporateSubscription,
      '→ アクセス権:',
      hasAccess,
    );

    if (!hasAccess) {
      let error = '法人プランにアップグレードしてください。';
      if (isSuspended) {
        error = 'テナントが停止されています。管理者にお問い合わせください。';
      } else if (hasTenant && !hasCorporateSubscription) {
        error = '法人プランのサブスクリプションが有効ではありません。';
      } else if (!hasTenant && hasCorporateSubscription) {
        error = '法人テナント情報が設定されていません。';
      }

      console.log('[API:corporate/access] アクセス拒否理由:', error);
      return NextResponse.json(
        {
          hasAccess: false,
          error: error,
          isAuthenticated: true,
        },
        { status: 403 },
      );
    }

    console.log('[API:corporate/access] アクセス許可、詳細テナント情報:', JSON.stringify(tenant));

    return NextResponse.json({
      hasAccess: true,
      isAdmin: !!user.adminOfTenant,
      userRole: user.adminOfTenant ? 'admin' : user.corporateRole || 'member',
      tenant: {
        id: tenant?.id,
        name: tenant?.name,
      },
      tenantId: tenant?.id, // 明示的にtenantIdも返す
      isAuthenticated: true,
    });
  } catch (error) {
    console.error('[API:corporate/access] 法人アクセス確認エラー:', error);
    return NextResponse.json(
      {
        hasAccess: false,
        error: '法人アクセス権の確認中にエラーが発生しました',
        isAuthenticated: true,
      },
      { status: 500 },
    );
  }
}

/**
 * 法人サブスクリプションが有効かどうかを判定する関数
 */
function checkCorporateSubscription(
  subscription: { plan?: string; status?: string } | null,
): boolean {
  if (!subscription) return false;

  // 詳細ログ出力
  console.log('[API:corporate/access] サブスクリプションチェック:', {
    originalPlan: subscription.plan,
    status: subscription.status,
  });

  // 有効なプラン名を配列で定義（大文字小文字や記号の違いを吸収）
  const validPlans = [
    'business',
    'business_plus',
    'business-plus',
    'businessplus',
    'enterprise',
    'corp', // 追加の可能性のある名前
    'corporate', // 追加の可能性のある名前
  ];

  // プラン名の正規化（空白削除、小文字化）
  const normalizedPlan = (subscription.plan || '').toLowerCase().trim();

  // ステータスが有効かチェック - ステータスが未設定の場合も有効と見なす（データ移行時などのケース）
  const isStatusActive = !subscription.status || subscription.status === 'active';

  // 有効なプランに含まれているかチェック - 部分一致も許可
  const isPlanValid = validPlans.some(
    (plan) =>
      normalizedPlan === plan ||
      normalizedPlan.replace(/[-_]/g, '') === plan.replace(/[-_]/g, '') ||
      normalizedPlan.includes('business') ||
      normalizedPlan.includes('corp'),
  );

  // 詳細ログ
  console.log('[API:corporate/access] サブスクリプション判定:', {
    normalizedPlan,
    isStatusActive,
    isPlanValid,
    result: isStatusActive && isPlanValid,
  });

  return isStatusActive && isPlanValid;
}