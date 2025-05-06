// lib/utils/corporate-access.ts
import { prisma } from '@/lib/prisma';
import { logger } from './logger';

/**
 * ユーザーが法人アクセス権を持っているかどうかを確認する（最適化版）
 */
export async function checkCorporateAccess(userId: string) {
  try {
    // 必要なデータのみを取得するよう最適化
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

    if (!user) {
      logger.warn('法人アクセスチェック：ユーザー未検出', { userId });
      return {
        hasCorporateAccess: false,
        error: 'ユーザーが見つかりません',
      };
    }

    // 法人テナントが存在するかチェック
    const hasTenant = !!user.adminOfTenant || !!user.tenant;

    // テナントが停止状態かチェック
    const isTenantSuspended =
      (user.adminOfTenant && user.adminOfTenant.accountStatus === 'suspended') ||
      (user.tenant && user.tenant.accountStatus === 'suspended');

    // 法人サブスクリプションが有効かチェック
    const hasCorporateSubscription =
      user.subscription &&
      ['business', 'business-plus', 'business_plus', 'enterprise'].includes(
        user.subscription.plan || '',
      ) &&
      user.subscription.status === 'active';

    // テナントが存在し、停止されておらず、有効なサブスクリプションがある場合のみアクセス権あり
    const hasCorporateAccess = hasTenant && !isTenantSuspended && hasCorporateSubscription;

    if (!hasCorporateAccess) {
      logger.info('法人アクセス拒否', {
        userId,
        hasTenant,
        isTenantSuspended,
        hasCorporateSubscription,
      });
    }

    return {
      hasCorporateAccess,
      isAdmin: !!user.adminOfTenant,
      tenant: user.adminOfTenant || user.tenant,
      subscription: user.subscription,
      error: !hasCorporateAccess
        ? isTenantSuspended
          ? 'テナントが停止されています'
          : !hasTenant
            ? 'テナントが関連付けられていません'
            : '有効な法人契約がありません'
        : null,
    };
  } catch (error) {
    logger.error('法人アクセス権チェックエラー', error);
    return {
      hasCorporateAccess: false,
      error: '法人アクセス権の確認中にエラーが発生しました',
    };
  }
}