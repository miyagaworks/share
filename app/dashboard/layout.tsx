// app/dashboard/layout.tsx
'use client';
import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useDashboardInfo } from '@/hooks/useDashboardInfo';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Spinner } from '@/components/ui/Spinner';

// 静的アイコンマッピング
import {
  HiHome,
  HiUser,
  HiLink,
  HiColorSwatch,
  HiPlay,
  HiShare,
  HiCreditCard,
  HiOfficeBuilding,
  HiUsers,
  HiTemplate,
  HiCog,
  HiShieldCheck,
  HiKey,
  HiBell,
  HiOutlineMail,
  HiEye,
  HiDownload,
  HiExclamationCircle,
  HiUserGroup,
  HiCurrencyDollar, // 🆕 追加
  HiDocumentText, // 🆕 追加
  HiLightningBolt, // 🆕 追加
} from 'react-icons/hi';

// 拡張版アイコンマッピング
const iconMap: Record<string, React.ReactNode> = {
  HiHome: <HiHome className="h-5 w-5" />,
  HiUser: <HiUser className="h-5 w-5" />,
  HiLink: <HiLink className="h-5 w-5" />,
  HiColorSwatch: <HiColorSwatch className="h-5 w-5" />,
  HiPlay: <HiPlay className="h-5 w-5" />,
  HiShare: <HiShare className="h-5 w-5" />,
  HiCreditCard: <HiCreditCard className="h-5 w-5" />,
  HiOfficeBuilding: <HiOfficeBuilding className="h-5 w-5" />,
  HiUsers: <HiUsers className="h-5 w-5" />,
  HiTemplate: <HiTemplate className="h-5 w-5" />,
  HiCog: <HiCog className="h-5 w-5" />,
  HiShieldCheck: <HiShieldCheck className="h-5 w-5" />,
  HiKey: <HiKey className="h-5 w-5" />,
  HiBell: <HiBell className="h-5 w-5" />,
  HiOutlineMail: <HiOutlineMail className="h-5 w-5" />,
  HiEye: <HiEye className="h-5 w-5" />,
  HiDownload: <HiDownload className="h-5 w-5" />,
  HiExclamationCircle: <HiExclamationCircle className="h-5 w-5" />,
  HiUserGroup: <HiUserGroup className="h-5 w-5" />,

  // 🆕 財務管理関連アイコン追加
  HiCurrencyDollar: <HiCurrencyDollar className="h-5 w-5" />,
  HiDocumentText: <HiDocumentText className="h-5 w-5" />,
  HiLightningBolt: <HiLightningBolt className="h-5 w-5" />,
};

interface DashboardLayoutWrapperProps {
  children: ReactNode;
}

export default function DashboardLayoutWrapper({ children }: DashboardLayoutWrapperProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { data: dashboardInfo, isLoading, error } = useDashboardInfo();

  // リダイレクト状態管理
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectReason, setRedirectReason] = useState<string>('');

  // Body要素にパス名属性を設定（CSSでの判定用）
  useEffect(() => {
    if (typeof document !== 'undefined' && pathname) {
      document.body.setAttribute('data-pathname', pathname);
      return () => {
        document.body.removeAttribute('data-pathname');
      };
    }
  }, [pathname]);

  // 🔥 修正: 永久利用権個人プランを最優先でチェックするアクセス権判定
  const accessCheck = useMemo(() => {
    if (!dashboardInfo || !pathname) return { hasAccess: true };
    const { permissions } = dashboardInfo;

    // 🚀 最優先: 永久利用権個人プランユーザーの処理
    if (permissions.isPermanentUser && permissions.permanentPlanType === 'personal') {

      // 法人関連ページへのアクセスは拒否
      if (pathname.startsWith('/dashboard/corporate')) {
        return {
          hasAccess: false,
          redirectTo: '/dashboard',
          reason: '永久利用権個人プランユーザーは法人機能にアクセスできません',
        };
      }

      // 個人機能ページと基本ダッシュボードは許可
      const allowedPersonalPages = [
        '/dashboard',
        '/dashboard/profile',
        '/dashboard/links',
        '/dashboard/design',
        '/dashboard/share',
        '/dashboard/subscription',
      ];

      if (allowedPersonalPages.some((page) => pathname.startsWith(page))) {
        return { hasAccess: true };
      }

      // その他のページは個人ダッシュボードにリダイレクト
      return {
        hasAccess: false,
        redirectTo: '/dashboard',
        reason: '永久利用権個人プランユーザーは個人機能のみ利用可能',
      };
    }

    // 1. 管理者ページのチェック
    if (pathname.startsWith('/dashboard/admin')) {
      if (!permissions.isSuperAdmin && !permissions.isFinancialAdmin) {
        // 🔧 修正
        return {
          hasAccess: false,
          redirectTo: permissions.hasCorpAccess
            ? permissions.isAdmin
              ? '/dashboard/corporate'
              : '/dashboard/corporate-member'
            : '/dashboard',
          reason: '管理者権限なし',
        };
      }
      return { hasAccess: true };
    }

    // 2. 法人管理ページのチェック (/dashboard/corporate)
    if (
      pathname.startsWith('/dashboard/corporate') &&
      !pathname.startsWith('/dashboard/corporate-member')
    ) {
      if (!permissions.isAdmin && !permissions.isSuperAdmin) {
        return {
          hasAccess: false,
          redirectTo: permissions.hasCorpAccess ? '/dashboard/corporate-member' : '/dashboard',
          reason: '法人管理権限なし',
        };
      }
      return { hasAccess: true };
    }

    // 3. 法人メンバーページのチェック (/dashboard/corporate-member)
    if (pathname.startsWith('/dashboard/corporate-member')) {
      if (!permissions.hasCorpAccess && !permissions.isSuperAdmin) {
        return { hasAccess: false, redirectTo: '/dashboard', reason: '法人メンバー権限なし' };
      }
      return { hasAccess: true };
    }

    // 4. 個人ダッシュボードページでの法人ユーザーリダイレクト
    if (pathname === '/dashboard') {
      // 法人管理者は法人ダッシュボードにリダイレクト
      if (permissions.isAdmin && permissions.hasCorpAccess && !permissions.isSuperAdmin) {
        return {
          hasAccess: false,
          redirectTo: '/dashboard/corporate',
          reason: '法人管理者は法人ダッシュボードを使用',
        };
      }

      // 法人招待メンバーは法人メンバーページにリダイレクト
      if (permissions.userRole === 'member' && permissions.hasCorpAccess) {
        return {
          hasAccess: false,
          redirectTo: '/dashboard/corporate-member',
          reason: '法人メンバーは専用ページを使用',
        };
      }

      // 🔥 永久利用権法人プランユーザーは法人ダッシュボードにリダイレクト
      if (
        permissions.isPermanentUser &&
        permissions.permanentPlanType !== 'personal' &&
        permissions.hasCorpAccess
      ) {
        return {
          hasAccess: false,
          redirectTo: '/dashboard/corporate',
          reason: '永久利用権法人プランユーザーは法人ダッシュボードを使用',
        };
      }
    }

    // 5. 個人機能ページでの法人ユーザーリダイレクト
    const personalPages = [
      '/dashboard/profile',
      '/dashboard/links',
      '/dashboard/design',
      '/dashboard/share',
    ];
    if (personalPages.some((page) => pathname.startsWith(page))) {
      // 法人管理者は対応する法人ページにリダイレクト
      if (permissions.isAdmin && permissions.hasCorpAccess) {
        const corporatePageMap: Record<string, string> = {
          '/dashboard/profile': '/dashboard/corporate-member/profile',
          '/dashboard/links': '/dashboard/corporate-member/links',
          '/dashboard/design': '/dashboard/corporate-member/design',
          '/dashboard/share': '/dashboard/corporate-member/share',
        };
        const targetPage = personalPages.find((page) => pathname.startsWith(page));
        if (targetPage && corporatePageMap[targetPage]) {
          return {
            hasAccess: false,
            redirectTo: corporatePageMap[targetPage],
            reason: '法人管理者は法人版を使用',
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
        };
        const targetPage = personalPages.find((page) => pathname.startsWith(page));
        if (targetPage && corporatePageMap[targetPage]) {
          return {
            hasAccess: false,
            redirectTo: corporatePageMap[targetPage],
            reason: '法人メンバーは法人版を使用',
          };
        }
      }
    }

    // 6. その他のページはアクセス許可
    return { hasAccess: true };
  }, [dashboardInfo, pathname]);

  // テーマクラスの決定
  const themeClass = useMemo(() => {
    if (!dashboardInfo) return '';
    const { permissions } = dashboardInfo;

    // 永久利用権個人プランは個人テーマを使用
    if (permissions.isPermanentUser && permissions.permanentPlanType === 'personal') {
      return '';
    }

    const isCorporateRelated =
      pathname?.startsWith('/dashboard/corporate') ||
      pathname?.startsWith('/dashboard/corporate-member') ||
      permissions.hasCorpAccess;
    return isCorporateRelated ? 'corporate-theme' : '';
  }, [dashboardInfo, pathname]);

  // CSS変数の強制設定を追加
  useEffect(() => {
    if (themeClass === 'corporate-theme') {
      document.documentElement.style.setProperty('--corporate-primary', '#1E3A8A');
      document.documentElement.style.setProperty('--corporate-secondary', '#122153');
      document.documentElement.style.setProperty('--color-corporate-primary', '#1E3A8A');
      document.documentElement.style.setProperty('--color-corporate-secondary', '#122153');
    }
  }, [themeClass]);

  // 🔥 修正: 強化されたリダイレクト処理
  useEffect(() => {
    // 認証チェック
    if (status !== 'loading' && !session) {
      setIsRedirecting(true);
      setRedirectReason('認証が必要です');
      window.location.href = '/auth/signin';
      return;
    }

    // ダッシュボード情報の読み込み中は何もしない
    if (!dashboardInfo || isLoading) return;

    // アクセス権チェックによるリダイレクト
    if (!accessCheck.hasAccess && accessCheck.redirectTo) {
      if (pathname !== accessCheck.redirectTo) {
        setIsRedirecting(true);
        setRedirectReason(accessCheck.reason || 'リダイレクト中');
        window.location.href = accessCheck.redirectTo;
        return;
      }
    }
  }, [session, status, dashboardInfo, pathname, accessCheck, router, isLoading]);

  // 早期リターン - セッション読み込み中
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-500">セッション確認中...</span>
      </div>
    );
  }

  // 早期リターン - ダッシュボード情報読み込み中
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-500">ダッシュボード準備中...</span>
      </div>
    );
  }

  // 早期リターン - リダイレクト中
  if (isRedirecting) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-500">{redirectReason || 'リダイレクト中...'}</span>
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center max-w-md">
          <h3 className="text-lg font-medium text-gray-900 mb-2">エラーが発生しました</h3>
          <p className="text-sm text-gray-500 mb-4">ダッシュボード情報の取得に失敗しました。</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            ページを再読み込み
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardInfo) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // メニュー項目変換
  const menuItems = dashboardInfo.navigation.menuItems.map((item) => ({
    ...item,
    icon: iconMap[item.icon] || iconMap.HiHome,
  }));

  return (
    <div className={themeClass}>
      <DashboardLayout items={menuItems}>{children}</DashboardLayout>
    </div>
  );
}