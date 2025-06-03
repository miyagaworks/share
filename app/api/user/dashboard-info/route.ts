// app/api/user/dashboard-info/route.ts (永久利用権プラン種別対応版)
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// 永久利用権プラン種別を判定する関数
function determinePermanentPlanType(user: any): string {
  // サブスクリプション情報から判定
  if (user.subscription?.plan) {
    const plan = user.subscription.plan.toLowerCase();

    if (plan.includes('permanent_enterprise') || plan.includes('enterprise')) {
      return 'enterprise';
    } else if (plan.includes('permanent_business') || plan.includes('business')) {
      // 🔥 business_plusの互換性を保ちつつbusinessにマッピング
      return 'business';
    } else if (
      plan.includes('business_plus') ||
      plan.includes('business-plus') ||
      plan.includes('businessplus')
    ) {
      return 'business'; // 🔥 旧business_plusはbusinessにマッピング
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
      return 'business'; // 🔥 30名以上はbusiness
    } else {
      return 'starter'; // 🔥 10名はstarter
    }
  }

  return 'personal';
}
interface UserData {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  subscriptionStatus: string | null;
  corporateRole: string | null;
  trialEndsAt: string | Date | null;
  adminOfTenant?: {
    id: string;
    name: string;
    logoUrl: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    accountStatus: string;
    maxUsers: number;
  } | null;
  tenant?: {
    id: string;
    name: string;
    logoUrl: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    accountStatus: string;
    maxUsers: number;
  } | null;
  subscription?: {
    plan: string | null;
    status: string;
    interval?: string;
  } | null;
}

interface MenuItem {
  title: string;
  href: string;
  icon: string;
  isDivider?: boolean;
}

interface Permissions {
  userType: 'admin' | 'corporate' | 'personal' | 'permanent' | 'invited-member';
  isAdmin: boolean;
  isSuperAdmin: boolean;
  hasCorpAccess: boolean;
  isCorpAdmin: boolean;
  isPermanentUser: boolean;
  permanentPlanType: string | null;
  userRole: 'admin' | 'member' | 'personal' | null;
  hasActivePlan: boolean;
  isTrialPeriod: boolean;
  planType: 'personal' | 'corporate' | 'permanent' | null;
  planDisplayName: string;
}

interface Navigation {
  shouldRedirect: boolean;
  redirectPath: string | null;
  menuItems: MenuItem[];
}

function generateNavigationEnhanced(
  permissions: Permissions,
  currentPath?: string | null,
): Navigation {
  const { userType, permanentPlanType } = permissions;

  const menuTemplates: Record<string, MenuItem[]> = {
    admin: [
      { title: '管理者ダッシュボード', href: '/dashboard/admin', icon: 'HiShieldCheck' },
      { title: 'ユーザー管理', href: '/dashboard/admin/users', icon: 'HiUsers' },
      { title: 'プロフィール・QR管理', href: '/dashboard/admin/profiles', icon: 'HiEye' },
      {
        title: 'サブスクリプション管理',
        href: '/dashboard/admin/subscriptions',
        icon: 'HiCreditCard',
      },
      { title: '永久利用権管理', href: '/dashboard/admin/permissions', icon: 'HiKey' },
      { title: 'お知らせ管理', href: '/dashboard/admin/notifications', icon: 'HiBell' },
      { title: 'メール配信管理', href: '/dashboard/admin/email', icon: 'HiOutlineMail' },
    ],
    'invited-member': [
      { title: '概要', href: '/dashboard/corporate-member', icon: 'HiUser' },
      { title: 'プロフィール編集', href: '/dashboard/corporate-member/profile', icon: 'HiUser' },
      { title: 'SNS・リンク管理', href: '/dashboard/corporate-member/links', icon: 'HiLink' },
      { title: 'デザイン設定', href: '/dashboard/corporate-member/design', icon: 'HiColorSwatch' },
      { title: '共有設定', href: '/dashboard/corporate-member/share', icon: 'HiShare' },
    ],
    corporate: [
      { title: '法人ダッシュボード', href: '/dashboard/corporate', icon: 'HiOfficeBuilding' },
      { title: 'ユーザー管理', href: '/dashboard/corporate/users', icon: 'HiUsers' },
      { title: '部署管理', href: '/dashboard/corporate/departments', icon: 'HiTemplate' },
      { title: '共通SNS設定', href: '/dashboard/corporate/sns', icon: 'HiLink' },
      { title: 'ブランディング設定', href: '/dashboard/corporate/branding', icon: 'HiColorSwatch' },
      { title: 'アカウント設定', href: '/dashboard/corporate/settings', icon: 'HiCog' },
      { title: '法人メンバー機能', href: '#member-divider', icon: '', isDivider: true },
      { title: '法人メンバープロフィール', href: '/dashboard/corporate-member', icon: 'HiUser' },
      { title: 'ご利用プラン', href: '/dashboard/subscription', icon: 'HiCreditCard' },
    ],
    personal: [
      { title: 'ダッシュボード', href: '/dashboard', icon: 'HiHome' },
      { title: 'プロフィール編集', href: '/dashboard/profile', icon: 'HiUser' },
      { title: 'SNS・リンク管理', href: '/dashboard/links', icon: 'HiLink' },
      { title: 'デザイン設定', href: '/dashboard/design', icon: 'HiColorSwatch' },
      { title: '共有設定', href: '/dashboard/share', icon: 'HiShare' },
      { title: 'ご利用プラン', href: '/dashboard/subscription', icon: 'HiCreditCard' },
    ],
    // 🔥 永久利用権ユーザーのメニューをプラン種別に応じて決定
    permanent: [], // この後、プラン種別に応じて動的に設定
  };

  // 🔥 永久利用権ユーザーのメニューを動的に設定
  if (userType === 'permanent') {
    if (permanentPlanType === 'personal') {
      // 個人永久プランは個人機能のみ
      menuTemplates.permanent = [
        { title: 'ダッシュボード', href: '/dashboard', icon: 'HiHome' },
        { title: 'プロフィール編集', href: '/dashboard/profile', icon: 'HiUser' },
        { title: 'SNS・リンク管理', href: '/dashboard/links', icon: 'HiLink' },
        { title: 'デザイン設定', href: '/dashboard/design', icon: 'HiColorSwatch' },
        { title: '共有設定', href: '/dashboard/share', icon: 'HiShare' },
        { title: 'ご利用プラン', href: '/dashboard/subscription', icon: 'HiCreditCard' },
      ];
    } else {
      // 法人永久プランは法人機能を含む
      menuTemplates.permanent = [
        { title: '法人ダッシュボード', href: '/dashboard/corporate', icon: 'HiOfficeBuilding' },
        { title: 'ユーザー管理', href: '/dashboard/corporate/users', icon: 'HiUsers' },
        { title: '部署管理', href: '/dashboard/corporate/departments', icon: 'HiTemplate' },
        { title: '共通SNS設定', href: '/dashboard/corporate/sns', icon: 'HiLink' },
        {
          title: 'ブランディング設定',
          href: '/dashboard/corporate/branding',
          icon: 'HiColorSwatch',
        },
        { title: 'アカウント設定', href: '/dashboard/corporate/settings', icon: 'HiCog' },
        { title: '法人メンバー機能', href: '#member-divider', icon: '', isDivider: true },
        { title: '法人メンバープロフィール', href: '/dashboard/corporate-member', icon: 'HiUser' },
        { title: 'ご利用プラン', href: '/dashboard/subscription', icon: 'HiCreditCard' },
      ];
    }
  }

  const menuItems = menuTemplates[userType] || menuTemplates.personal;

  // リダイレクト処理
  const defaultRedirectMap: Record<string, string> = {
    admin: '/dashboard/admin',
    'invited-member': '/dashboard/corporate-member',
    permanent: permanentPlanType === 'personal' ? '/dashboard' : '/dashboard/corporate',
    corporate: '/dashboard/corporate',
  };

  // 🔥 永久利用権ユーザーの特別処理
  if (userType === 'permanent') {
    const isPermanentPersonal = permanentPlanType === 'personal';
    const isCorporatePath = currentPath?.startsWith('/dashboard/corporate');
    const isCorporateMemberPath = currentPath?.startsWith('/dashboard/corporate-member');
    const isPersonalPath =
      currentPath === '/dashboard' ||
      currentPath?.startsWith('/dashboard/profile') ||
      currentPath?.startsWith('/dashboard/links') ||
      currentPath?.startsWith('/dashboard/design') ||
      currentPath?.startsWith('/dashboard/share');
    const isSubscriptionPath = currentPath?.startsWith('/dashboard/subscription');

    if (isPermanentPersonal) {
      // 個人永久プランユーザーは法人機能にアクセス不可
      if (isCorporatePath || isCorporateMemberPath) {
        return {
          shouldRedirect: true,
          redirectPath: '/dashboard',
          menuItems,
        };
      }
    } else {
      // 法人永久プランユーザーは個人機能にアクセスした場合、法人ダッシュボードにリダイレクト
      if (currentPath === '/dashboard' || isPersonalPath) {
        return {
          shouldRedirect: true,
          redirectPath: '/dashboard/corporate',
          menuItems,
        };
      }
    }

    // 許可されたパスではリダイレクトしない
    if (isCorporatePath || isCorporateMemberPath || isPersonalPath || isSubscriptionPath) {
      return {
        shouldRedirect: false,
        redirectPath: null,
        menuItems,
      };
    }
  }

  // 法人管理者の特別処理
  if (userType === 'corporate') {
    const isCorporateMemberPath = currentPath?.startsWith('/dashboard/corporate-member');
    const isCorporatePath = currentPath?.startsWith('/dashboard/corporate');
    const isSubscriptionPath = currentPath?.startsWith('/dashboard/subscription');

    // 許可されたパスではリダイレクトしない
    if (isCorporateMemberPath || isCorporatePath || isSubscriptionPath) {
      return {
        shouldRedirect: false,
        redirectPath: null,
        menuItems,
      };
    }
    // 個人機能ページや/dashboardへのアクセスは法人ダッシュボードにリダイレクト
    else if (
      currentPath === '/dashboard' ||
      currentPath?.startsWith('/dashboard/profile') ||
      currentPath?.startsWith('/dashboard/links') ||
      currentPath?.startsWith('/dashboard/design') ||
      currentPath?.startsWith('/dashboard/share')
    ) {
      return {
        shouldRedirect: true,
        redirectPath: '/dashboard/corporate',
        menuItems,
      };
    } else {
      return {
        shouldRedirect: false,
        redirectPath: null,
        menuItems,
      };
    }
  }

  // その他のユーザータイプの処理
  const redirectPath = defaultRedirectMap[userType];
  return {
    shouldRedirect: !!redirectPath && currentPath === '/dashboard',
    redirectPath: redirectPath || null,
    menuItems,
  };
}

function calculatePermissionsFixed(userData: UserData): Permissions {
  const ADMIN_EMAILS = ['admin@sns-share.com'];
  const isAdminEmail = ADMIN_EMAILS.includes(userData.email.toLowerCase());

  logger.debug('🔧 権限計算詳細デバッグ:', {
    email: userData.email,
    subscriptionStatus: userData.subscriptionStatus,
    corporateRole: userData.corporateRole,
    hasAdminTenant: !!userData.adminOfTenant,
    hasTenant: !!userData.tenant,
    isAdminEmail,
  });

  // 管理者の早期リターン
  if (isAdminEmail) {
    return {
      userType: 'admin',
      isAdmin: true,
      isSuperAdmin: true,
      hasCorpAccess: true,
      isCorpAdmin: true,
      isPermanentUser: false,
      permanentPlanType: null,
      userRole: 'admin',
      hasActivePlan: true,
      isTrialPeriod: false,
      planType: null,
      planDisplayName: 'システム管理者',
    };
  }

  // 🔥 永久利用権ユーザーの判定（プラン種別も判定）
  const isPermanentUser = userData.subscriptionStatus === 'permanent';
  if (isPermanentUser) {
    const permanentPlanType = determinePermanentPlanType(userData);
    const isPermanentPersonal = permanentPlanType === 'personal';

    logger.debug('✅ 永久利用権ユーザーを検出', {
      permanentPlanType,
      isPermanentPersonal,
    });

    return {
      userType: 'permanent',
      isAdmin: !isPermanentPersonal, // 個人プラン以外は管理者権限
      isSuperAdmin: false,
      hasCorpAccess: !isPermanentPersonal, // 🔥 修正: 個人プランは法人アクセス権なし
      isCorpAdmin: !isPermanentPersonal, // 個人プラン以外は法人管理者権限
      isPermanentUser: true,
      permanentPlanType,
      userRole: isPermanentPersonal ? 'personal' : 'admin',
      hasActivePlan: true,
      isTrialPeriod: false,
      planType: 'permanent',
      planDisplayName: `永久利用権 (${getPlanDisplayName(permanentPlanType)})`,
    };
  }

  // 法人テナント関連の判定
  const hasTenant = !!(userData.adminOfTenant || userData.tenant);
  const tenant = userData.adminOfTenant || userData.tenant;
  const isTenantActive = tenant?.accountStatus !== 'suspended';
  const isCorpAdmin = !!userData.adminOfTenant;

  // 招待メンバーの厳格な判定
  const isInvitedMember =
    hasTenant && userData.corporateRole === 'member' && !isCorpAdmin && isTenantActive;

  logger.debug('🎯 招待メンバー判定:', {
    hasTenant,
    corporateRole: userData.corporateRole,
    isCorpAdmin,
    isTenantActive,
    result: isInvitedMember,
  });

  // 法人管理者の判定
  if (isCorpAdmin && isTenantActive) {
    logger.debug('✅ 法人管理者を検出');
    let corporatePlanDisplayName = '法人プラン';
    if (userData.subscription?.plan) {
      const plan = userData.subscription.plan.toLowerCase();
      const interval = userData.subscription.interval || 'month';
      if (plan.includes('starter')) {
        corporatePlanDisplayName =
          interval === 'year'
            ? '法人スタータープラン(10名まで・年額)'
            : '法人スタータープラン(10名まで・月額)';
      } else if (plan.includes('business') && !plan.includes('enterprise')) {
        corporatePlanDisplayName =
          interval === 'year'
            ? '法人ビジネスプラン(30名まで・年額)'
            : '法人ビジネスプラン(30名まで・月額)';
      } else if (plan.includes('enterprise')) {
        corporatePlanDisplayName =
          interval === 'year'
            ? '法人エンタープライズプラン(50名まで・年額)'
            : '法人エンタープライズプラン(50名まで・月額)';
      }
      if (plan.includes('business_legacy')) {
        corporatePlanDisplayName = '法人スタータープラン(10名まで)';
      } else if (plan.includes('business_plus') || plan.includes('business-plus')) {
        corporatePlanDisplayName = '法人ビジネスプラン(30名まで)';
      }
    }

    return {
      userType: 'corporate',
      isAdmin: true,
      isSuperAdmin: false,
      hasCorpAccess: true,
      isCorpAdmin: true,
      isPermanentUser: false,
      permanentPlanType: null,
      userRole: 'admin',
      hasActivePlan: true,
      isTrialPeriod: false,
      planType: 'corporate',
      planDisplayName: corporatePlanDisplayName,
    };
  }

  // 招待メンバーの判定
  if (isInvitedMember) {
    logger.debug('✅ 招待メンバーを検出');
    return {
      userType: 'invited-member',
      isAdmin: false,
      isSuperAdmin: false,
      hasCorpAccess: true,
      isCorpAdmin: false,
      isPermanentUser: false,
      permanentPlanType: null,
      userRole: 'member',
      hasActivePlan: true,
      isTrialPeriod: false,
      planType: 'corporate',
      planDisplayName: '法人メンバー',
    };
  }

  // 個人ユーザーの判定
  logger.debug('✅ 個人ユーザーとして判定');
  const hasPersonalPlan = userData.subscription?.status === 'active';
  const isTrialUser =
    userData.subscriptionStatus === 'trialing' || userData.subscription?.status === 'trialing';
  const isTrialActive =
    isTrialUser && userData.trialEndsAt ? new Date(userData.trialEndsAt) > new Date() : false;

  return {
    userType: 'personal',
    isAdmin: false,
    isSuperAdmin: false,
    hasCorpAccess: false,
    isCorpAdmin: false,
    isPermanentUser: false,
    permanentPlanType: null,
    userRole: 'personal',
    hasActivePlan: hasPersonalPlan || isTrialActive,
    isTrialPeriod: isTrialActive,
    planType: 'personal',
    planDisplayName: hasPersonalPlan
      ? '個人プラン'
      : isTrialActive
        ? '無料トライアル'
        : '無料プラン',
  };
}

// プラン種別の表示名を取得する関数
function getPlanDisplayName(planType: string): string {
  const displayNames: Record<string, string> = {
    personal: '個人プラン',
    starter: 'スタータープラン (10名まで)', // 🔥 修正
    business: 'ビジネスプラン (30名まで)', // 🔥 修正
    enterprise: 'エンタープライズ (50名まで)',
  };
  return displayNames[planType] || 'プラン';
}

export async function GET(request: Request) {
  const startTime = Date.now();
  try {
    logger.debug('📊 Dashboard API開始 - タイムスタンプ:', new Date().toISOString());
    const url = new URL(request.url);
    const referer = request.headers.get('referer');
    const currentPath = referer ? new URL(referer).pathname : null;

    const session = await auth();
    if (!session?.user?.id) {
      logger.debug('❌ 認証失敗 - セッションまたはユーザーIDがありません');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.user.id;

    let userData: UserData | null = null;
    try {
      userData = (await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          subscriptionStatus: true,
          corporateRole: true,
          trialEndsAt: true,
          adminOfTenant: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
              primaryColor: true,
              secondaryColor: true,
              accountStatus: true,
              maxUsers: true, // 🔥 追加
            },
          },
          tenant: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
              primaryColor: true,
              secondaryColor: true,
              accountStatus: true,
              maxUsers: true, // 🔥 追加
            },
          },
          subscription: {
            select: {
              plan: true,
              status: true,
              interval: true,
            },
          },
        },
      })) as UserData | null;
    } catch (dbError) {
      logger.error('❌ データベースエラー詳細:', {
        error: dbError,
        userId,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        {
          error: 'Database connection error',
          details:
            process.env.NODE_ENV === 'development' ? String(dbError) : 'Internal server error',
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      );
    }

    if (!userData) {
      logger.debug('❌ ユーザー見つからず - DB結果がnull');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const permissions = calculatePermissionsFixed(userData);
    const navigation = generateNavigationEnhanced(permissions, currentPath);

    const tenant = userData.adminOfTenant || userData.tenant;
    const response = {
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        image: userData.image,
        subscriptionStatus: userData.subscriptionStatus,
      },
      permissions,
      navigation,
      tenant: tenant
        ? {
            id: tenant.id,
            name: tenant.name,
            logoUrl: tenant.logoUrl,
            primaryColor: tenant.primaryColor,
            secondaryColor: tenant.secondaryColor,
          }
        : null,
    };

    const duration = Date.now() - startTime;
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'private, max-age=300',
        'X-Response-Time': `${duration}ms`,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('❌ Dashboard API全体エラー:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      {
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
      },
      { status: 500 },
    );
  }
}