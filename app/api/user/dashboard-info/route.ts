// app/api/user/dashboard-info/route.ts (プラン表示修正版)
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// 🔧 完全な型定義
interface UserData {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  subscriptionStatus: string | null;
  corporateRole: string | null;
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
  // 🚀 プラン表示用の新しいプロパティ
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

interface DashboardResponse {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    subscriptionStatus: string | null;
  };
  permissions: Permissions;
  navigation: Navigation;
  tenant: {
    id: string;
    name: string;
    logoUrl: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
  } | null;
}

export async function GET() {
  const startTime = Date.now();

  try {
    console.log('📊 Dashboard API開始 - タイムスタンプ:', new Date().toISOString());

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

    // データベースクエリ（エラーハンドリング強化）
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
    // 🚀 強化された権限計算
    const permissions = calculatePermissionsEnhanced(userData);
    console.log('✅ 権限計算完了:', permissions);

    console.log('🚀 ナビゲーション生成開始');
    const navigation = generateNavigationEnhanced(permissions);
    console.log('✅ ナビゲーション生成完了:', {
      shouldRedirect: navigation.shouldRedirect,
      redirectPath: navigation.redirectPath,
      menuItemsCount: navigation.menuItems.length,
    });

    const tenant = userData.adminOfTenant || userData.tenant;

    const response: DashboardResponse = {
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

// 🚀 強化された権限計算（プラン情報を含む）
function calculatePermissionsEnhanced(userData: UserData): Permissions {
  const ADMIN_EMAILS = ['admin@sns-share.com'];
  const isAdminEmail = ADMIN_EMAILS.includes(userData.email.toLowerCase());

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

  const isPermanentUser = userData.subscriptionStatus === 'permanent';
  const hasTenant = !!(userData.adminOfTenant || userData.tenant);
  const tenant = userData.adminOfTenant || userData.tenant;
  const isTenantActive = tenant?.accountStatus !== 'suspended';

  // 法人サブスクリプションチェック
  const hasCorporateSubscription = !!(
    userData.subscription?.status === 'active' &&
    userData.subscription.plan &&
    ['business', 'business_plus', 'enterprise', 'starter'].some((plan) =>
      userData.subscription!.plan!.toLowerCase().includes(plan),
    )
  );

  // テナントに所属していてアクティブなら法人アクセス権あり
  const hasCorpAccess = hasTenant && isTenantActive;
  const isCorpAdmin = !!userData.adminOfTenant;

  // 🎯 ユーザータイプ判定の強化
  let userType: Permissions['userType'];
  let userRole: Permissions['userRole'];
  let hasActivePlan: boolean;
  let isTrialPeriod: boolean;
  let planType: 'personal' | 'corporate' | 'permanent' | null;
  let planDisplayName: string;

  console.log('🔧 ユーザータイプ判定:', {
    isPermanentUser,
    hasCorpAccess,
    isCorpAdmin,
    corporateRole: userData.corporateRole,
    hasTenant,
    isTenantActive,
    hasCorporateSubscription,
    subscriptionStatus: userData.subscriptionStatus,
  });

  if (isPermanentUser) {
    userType = 'permanent';
    userRole = 'admin';
    hasActivePlan = true;
    isTrialPeriod = false;
    planType = 'permanent';
    planDisplayName = '永久利用権';
  } else if (hasTenant && userData.corporateRole === 'member' && !isCorpAdmin) {
    // 🎯 招待メンバーの厳格な判定
    userType = 'invited-member';
    userRole = 'member';
    hasActivePlan = true; // 法人メンバーは法人プランの一部
    isTrialPeriod = false; // 招待メンバーにトライアル表示なし
    planType = 'corporate';
    planDisplayName = '法人メンバー';
    console.log('🎯 招待メンバーを検出:', userData.email);
  } else if (hasCorpAccess && isCorpAdmin) {
    userType = 'corporate';
    userRole = 'admin';
    // 🚀 法人管理者のプラン情報を正しく設定
    hasActivePlan = true; // 法人管理者は常にアクティブプラン
    isTrialPeriod = false; // 法人管理者にトライアル表示なし
    planType = 'corporate';
    planDisplayName = '法人エンタープライズプラン'; // 実際のプラン名に合わせて調整
  } else if (hasCorpAccess && !isCorpAdmin && userData.corporateRole === 'member') {
    // 招待メンバーの別パターン
    userType = 'invited-member';
    userRole = 'member';
    hasActivePlan = true;
    isTrialPeriod = false;
    planType = 'corporate';
    planDisplayName = '法人メンバー';
  } else {
    // 個人ユーザー
    userType = 'personal';
    userRole = 'personal';

    // 個人ユーザーのプラン判定
    const hasPersonalPlan = userData.subscription?.status === 'active';
    const isPersonalTrial =
      userData.subscriptionStatus === 'trialing' || userData.subscription?.status === 'trialing';

    hasActivePlan = hasPersonalPlan || isPersonalTrial;
    isTrialPeriod = isPersonalTrial;
    planType = 'personal';
    planDisplayName = hasPersonalPlan
      ? '個人プラン'
      : isPersonalTrial
        ? '無料トライアル'
        : '無料プラン';
  }

  console.log('✅ 最終ユーザータイプ:', userType, 'プラン情報:', {
    hasActivePlan,
    isTrialPeriod,
    planType,
    planDisplayName,
  });

  return {
    userType,
    isAdmin: isCorpAdmin,
    isSuperAdmin: false,
    hasCorpAccess,
    isCorpAdmin,
    isPermanentUser,
    permanentPlanType: isPermanentUser ? 'business_plus' : null,
    userRole,
    hasActivePlan,
    isTrialPeriod,
    planType,
    planDisplayName,
  };
}

// 🚀 強化されたナビゲーション生成
function generateNavigationEnhanced(permissions: Permissions): Navigation {
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
      // 🎯 招待メンバー専用メニュー（個人機能へのアクセスなし）
      { title: '概要', href: '/dashboard/corporate-member', icon: 'HiOfficeBuilding' },
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

  const redirectMap: Record<string, string> = {
    admin: '/dashboard/admin',
    'invited-member': '/dashboard/corporate-member', // 🎯 招待メンバーは必ず法人メンバーページ
    corporate: '/dashboard/corporate',
    permanent: '/dashboard/corporate',
  };

  return {
    shouldRedirect: userType in redirectMap,
    redirectPath: redirectMap[userType] || null,
    menuItems,
  };
}