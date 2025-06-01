// app/api/corporate/access/route.ts (修正版)
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma, disconnectPrisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
export async function GET(request: Request) {
  const url = new URL(request.url);
  const isMobile = url.searchParams.get('mobile') === '1';
  logger.info('corporate/access API呼び出し開始', { timestamp: url.searchParams.get('t'), mobile: isMobile });
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
          corporateRole: true,
          tenantId: true, // 🔥 追加: tenantIdを明示的に取得
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
              plan: true,
              status: true,
            },
          },
        },
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
      const ADMIN_EMAILS = ['admin@sns-share.com'];
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
      // 永久利用権ユーザーの場合、即時アクセス権を付与
      if (user.subscriptionStatus === 'permanent') {
        logger.info('永久利用権ユーザーにアクセス権付与', { userId });
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
      // 🔥 修正: テナント情報の取得ロジックを改善
      const tenant = user.adminOfTenant || user.tenant;
      const tenantId = tenant?.id || user.tenantId; // フォールバック追加
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
      // 🔥 修正: ユーザーロールの判定を改善
      const isAdmin = !!user.adminOfTenant;
      let userRole: string | null = null;
      if (isAdmin) {
        userRole = 'admin';
      } else if (user.corporateRole === 'member' && hasTenant) {
        userRole = 'member';
      } else if (hasTenant) {
        // テナントがあるが明示的なロールがない場合はmemberとして扱う
        userRole = 'member';
      }
      // 🔥 修正: アクセス権の判定ロジックを明確化
      const hasBasicAccess = hasTenant && !isTenantSuspended;
      // 管理者は常にアクセス可能
      const adminAccess = isAdmin && hasBasicAccess;
      // メンバーはテナントがあり停止されていない場合にアクセス可能
      // サブスクリプションチェックは管理者レベルで行い、メンバーは影響を受けない
      const memberAccess = userRole === 'member' && hasBasicAccess;
      const finalHasAccess = adminAccess || memberAccess;
      // 🔥 修正: 招待メンバーの不完全な状態を検出・警告
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
      return NextResponse.json(
        {
          hasCorporateAccess: false,
          hasAccess: false,
          error: 'Database operation failed',
          details: dbError instanceof Error ? dbError.message : String(dbError),
          code: 'DB_ERROR',
        },
        { status: 500 },
      );
    }
  } catch (error) {
    logger.error('corporate/access エラー:', error);
    return NextResponse.json(
      {
        hasCorporateAccess: false,
        hasAccess: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  } finally {
    try {
      await disconnectPrisma();
    } catch (cleanupError) {
      logger.error('クリーンアップエラー:', cleanupError);
    }
  }
}