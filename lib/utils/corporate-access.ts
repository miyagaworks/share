// lib/utils/corporate-access.ts

import { prisma } from '@/lib/prisma';

// User型の利用が不要なため削除

/**
 * ユーザーが法人アクセス権を持っているかどうかを確認する
 * @param userId - ユーザーID
 * @returns 法人アクセス権があるかどうかのブーリアン値と追加情報
 */
export async function checkCorporateAccess(userId: string) {
  try {
    // ユーザーの法人テナント情報を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        adminOfTenant: true,
        tenant: true,
        subscription: true,
      },
    });

    if (!user) {
      return {
        hasCorporateAccess: false,
        error: 'ユーザーが見つかりません',
      };
    }

    // 法人テナントが存在するかチェック
    const hasTenant = !!user.adminOfTenant || !!user.tenant;

    // 法人サブスクリプションが有効かチェック
    const hasCorporateSubscription =
      user.subscription &&
      (user.subscription.plan === 'business' ||
        user.subscription.plan === 'business-plus' ||
        user.subscription.plan === 'enterprise') &&
      user.subscription.status === 'active';

    // 両方の条件を満たす場合のみアクセス権あり
    const hasCorporateAccess = hasTenant && hasCorporateSubscription;

    return {
      hasCorporateAccess,
      isAdmin: !!user.adminOfTenant,
      tenant: user.adminOfTenant || user.tenant,
      subscription: user.subscription,
      error: hasCorporateAccess ? null : '有効な法人契約がありません',
    };
  } catch (error) {
    console.error('法人アクセス権チェックエラー:', error);
    return {
      hasCorporateAccess: false,
      error: '法人アクセス権の確認中にエラーが発生しました',
    };
  }
}

/**
 * ユーザーオブジェクトから法人アクセス権があるかどうかを判定する（クライアントサイド用）
 * @param user - ユーザーオブジェクト
 * @returns 法人アクセス権があるかどうか
 */
interface CorporateUser {
  adminOfTenant?: unknown;
  tenant?: unknown;
  tenantId?: string;
  subscription?: {
    plan?: string;
    status?: string;
  };
}

export function hasCorporateAccess(user: CorporateUser | null | undefined): boolean {
  if (!user) return false;

  // テナント情報チェック
  const hasTenant = !!(user.adminOfTenant || user.tenant || user.tenantId);

  // サブスクリプションチェック（クライアントで利用できる情報のみで判断）
  const hasCorporateSubscription = !!(
    user.subscription &&
    user.subscription.plan &&
    ['business', 'business-plus', 'enterprise'].includes(user.subscription.plan) &&
    user.subscription.status === 'active'
  );

  return hasTenant && hasCorporateSubscription;
}