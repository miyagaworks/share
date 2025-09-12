// app/api/user/dashboard-info/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { auth } from '@/auth';
import { prisma, safeQuery } from '@/lib/prisma'; // 🔧 修正: ensurePrismaConnectionを削除

// 🔧 設定: 財務管理者ドメイン（売却時に変更するだけ）
const FINANCIAL_ADMIN_DOMAIN = '@sns-share.com';
const SUPER_ADMIN_EMAIL = 'admin@sns-share.com';

// 永久利用権プラン種別を判定する関数
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

// 🔧 修正: interval フィールドの型を統一
interface UserData {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  subscriptionStatus: string | null;
  corporateRole: string | null;
  trialEndsAt: string | Date | null;
  isFinancialAdmin: boolean;
  financialAdminRecord?: {
    isActive: boolean;
  } | null;
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
    interval: string | null;
  } | null;
}

interface MenuItem {
  title: string;
  href: string;
  icon: string;
  isDivider?: boolean;
  readOnly?: boolean;
}

interface Permissions {
  userType: 'admin' | 'corporate' | 'personal' | 'permanent' | 'invited-member' | 'financial-admin';
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isFinancialAdmin: boolean;
  hasCorpAccess: boolean;
  isCorpAdmin: boolean;
  isPermanentUser: boolean;
  permanentPlanType: string | null;
  userRole: 'admin' | 'member' | 'personal' | 'financial-admin' | null;
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

// ナビゲーション生成機能（統合版）- 一切変更なし
function generateNavigationEnhanced(
  permissions: Permissions,
  currentPath?: string | null,
): Navigation {
  const { userType, permanentPlanType } = permissions;

  const menuTemplates: Record<string, MenuItem[]> = {
    // スーパー管理者用メニュー
    admin: [
      { title: '管理者ダッシュボード', href: '/dashboard/admin', icon: 'HiShieldCheck' },
      { title: '財務管理', href: '#financial-divider', icon: '', isDivider: true },
      { title: '財務ダッシュボード', href: '/dashboard/admin/financial', icon: 'HiCurrencyDollar' },
      { title: '経費管理', href: '/dashboard/admin/company-expenses', icon: 'HiDocumentText' },
      { title: '売上管理', href: '/dashboard/admin/stripe/revenue', icon: 'HiLightningBolt' },
      { title: '受託者支払い管理', href: '/dashboard/admin/contractor-payments', icon: 'HiUsers' },
      { title: '財務管理者管理', href: '/dashboard/admin/financial-admins', icon: 'HiUserGroup' },
      { title: 'システム管理', href: '#system-divider', icon: '', isDivider: true },
      { title: 'ユーザー管理', href: '/dashboard/admin/users', icon: 'HiUsers' },
      {
        title: 'サブスクリプション管理',
        href: '/dashboard/admin/subscriptions',
        icon: 'HiCreditCard',
      },
      {
        title: 'ワンタップシール管理',
        href: '/dashboard/admin/one-tap-seal-orders',
        icon: 'HiLightningBolt',
      },
      {
        title: '解約申請管理',
        href: '/dashboard/admin/cancel-requests',
        icon: 'HiExclamationCircle',
      },
      {
        title: 'データエクスポート管理',
        href: '/dashboard/admin/users/export',
        icon: 'HiDownload',
      },
      { title: 'プロフィール・QR管理', href: '/dashboard/admin/profiles', icon: 'HiEye' },
      { title: '永久利用権管理', href: '/dashboard/admin/permissions', icon: 'HiKey' },
      { title: 'お知らせ管理', href: '/dashboard/admin/notifications', icon: 'HiBell' },
      { title: 'メール配信管理', href: '/dashboard/admin/email', icon: 'HiOutlineMail' },
    ],

    // 財務管理者専用メニュー（完全版）
    'financial-admin': [
      { title: '管理者ダッシュボード', href: '/dashboard/admin', icon: 'HiShieldCheck' },
      { title: '財務管理', href: '#financial-divider', icon: '', isDivider: true },
      { title: '財務ダッシュボード', href: '/dashboard/admin/financial', icon: 'HiCurrencyDollar' },
      { title: '経費管理', href: '/dashboard/admin/company-expenses', icon: 'HiDocumentText' },
      { title: '売上管理', href: '/dashboard/admin/stripe/revenue', icon: 'HiLightningBolt' },
      {
        title: '受託者支払い管理',
        href: '/dashboard/admin/contractor-payments',
        icon: 'HiUsers',
        readOnly: true,
      },
      {
        title: '財務管理者管理',
        href: '/dashboard/admin/financial-admins',
        icon: 'HiUserGroup',
        readOnly: true,
      },
      { title: 'システム管理', href: '#system-divider', icon: '', isDivider: true },
      {
        title: 'ユーザー管理',
        href: '/dashboard/admin/users',
        icon: 'HiUsers',
        readOnly: true,
      },
      {
        title: 'サブスクリプション管理',
        href: '/dashboard/admin/subscriptions',
        icon: 'HiCreditCard',
        readOnly: true,
      },
      {
        title: 'ワンタップシール管理',
        href: '/dashboard/admin/one-tap-seal-orders',
        icon: 'HiLightningBolt',
        readOnly: true,
      },
      {
        title: '解約申請管理',
        href: '/dashboard/admin/cancel-requests',
        icon: 'HiExclamationCircle',
        readOnly: true,
      },
      {
        title: 'データエクスポート管理',
        href: '/dashboard/admin/users/export',
        icon: 'HiDownload',
        readOnly: true,
      },
      {
        title: 'プロフィール・QR管理',
        href: '/dashboard/admin/profiles',
        icon: 'HiEye',
        readOnly: true,
      },
      {
        title: '永久利用権管理',
        href: '/dashboard/admin/permissions',
        icon: 'HiKey',
        readOnly: true,
      },
      {
        title: 'お知らせ管理',
        href: '/dashboard/admin/notifications',
        icon: 'HiBell',
        readOnly: true,
      },
      {
        title: 'メール配信管理',
        href: '/dashboard/admin/email',
        icon: 'HiOutlineMail',
        readOnly: true,
      },
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
      { title: '使い方動画', href: '/dashboard/tutorial', icon: 'HiPlay' },
      { title: 'セキュリティ設定', href: '/dashboard/security', icon: 'HiShieldCheck' },
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
        { title: '使い方動画', href: '/dashboard/tutorial', icon: 'HiPlay' },
        { title: 'セキュリティ設定', href: '/dashboard/security', icon: 'HiShieldCheck' },
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

  // 基本メニューアイテム
  const menuItems = menuTemplates[userType] || [];

  // デフォルトのリダイレクト設定
  const defaultRedirectMap: Record<string, string> = {
    admin: '/dashboard/admin',
    'financial-admin': '/dashboard/admin',
    corporate: '/dashboard/corporate',
    'invited-member': '/dashboard/corporate-member',
    personal: '/dashboard',
    permanent: permanentPlanType === 'personal' ? '/dashboard' : '/dashboard/corporate',
  };

  // 🔧 1. 管理者ページのチェック（型を正しく修正）
  if (currentPath?.startsWith('/dashboard/admin')) {
    if (!permissions.isSuperAdmin && !permissions.isFinancialAdmin) {
      // 権限がない場合は適切なページにリダイレクト
      const redirectTarget = permissions.hasCorpAccess
        ? permissions.isAdmin
          ? '/dashboard/corporate'
          : '/dashboard/corporate-member'
        : '/dashboard';

      return {
        shouldRedirect: true,
        redirectPath: redirectTarget,
        menuItems,
      };
    }
    return { shouldRedirect: false, redirectPath: null, menuItems };
  }

  // 2. 法人管理ページのチェック (/dashboard/corporate)
  if (
    currentPath?.startsWith('/dashboard/corporate') &&
    !currentPath.startsWith('/dashboard/corporate-member')
  ) {
    if (!permissions.isAdmin && !permissions.isSuperAdmin) {
      return {
        shouldRedirect: true,
        redirectPath: permissions.hasCorpAccess ? '/dashboard/corporate-member' : '/dashboard',
        menuItems,
      };
    }
    return { shouldRedirect: false, redirectPath: null, menuItems };
  }

  // 3. 法人メンバーページのチェック (/dashboard/corporate-member)
  if (currentPath?.startsWith('/dashboard/corporate-member')) {
    if (!permissions.hasCorpAccess && !permissions.isSuperAdmin) {
      return {
        shouldRedirect: true,
        redirectPath: '/dashboard',
        menuItems,
      };
    }
    return { shouldRedirect: false, redirectPath: null, menuItems };
  }

  // 🔧 4. 個人ダッシュボードページ（/dashboard）の処理
  if (currentPath === '/dashboard') {
    // 法人管理者は法人ダッシュボードにリダイレクト
    if (permissions.isAdmin && permissions.hasCorpAccess && !permissions.isSuperAdmin) {
      return {
        shouldRedirect: true,
        redirectPath: '/dashboard/corporate',
        menuItems,
      };
    }

    // 法人招待メンバーは法人メンバーページにリダイレクト
    if (permissions.userRole === 'member' && permissions.hasCorpAccess) {
      return {
        shouldRedirect: true,
        redirectPath: '/dashboard/corporate-member',
        menuItems,
      };
    }

    // 永久利用権法人プランユーザーは法人ダッシュボードにリダイレクト
    if (
      permissions.isPermanentUser &&
      permissions.permanentPlanType !== 'personal' &&
      permissions.hasCorpAccess
    ) {
      return {
        shouldRedirect: true,
        redirectPath: '/dashboard/corporate',
        menuItems,
      };
    }

    // 🔧 個人ユーザーは /dashboard にとどまる（リダイレクトしない）
    if (permissions.userType === 'personal') {
      return {
        shouldRedirect: false,
        redirectPath: null,
        menuItems,
      };
    }

    // 🔧 永久利用権個人プランも /dashboard にとどまる
    if (permissions.isPermanentUser && permissions.permanentPlanType === 'personal') {
      return {
        shouldRedirect: false,
        redirectPath: null,
        menuItems,
      };
    }
  }

  // 5. 個人機能ページでの法人ユーザーリダイレクト
  const personalPages = [
    '/dashboard/profile',
    '/dashboard/links',
    '/dashboard/design',
    '/dashboard/share',
    '/dashboard/subscription',
  ];

  if (personalPages.some((page) => currentPath?.startsWith(page))) {
    // 法人管理者は対応する法人ページにリダイレクト
    if (permissions.isAdmin && permissions.hasCorpAccess) {
      const corporatePageMap: Record<string, string> = {
        '/dashboard/profile': '/dashboard/corporate-member/profile',
        '/dashboard/links': '/dashboard/corporate-member/links',
        '/dashboard/design': '/dashboard/corporate-member/design',
        '/dashboard/share': '/dashboard/corporate-member/share',
        '/dashboard/subscription': '/dashboard/subscription',
      };
      const targetPage = personalPages.find((page) => currentPath?.startsWith(page));
      if (
        targetPage &&
        corporatePageMap[targetPage] &&
        corporatePageMap[targetPage] !== currentPath
      ) {
        return {
          shouldRedirect: true,
          redirectPath: corporatePageMap[targetPage],
          menuItems,
        };
      }
    }

    // 法人招待メンバーも同様
    if (permissions.userRole === 'member' && permissions.hasCorpAccess) {
      const corporatePageMap: Record<string, string> = {
        '/dashboard/profile': '/dashboard/corporate-member/profile',
        '/dashboard/links': '/dashboard/corporate-member/links',
        '/dashboard/design': '/dashboard/corporate-member/design',
        '/dashboard/share': '/dashboard/corporate-member/share',
        '/dashboard/subscription': '/dashboard/subscription',
      };
      const targetPage = personalPages.find((page) => currentPath?.startsWith(page));
      if (
        targetPage &&
        corporatePageMap[targetPage] &&
        corporatePageMap[targetPage] !== currentPath
      ) {
        return {
          shouldRedirect: true,
          redirectPath: corporatePageMap[targetPage],
          menuItems,
        };
      }
    }
  }

  // 6. デフォルト: リダイレクトなし
  return {
    shouldRedirect: false,
    redirectPath: null,
    menuItems,
  };
}

function calculatePermissionsFixed(userData: UserData): Permissions {
  const isAdminEmail = userData.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

  // 🆕 財務管理者判定ロジック
  const isFinancialAdmin =
    userData.email.includes(FINANCIAL_ADMIN_DOMAIN) &&
    userData.financialAdminRecord?.isActive === true;

  logger.debug('🔧 権限計算詳細デバッグ:', {
    email: userData.email,
    subscriptionStatus: userData.subscriptionStatus,
    corporateRole: userData.corporateRole,
    hasAdminTenant: !!userData.adminOfTenant,
    hasTenant: !!userData.tenant,
    isAdminEmail,
    isFinancialAdmin,
    financialAdminRecord: userData.financialAdminRecord,
  });

  // 🆕 スーパー管理者判定（最優先）
  if (isAdminEmail) {
    logger.debug('✅ スーパー管理者を検出');
    return {
      userType: 'admin',
      isAdmin: true,
      isSuperAdmin: true,
      isFinancialAdmin: false,
      hasCorpAccess: true,
      isCorpAdmin: false,
      isPermanentUser: false,
      permanentPlanType: null,
      userRole: 'admin',
      hasActivePlan: true,
      isTrialPeriod: false,
      planType: null,
      planDisplayName: 'スーパー管理者',
    };
  }

  // 🆕 財務管理者判定
  if (isFinancialAdmin) {
    logger.debug('✅ 財務管理者を検出');
    return {
      userType: 'financial-admin',
      isAdmin: true,
      isSuperAdmin: false,
      isFinancialAdmin: true,
      hasCorpAccess: false,
      isCorpAdmin: false,
      isPermanentUser: false,
      permanentPlanType: null,
      userRole: 'financial-admin',
      hasActivePlan: true,
      isTrialPeriod: false,
      planType: null,
      planDisplayName: '財務管理者',
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
      isFinancialAdmin: false,
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
      isFinancialAdmin: false,
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
      isFinancialAdmin: false,
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

  // 🔧 修正: 個人ユーザーの判定 - プラン表示名の改善
  logger.debug('✅ 個人ユーザーとして判定');
  const hasPersonalPlan = userData.subscription?.status === 'active';
  const isTrialUser =
    userData.subscriptionStatus === 'trialing' || userData.subscription?.status === 'trialing';
  const isTrialActive =
    isTrialUser && userData.trialEndsAt ? new Date(userData.trialEndsAt) > new Date() : false;

  // 🔧 プラン表示名のロジックを改善
  let planDisplayName = 'プランなし';
  
  if (hasPersonalPlan) {
    // アクティブな個人プランがある場合
    if (userData.subscription?.plan && userData.subscription?.interval) {
      const plan = userData.subscription.plan.toLowerCase();
      const interval = userData.subscription.interval;
      
      if (plan.includes('monthly') || interval === 'month') {
        planDisplayName = '個人プラン（月額）';
      } else if (plan.includes('yearly') || interval === 'year') {
        planDisplayName = '個人プラン（年額）';
      } else {
        planDisplayName = '個人プラン';
      }
    } else {
      planDisplayName = '個人プラン';
    }
  } else if (isTrialActive) {
    // トライアル中の場合
    planDisplayName = '無料トライアル中';
  } else if (isTrialUser) {
    // トライアル期間が終了している場合
    planDisplayName = 'トライアル終了';
  } else {
    // その他の場合
    planDisplayName = 'プランなし';
  }

  return {
    userType: 'personal',
    isAdmin: false,
    isSuperAdmin: false,
    isFinancialAdmin: false,
    hasCorpAccess: false,
    isCorpAdmin: false,
    isPermanentUser: false,
    permanentPlanType: null,
    userRole: 'personal',
    hasActivePlan: hasPersonalPlan || isTrialActive,
    isTrialPeriod: isTrialActive,
    planType: 'personal',
    planDisplayName,
  };
}

// プラン種別の表示名を取得する関数
function getPlanDisplayName(planType: string): string {
  const displayNames: Record<string, string> = {
    personal: '個人プラン',
    starter: 'スタータープラン (10名まで)',
    business: 'ビジネスプラン (30名まで)',
    enterprise: 'エンタープライズ (50名まで)',
  };
  return displayNames[planType] || 'プラン';
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    logger.debug('📊 Dashboard API開始 - タイムスタンプ:', new Date().toISOString());

    const url = new URL(request.url);
    const referer = request.headers.get('referer');
    const currentPath = referer ? new URL(referer).pathname : url.searchParams.get('path');

    const session = await auth();
    if (!session?.user?.id) {
      logger.debug('❌ 認証されていません');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    logger.debug('🔍 ユーザーID:', userId, '| パス:', currentPath);

    try {
      // 🔧 修正: ensurePrismaConnection()を削除し、直接safeQueryでユーザーデータを取得
      const userData = await safeQuery(async () => {
        return await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            subscriptionStatus: true,
            corporateRole: true,
            trialEndsAt: true,
            // 🆕 財務管理者情報を追加
            financialAdminRecord: {
              select: {
                isActive: true,
              },
            },
            adminOfTenant: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
                primaryColor: true,
                secondaryColor: true,
                accountStatus: true,
                maxUsers: true,
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
                maxUsers: true,
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
        });
      });

      if (!userData) {
        logger.debug('❌ ユーザー見つからず');
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // 🆕 財務管理者フラグを設定し、interval を適切に変換
      const userDataWithFlags: UserData = {
        ...userData,
        isFinancialAdmin: !!userData.financialAdminRecord?.isActive,
        subscription: userData.subscription
          ? {
              ...userData.subscription,
              interval: userData.subscription.interval || null,
            }
          : null,
      };

      const permissions = calculatePermissionsFixed(userDataWithFlags);
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
              accountStatus: tenant.accountStatus,
              maxUsers: tenant.maxUsers,
            }
          : null,
        processingTime: Date.now() - startTime,
      };

      logger.debug('✅ Dashboard API完了 - 処理時間:', Date.now() - startTime, 'ms');
      return NextResponse.json(response);
    } catch (dbError) {
      logger.error('❌ Dashboard API データベースエラー:', dbError);
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);

      return NextResponse.json(
        {
          error: 'Database connection failed',
          details:
            process.env.NODE_ENV === 'development'
              ? errorMessage
              : 'データベース接続エラーが発生しました',
        },
        { status: 503 },
      );
    }
  } catch (error: any) {
    logger.error('❌ Dashboard API 全体エラー:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        details:
          process.env.NODE_ENV === 'development' ? errorMessage : 'サーバーエラーが発生しました',
      },
      { status: 500 },
    );
  }
}