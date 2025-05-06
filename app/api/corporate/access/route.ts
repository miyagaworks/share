export const dynamic = "force-dynamic";
// app/api/corporate/access/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * ユーザーの法人アクセス権を確認するためのAPI
 * クライアントサイドで使用することを想定
 */
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
      include: {
        adminOfTenant: true,
        tenant: true,
        subscription: true,
      },
    });

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
    console.log(
      '[API:corporate/access] テナント情報:',
      '管理者テナント:',
      !!user.adminOfTenant,
      'メンバーテナント:',
      !!user.tenant,
    );

    // 法人サブスクリプションが有効かチェック
    const hasCorporateSubscription =
      user.subscription &&
      (user.subscription.plan === 'business' ||
        user.subscription.plan === 'business_plus' || // アンダースコア形式も対応
        user.subscription.plan === 'business-plus' || // ハイフン形式も対応
        user.subscription.plan === 'enterprise') &&
      user.subscription.status === 'active';

    console.log(
      '[API:corporate/access] サブスクリプション情報:',
      'サブスクリプションあり:',
      !!user.subscription,
      'プラン:',
      user.subscription?.plan,
      'ステータス:',
      user.subscription?.status,
    );

    // 両方の条件を満たす場合のみアクセス権あり
    const hasAccess = hasTenant && hasCorporateSubscription;
    console.log(
      '[API:corporate/access] 法人アクセス権判定:',
      'テナントあり:',
      hasTenant,
      '法人サブスクリプションあり:',
      hasCorporateSubscription,
      '→ アクセス権:',
      hasAccess,
    );

    if (!hasAccess) {
      let error = '法人プランにアップグレードしてください。';
      if (hasTenant && !hasCorporateSubscription) {
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

    // テナント情報を取得（管理者または一般メンバーのいずれか）
    const tenant = user.adminOfTenant || user.tenant;
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