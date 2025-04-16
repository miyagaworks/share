// app/api/corporate/access/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * ユーザーの法人アクセス権を確認するためのAPI
 * クライアントサイドで使用することを想定
 */
export async function GET() {
  try {
    console.log('[API:corporate/access] API呼び出し開始');
    const session = await auth();
    console.log('[API:corporate/access] 認証セッション:', session ? '取得済み' : 'なし');

    if (!session?.user?.id) {
      console.log('[API:corporate/access] 認証されていません');
      return NextResponse.json(
        { hasCorporateAccess: false, error: '認証されていません' },
        { status: 401 },
      );
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
        { hasCorporateAccess: false, error: 'ユーザーが見つかりません' },
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
        user.subscription.plan === 'business-plus' ||
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
    const hasCorporateAccess = hasTenant && hasCorporateSubscription;
    console.log(
      '[API:corporate/access] 法人アクセス権判定:',
      'テナントあり:',
      hasTenant,
      '法人サブスクリプションあり:',
      hasCorporateSubscription,
      '→ アクセス権:',
      hasCorporateAccess,
    );

    if (!hasCorporateAccess) {
      let error = '法人プランにアップグレードしてください。';
      if (hasTenant && !hasCorporateSubscription) {
        error = '法人プランのサブスクリプションが有効ではありません。';
      } else if (!hasTenant && hasCorporateSubscription) {
        error = '法人テナント情報が設定されていません。';
      }

      console.log('[API:corporate/access] アクセス拒否理由:', error);
      return NextResponse.json(
        {
          hasCorporateAccess: false,
          error: error,
          isAuthenticated: true,
        },
        { status: 403 },
      );
    }

    // テナント情報を取得（管理者または一般メンバーのいずれか）
    const tenant = user.adminOfTenant || user.tenant;
    console.log('[API:corporate/access] アクセス許可、テナント情報:', tenant?.name);

    return NextResponse.json({
      hasCorporateAccess: true,
      isAdmin: !!user.adminOfTenant,
      userRole: user.adminOfTenant ? 'admin' : user.corporateRole || 'member',
      tenant: {
        id: tenant?.id,
        name: tenant?.name,
      },
      isAuthenticated: true,
    });
  } catch (error) {
    console.error('[API:corporate/access] 法人アクセス確認エラー:', error);
    return NextResponse.json(
      {
        hasCorporateAccess: false,
        error: '法人アクセス権の確認中にエラーが発生しました',
        isAuthenticated: true,
      },
      { status: 500 },
    );
  }
}