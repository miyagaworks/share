// app/api/corporate/access/route.ts (データベース接続エラー修正版)
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma, safeQuery } from '@/lib/prisma'; // 🔧 修正: disconnectPrismaを削除、safeQueryを追加
import { logger } from '@/lib/utils/logger';
import { SUPER_ADMIN_EMAIL } from '@/lib/auth/constants';

// 🔥 永久利用権プラン種別を判定する関数（他のAPIと統一）
function determinePermanentPlanType(user: any): string {
  // サブスクリプション情報から判定
  if (user.subscription?.plan) {
    const plan = user.subscription.plan.toLowerCase();

    if (plan.includes('permanent_enterprise') || plan.includes('enterprise')) {
      return 'enterprise';
    } else if (plan.includes('permanent_business') || plan.includes('business')) {
      return 'business';
    } else if (
      plan.includes('business_plus') ||
      plan.includes('business-plus') ||
      plan.includes('businessplus')
    ) {
      return 'business';
    } else if (plan.includes('permanent_starter') || plan.includes('starter')) {
      return 'starter';
    } else if (plan.includes('permanent_personal') || plan.includes('personal')) {
      return 'personal';
    }
  }

  // テナント情報から判定
  if (user.adminOfTenant || user.tenant) {
    const tenant = user.adminOfTenant || user.tenant;
    const maxUsers = tenant?.maxUsers || 10;

    if (maxUsers >= 50) {
      return 'enterprise';
    } else if (maxUsers >= 30) {
      return 'business';
    } else {
      return 'starter';
    }
  }

  return 'personal';
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const isMobile = url.searchParams.get('mobile') === '1';
  logger.info('corporate/access API呼び出し開始', {
    timestamp: url.searchParams.get('t'),
    mobile: isMobile,
  });

  try {
    // セッションチェック
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ hasAccess: false, error: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.user.id;

    try {
      // 🔧 修正: safeQueryを使用してユーザー情報を取得
      const user = await safeQuery(async () => {
        return await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            subscriptionStatus: true,
            corporateRole: true,
            tenantId: true,
            adminOfTenant: {
              select: {
                id: true,
                name: true,
                accountStatus: true,
                maxUsers: true,
              },
            },
            tenant: {
              select: {
                id: true,
                name: true,
                accountStatus: true,
                maxUsers: true,
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
      });

      if (!user) {
        return NextResponse.json(
          {
            hasCorporateAccess: false,
            hasAccess: false,
            error: 'User not found',
          },
          { status: 404 },
        );
      }

      // 管理者メールアドレスリスト
      const ADMIN_EMAILS = [SUPER_ADMIN_EMAIL];
      const isAdminEmail = ADMIN_EMAILS.includes(user.email.toLowerCase());

      // 管理者メールアドレスの場合はスーパー管理者権限を付与
      if (isAdminEmail) {
        logger.info('管理者メールユーザーにスーパー管理者権限を付与', { userId });
        return NextResponse.json({
          hasCorporateAccess: true,
          hasAccess: true,
          isAdmin: true,
          isSuperAdmin: true,
          tenantId: user.adminOfTenant?.id || `admin-tenant-${userId}`,
          userRole: 'admin',
          error: null,
        });
      }

      // 🔥 修正: 永久利用権ユーザーのプラン種別チェック
      if (user.subscriptionStatus === 'permanent') {
        const permanentPlanType = determinePermanentPlanType(user);
        const isPermanentPersonal = permanentPlanType === 'personal';

        logger.info('永久利用権ユーザーのプラン種別判定', {
          userId,
          permanentPlanType,
          isPermanentPersonal,
          subscriptionPlan: user.subscription?.plan,
        });

        if (isPermanentPersonal) {
          // 🔥 個人プランの場合は法人アクセス権なし
          return NextResponse.json({
            hasCorporateAccess: false,
            hasAccess: false,
            isAdmin: false,
            isSuperAdmin: false,
            tenantId: null,
            userRole: 'personal',
            error: null,
          });
        } else {
          // 🔥 法人プランの場合は法人アクセス権あり
          return NextResponse.json({
            hasCorporateAccess: true,
            hasAccess: true,
            isAdmin: true,
            isSuperAdmin: false,
            tenantId: `virtual-tenant-${userId}`,
            userRole: 'admin',
            error: null,
          });
        }
      }

      // 以下、通常のテナントベースのアクセス権チェック（既存コード）
      const tenant = user.adminOfTenant || user.tenant;
      const tenantId = tenant?.id || user.tenantId;
      const hasTenant = !!tenant || !!user.tenantId;

      // テナントステータスの確認
      const isTenantSuspended = tenant?.accountStatus === 'suspended';

      // 法人サブスクリプションのチェック
      const planLower = (user.subscription?.plan || '').toLowerCase();
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
          (planLower.includes('corp') && !planLower.includes('personal')) ||
          planLower.includes('pro'));

      // ユーザーロールの判定を改善
      const isAdmin = !!user.adminOfTenant;
      let userRole: string | null = null;
      if (isAdmin) {
        userRole = 'admin';
      } else if (user.corporateRole === 'member' && hasTenant) {
        userRole = 'member';
      } else if (hasTenant) {
        userRole = 'member';
      }

      // アクセス権の判定ロジックを明確化
      const hasBasicAccess = hasTenant && !isTenantSuspended;
      const adminAccess = isAdmin && hasBasicAccess;
      const memberAccess = userRole === 'member' && hasBasicAccess;
      const finalHasAccess = adminAccess || memberAccess;

      // 招待メンバーの不完全な状態を検出・警告
      if (user.corporateRole === 'member' && !hasTenant) {
        logger.warn('不完全な招待メンバーを検出', {
          userId,
          email: user.email,
          corporateRole: user.corporateRole,
          tenantId: user.tenantId,
          hasTenant,
        });
        return NextResponse.json({
          hasCorporateAccess: false,
          hasAccess: false,
          isAdmin: false,
          isSuperAdmin: false,
          tenantId: null,
          userRole: 'incomplete-member',
          error: 'テナント関連付けが不完全です。管理者にお問い合わせください。',
        });
      }

      logger.debug('アクセス権判定結果', {
        userId,
        email: user.email,
        hasTenant,
        tenantId,
        isTenantSuspended,
        hasCorporateSubscription,
        corporateRole: user.corporateRole,
        userRole,
        isAdmin,
        adminAccess,
        memberAccess,
        finalHasAccess,
      });

      return NextResponse.json({
        hasCorporateAccess: finalHasAccess,
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
              : 'アクセス権限がありません'
          : null,
      });
    } catch (dbError) {
      logger.error('データベースエラー:', dbError);
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);

      return NextResponse.json(
        {
          hasCorporateAccess: false,
          hasAccess: false,
          error: 'Database operation failed',
          details:
            process.env.NODE_ENV === 'development'
              ? errorMessage
              : 'データベース接続に失敗しました',
          code: 'DB_ERROR',
        },
        { status: 500 },
      );
    }
  } catch (error) {
    logger.error('corporate/access エラー:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        hasCorporateAccess: false,
        hasAccess: false,
        error: 'Internal server error',
        details:
          process.env.NODE_ENV === 'development' ? errorMessage : 'サーバーエラーが発生しました',
      },
      { status: 500 },
    );
  }
  // 🔧 修正: finallyブロックでdisconnectPrisma()を削除（safeQueryが内部で管理するため）
}