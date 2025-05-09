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

    // セッション取得前のヘッダー情報をログ出力（デバッグ用）
    console.log('[API:corporate/access] リクエストヘッダー:', {
      cookie: request.headers.get('cookie')?.substring(0, 50) + '...',
      authorization: request.headers.get('authorization') ? '存在する' : 'なし',
    });

    // Next-Authセッション取得
    const session = await auth();

    // セッションのデバッグ出力
    console.log('[API:corporate/access] 認証セッション詳細:', {
      認証状態: session ? '認証済み' : '未認証',
      userId: session?.user?.id || 'なし',
      expires: session?.expires || 'なし',
    });

    if (!session?.user?.id) {
      console.log('[API:corporate/access] 認証されていません - 401返却');
      return NextResponse.json(
        {
          hasAccess: false,
          error: '認証されていません',
          timestamp: Date.now(),
        },
        {
          status: 401,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            Pragma: 'no-cache',
          },
        },
      );
    }

    console.log('[API:corporate/access] ユーザーID:', session.user.id);

    try {
      // ユーザーの詳細情報を取得
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

      // ユーザー情報の詳細ログ
      console.log(
        '[API:corporate/access] ユーザー詳細:',
        JSON.stringify({
          id: user?.id,
          email: user?.email,
          role: user?.corporateRole,
          hasAdminTenant: !!user?.adminOfTenant,
          hasMemberTenant: !!user?.tenant,
          subscription: user?.subscription
            ? {
                plan: user.subscription.plan,
                status: user.subscription.status,
              }
            : null,
        }),
      );

      if (!user) {
        console.log('[API:corporate/access] ユーザーが見つかりません - 404返却');
        return NextResponse.json(
          { hasAccess: false, error: 'ユーザーが見つかりません' },
          { status: 404 },
        );
      }

      // 法人テナント情報の取得と確認
      const hasTenant = !!user.adminOfTenant || !!user.tenant;
      const tenant = user.adminOfTenant || user.tenant;
      const isSuspended = tenant?.accountStatus === 'suspended';

      // サブスクリプションチェック
      const subscriptionStatus = checkSubscriptionStatus(user.subscription);
      const hasCorporateSubscription = subscriptionStatus.isValid;

      // 詳細診断ログ
      console.log('[API:corporate/access] 法人アクセス診断:', {
        hasTenant,
        tenantType: user.adminOfTenant ? 'admin' : user.tenant ? 'member' : 'none',
        tenantId: tenant?.id || 'なし',
        tenantStatus: tenant?.accountStatus || 'なし',
        isSuspended,
        subscriptionPlan: user.subscription?.plan || 'なし',
        subscriptionStatus: user.subscription?.status || 'なし',
        normalizedPlan: subscriptionStatus.normalizedPlan,
        hasCorporateAccess: hasCorporateSubscription,
      });

      // デフォルトでアクセス許可 - 開発環境や特定条件では常に許可
      const isDevOrTest =
        process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_ALLOW_CORPORATE === 'true';

      // アクセス判定 - 開発/テスト環境では常に許可
      const hasAccess = isDevOrTest || (hasTenant && !isSuspended && hasCorporateSubscription);

      console.log('[API:corporate/access] 最終アクセス判定:', {
        isDevOrTest,
        hasTenant,
        notSuspended: !isSuspended,
        hasCorporateSubscription,
        finalDecision: hasAccess ? '許可' : '拒否',
      });

      // アクセス拒否の場合
      if (!hasAccess) {
        let error = '法人プランにアップグレードしてください。';
        if (isSuspended) {
          error = 'テナントが停止されています。管理者にお問い合わせください。';
        } else if (hasTenant && !hasCorporateSubscription) {
          error = '法人プランのサブスクリプションが有効ではありません。';
        } else if (!hasTenant && hasCorporateSubscription) {
          error = '法人テナント情報が設定されていません。';
        }

        console.log('[API:corporate/access] アクセス拒否:', error);
        return NextResponse.json(
          {
            hasAccess: false,
            error: error,
            isAuthenticated: true,
            debug: isDevOrTest
              ? {
                  env: process.env.NODE_ENV,
                  allowCorporate: process.env.NEXT_PUBLIC_ALLOW_CORPORATE,
                }
              : undefined,
          },
          {
            status: 403,
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate',
              Pragma: 'no-cache',
            },
          },
        );
      }

      // アクセス許可
      return NextResponse.json(
        {
          hasAccess: true,
          isAdmin: !!user.adminOfTenant,
          userRole: user.adminOfTenant ? 'admin' : user.corporateRole || 'member',
          tenant: {
            id: tenant?.id,
            name: tenant?.name,
          },
          tenantId: tenant?.id, // 明示的にtenantIdも返す
          isAuthenticated: true,
        },
        {
          headers: {
            'Cache-Control': 'private, max-age=30',
          },
        },
      );
    } catch (dbError) {
      console.error('[API:corporate/access] データベースエラー:', dbError);
      return NextResponse.json(
        { hasAccess: false, error: 'ユーザー情報の取得に失敗しました' },
        { status: 500 },
      );
    }
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
 * サブスクリプションのステータスを詳細にチェックする関数
 */
function checkSubscriptionStatus(subscription: { plan?: string; status?: string } | null): {
  isValid: boolean;
  normalizedPlan: string;
  reason?: string;
} {
  if (!subscription) {
    return {
      isValid: false,
      normalizedPlan: 'none',
      reason: 'サブスクリプションが存在しません',
    };
  }

  // デバッグ情報
  console.log('[サブスクリプション検証]:', {
    originalPlan: subscription.plan,
    originalStatus: subscription.status,
  });

  // プラン名の正規化（空白削除、小文字化）
  const normalizedPlan = (subscription.plan || '').toLowerCase().trim();

  // 有効なプラン名パターン
  const validPlans = [
    'business',
    'business_plus',
    'business-plus',
    'businessplus',
    'enterprise',
    'corp',
    'corporate',
    'pro', // 追加のプラン名
  ];

  // ステータスチェック - null/undefinedや'active'以外は無効
  const isStatusActive = subscription.status === 'active';

  // プラン名の検証 - 部分一致を含む柔軟な検証
  const isPlanValid = validPlans.some(
    (plan) =>
      normalizedPlan === plan ||
      normalizedPlan.replace(/[-_]/g, '') === plan.replace(/[-_]/g, '') ||
      normalizedPlan.includes('business') ||
      normalizedPlan.includes('corp') ||
      normalizedPlan.includes('pro'),
  );

  // 結果ログ
  console.log('[サブスクリプション判定]:', {
    normalizedPlan,
    isStatusActive,
    isPlanValid,
    result: isStatusActive && isPlanValid,
  });

  // 理由を含むステータス判定を返す
  if (!isStatusActive) {
    return {
      isValid: false,
      normalizedPlan,
      reason: 'サブスクリプションのステータスが有効ではありません',
    };
  }

  if (!isPlanValid) {
    return {
      isValid: false,
      normalizedPlan,
      reason: '法人プランではありません',
    };
  }

  return {
    isValid: true,
    normalizedPlan,
  };
}