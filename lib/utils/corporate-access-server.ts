// lib/utils/corporate-access-server.ts
// サーバーサイド専用の法人アクセス機能
import { prisma } from '@/lib/prisma';
import { logger } from './logger';
/**
 * ユーザーが法人アクセス権を持っているかどうかを確認する（サーバーサイド専用）
 * この関数は API Routes、Server Components、Middleware でのみ使用してください
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
            maxUsers: true, // 🔥 この行を追加
          },
        },
        tenant: {
          select: {
            id: true,
            accountStatus: true,
            maxUsers: true, // 🔥 この行を追加
          },
        },
        subscription: {
          select: {
            plan: true,
            status: true,
          },
        },
        subscriptionStatus: true, // 永久利用権ステータス
      },
    });
    if (!user) {
      logger.warn('法人アクセスチェック：ユーザー未検出', { userId });
      return {
        hasCorporateAccess: false,
        error: 'ユーザーが見つかりません',
      };
    }
    // 永久利用権ユーザーの場合は常に法人アクセス権あり
    if (user.subscriptionStatus === 'permanent') {
      let planType = 'personal';
      if (user.subscription?.plan) {
        const plan = user.subscription.plan.toLowerCase();
        if (plan.includes('enterprise')) {
          planType = 'enterprise';
        } else if (plan.includes('business') || plan.includes('business_plus')) {
          planType = 'business'; // 🔥 business_plusもbusinessとして扱う
        } else if (plan.includes('starter')) {
          planType = 'starter';
        }
      } else if (user.adminOfTenant || user.tenant) {
        const tenant = user.adminOfTenant || user.tenant;
        const maxUsers = tenant?.maxUsers || 10;
        if (maxUsers >= 50) {
          planType = 'enterprise';
        } else if (maxUsers >= 30) {
          planType = 'business';
        } else {
          planType = 'starter';
        }
      }

      // 個人プランの場合は法人アクセス権なし
      if (planType === 'personal') {
        logger.info('個人永久利用権ユーザー - 法人アクセス権なし', { userId });
        return {
          hasCorporateAccess: false,
          isAdmin: false,
          isSuperAdmin: false,
          tenant: null,
          subscription: user.subscription,
          userRole: 'personal',
          error: null,
        };
      }

      // 法人プランの場合は法人アクセス権あり
      logger.info('法人永久利用権ユーザーに法人アクセス権を付与', { userId, planType });
      return {
        hasCorporateAccess: true,
        isAdmin: true, // 管理者権限も付与
        isSuperAdmin: false, // スーパー管理者権限は付与しない
        tenant: user.adminOfTenant ||
          user.tenant || {
            // 仮想テナント情報
            id: `virtual-tenant-${userId}`,
            accountStatus: 'active',
          },
        subscription: {
          plan: planType,
          status: 'active',
        },
        userRole: 'admin', // ユーザーロールも明示的に設定
        error: null,
      };
    }
    // 法人テナントが存在するかチェック
    const hasTenant = !!user.adminOfTenant || !!user.tenant;
    // テナントが停止状態かチェック
    const isTenantSuspended =
      (user.adminOfTenant && user.adminOfTenant.accountStatus === 'suspended') ||
      (user.tenant && user.tenant.accountStatus === 'suspended');
    // 法人サブスクリプションが有効かチェック - 判定ロジックを拡張
    const hasCorporateSubscription =
      user.subscription &&
      // 正確な一致（年間プランを追加）
      ([
        'business',
        'business-plus',
        'business_plus',
        'businessplus',
        'enterprise',
        'enterprise_yearly', // 年間エンタープライズプランを追加
        'starter_yearly', // 年間スタータープランを追加
        'business_yearly', // 年間ビジネスプランを追加
        'corp',
        'corporate',
        'pro',
      ].includes((user.subscription.plan || '').toLowerCase().trim()) ||
        // 部分一致 (より柔軟な判定を追加)
        (user.subscription.plan || '').toLowerCase().includes('business') ||
        (user.subscription.plan || '').toLowerCase().includes('corp') ||
        (user.subscription.plan || '').toLowerCase().includes('pro') ||
        (user.subscription.plan || '').toLowerCase().includes('enterprise') || // enterprise を含むかどうかをチェック
        (user.subscription.plan || '').toLowerCase().includes('starter')) && // starter を含むかどうかをチェック
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