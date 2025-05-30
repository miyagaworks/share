// app/api/user/dashboard-info/route.ts (完全修正版)
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// 既存の型定義は省略...
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
  } | null;
  tenant?: {
    id: string;
    name: string;
    logoUrl: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    accountStatus: string;
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

// 🔥 修正: generateNavigationEnhanced 関数
function generateNavigationEnhanced(
  permissions: Permissions,
  currentPath?: string | null,
): Navigation {
  const { userType } = permissions;

  const menuTemplates: Record<string, MenuItem[]> = {
    admin: [
      { title: '管理者ダッシュボード', href: '/dashboard/admin', icon: 'HiShieldCheck' },
      { title: 'ユーザー管理', href: '/dashboard/admin/users', icon: 'HiUsers' },
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
    permanent: [
      { title: 'ダッシュボード', href: '/dashboard', icon: 'HiHome' },
      { title: 'プロフィール編集', href: '/dashboard/profile', icon: 'HiUser' },
      { title: 'SNS・リンク管理', href: '/dashboard/links', icon: 'HiLink' },
      { title: 'デザイン設定', href: '/dashboard/design', icon: 'HiColorSwatch' },
      { title: '共有設定', href: '/dashboard/share', icon: 'HiShare' },
      { title: 'ご利用プラン', href: '/dashboard/subscription', icon: 'HiCreditCard' },
      { title: '永久利用権法人機能', href: '#permanent-divider', icon: '', isDivider: true },
      { title: '法人管理ダッシュボード', href: '/dashboard/corporate', icon: 'HiOfficeBuilding' },
    ],
  };

  const menuItems = menuTemplates[userType] || menuTemplates.personal;

  // 🔥 修正: リダイレクト処理
  const defaultRedirectMap: Record<string, string> = {
    admin: '/dashboard/admin',
    'invited-member': '/dashboard/corporate-member',
    permanent: '/dashboard/corporate',
    corporate: '/dashboard/corporate',
  };

  // 🔥 法人管理者の特別処理
  if (userType === 'corporate') {
    const isCorporateMemberPath = currentPath?.startsWith('/dashboard/corporate-member');
    const isCorporatePath = currentPath?.startsWith('/dashboard/corporate');
    const isSubscriptionPath = currentPath?.startsWith('/dashboard/subscription');

    console.log('🔧 法人管理者のリダイレクト判定:', {
      currentPath,
      isCorporateMemberPath,
      isCorporatePath,
      isSubscriptionPath,
      userType,
    });

    // 許可されたパスではリダイレクトしない
    if (isCorporateMemberPath || isCorporatePath || isSubscriptionPath) {
      return {
        shouldRedirect: false,
        redirectPath: null,
        menuItems,
      };
    }
    // 🔥 修正: 個人機能ページや/dashboardへのアクセスは法人ダッシュボードにリダイレクト
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

// 既存のcalculatePermissionsFixed関数とGET関数は変更なし
function calculatePermissionsFixed(userData: UserData): Permissions {
  const ADMIN_EMAILS = ['admin@sns-share.com'];
  const isAdminEmail = ADMIN_EMAILS.includes(userData.email.toLowerCase());

  console.log('🔧 権限計算詳細デバッグ:', {
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
      planDisplayName: '管理者アカウント',
    };
  }

  // 永久利用権ユーザーの判定
  const isPermanentUser = userData.subscriptionStatus === 'permanent';
  if (isPermanentUser) {
    console.log('✅ 永久利用権ユーザーを検出');
    return {
      userType: 'permanent',
      isAdmin: true,
      isSuperAdmin: false,
      hasCorpAccess: true,
      isCorpAdmin: true,
      isPermanentUser: true,
      permanentPlanType: 'business_plus',
      userRole: 'admin',
      hasActivePlan: true,
      isTrialPeriod: false,
      planType: 'permanent',
      planDisplayName: '永久利用権',
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

  console.log('🎯 招待メンバー判定:', {
    hasTenant,
    corporateRole: userData.corporateRole,
    isCorpAdmin,
    isTenantActive,
    result: isInvitedMember,
  });

  // 法人管理者の判定
  if (isCorpAdmin && isTenantActive) {
    console.log('✅ 法人管理者を検出');

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

    console.log('🔧 法人プラン判定:', {
      subscriptionPlan: userData.subscription?.plan,
      interval: userData.subscription?.interval,
      displayName: corporatePlanDisplayName,
    });

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
    console.log('✅ 招待メンバーを検出');
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
  console.log('✅ 個人ユーザーとして判定');

  const hasPersonalPlan = userData.subscription?.status === 'active';

  const isTrialUser =
    userData.subscriptionStatus === 'trialing' || userData.subscription?.status === 'trialing';

  const isTrialActive =
    isTrialUser && userData.trialEndsAt ? new Date(userData.trialEndsAt) > new Date() : false;

  console.log('🔧 個人ユーザーのプラン判定:', {
    hasPersonalPlan,
    isTrialUser,
    isTrialActive,
    trialEndsAt: userData.trialEndsAt,
  });

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

export async function GET(request: Request) {
  const startTime = Date.now();

  try {
    console.log('📊 Dashboard API開始 - タイムスタンプ:', new Date().toISOString());

    const url = new URL(request.url);
    const referer = request.headers.get('referer');
    const currentPath = referer ? new URL(referer).pathname : null;

    console.log('🔧 リクエスト情報:', {
      url: url.toString(),
      referer,
      currentPath,
    });

    const session = await auth();
    console.log('🔧 セッション取得結果:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
    });

    if (!session?.user?.id) {
      console.log('❌ 認証失敗 - セッションまたはユーザーIDがありません');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('✅ ユーザー認証OK:', userId);

    let userData: UserData | null = null;

    try {
      console.log('🔧 DB query開始 - ユーザーID:', userId);

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

      console.log('✅ DB query完了:', {
        hasUser: !!userData,
        userEmail: userData?.email,
        hasAdminTenant: !!userData?.adminOfTenant,
        hasTenant: !!userData?.tenant,
        subscriptionStatus: userData?.subscriptionStatus,
        corporateRole: userData?.corporateRole,
        trialEndsAt: userData?.trialEndsAt,
      });
    } catch (dbError) {
      console.error('❌ データベースエラー詳細:', {
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
      console.log('❌ ユーザー見つからず - DB結果がnull');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('🚀 権限計算開始');
    const permissions = calculatePermissionsFixed(userData);
    console.log('✅ 権限計算完了:', permissions);

    console.log('🚀 ナビゲーション生成開始');
    const navigation = generateNavigationEnhanced(permissions, currentPath);
    console.log('✅ ナビゲーション生成完了:', {
      shouldRedirect: navigation.shouldRedirect,
      redirectPath: navigation.redirectPath,
      menuItemsCount: navigation.menuItems.length,
    });

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
    console.log(`⚡ Dashboard API完了: ${duration}ms - レスポンス準備完了`);

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'private, max-age=300',
        'X-Response-Time': `${duration}ms`,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ Dashboard API全体エラー:', {
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