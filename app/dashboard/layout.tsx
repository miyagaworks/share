// app/dashboard/layout.tsx (修正版)
'use client';

import React, { ReactNode, useEffect, useMemo } from 'react';
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
} from 'react-icons/hi';

const iconMap: Record<string, React.ReactNode> = {
  HiHome: <HiHome className="h-5 w-5" />,
  HiUser: <HiUser className="h-5 w-5" />,
  HiLink: <HiLink className="h-5 w-5" />,
  HiColorSwatch: <HiColorSwatch className="h-5 w-5" />,
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
};

interface DashboardLayoutWrapperProps {
  children: ReactNode;
}

export default function DashboardLayoutWrapper({ children }: DashboardLayoutWrapperProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const { data: dashboardInfo, isLoading, error } = useDashboardInfo();

  // Body要素にパス名属性を設定（CSSでの判定用）
  useEffect(() => {
    if (typeof document !== 'undefined' && pathname) {
      document.body.setAttribute('data-pathname', pathname);
      return () => {
        document.body.removeAttribute('data-pathname');
      };
    }
  }, [pathname]);

  // 🔥 修正: シンプルで明確なアクセス権チェック
  const accessCheck = useMemo(() => {
    if (!dashboardInfo || !pathname) return { hasAccess: true };

    const { permissions } = dashboardInfo;

    console.log('📋 アクセス権チェック:', {
      pathname,
      userType: permissions.userType,
      hasCorpAccess: permissions.hasCorpAccess,
      isAdmin: permissions.isAdmin,
      isSuperAdmin: permissions.isSuperAdmin,
    });

    // 1. 管理者ページのチェック
    if (pathname.startsWith('/dashboard/admin')) {
      if (!permissions.isSuperAdmin) {
        return { hasAccess: false, redirectTo: '/dashboard', reason: 'admin権限なし' };
      }
      return { hasAccess: true };
    }

    // 2. 法人管理ページのチェック (/dashboard/corporate)
    if (
      pathname.startsWith('/dashboard/corporate') &&
      !pathname.startsWith('/dashboard/corporate-member')
    ) {
      if (!permissions.isAdmin && !permissions.isSuperAdmin) {
        return { hasAccess: false, redirectTo: '/dashboard', reason: '法人管理権限なし' };
      }
      return { hasAccess: true };
    }

    // 3. 法人メンバーページのチェック (/dashboard/corporate-member)
    if (pathname.startsWith('/dashboard/corporate-member')) {
      // 法人アクセス権またはスーパー管理者権限が必要
      if (!permissions.hasCorpAccess && !permissions.isSuperAdmin) {
        return { hasAccess: false, redirectTo: '/dashboard', reason: '法人メンバー権限なし' };
      }
      return { hasAccess: true };
    }

    // 4. その他のページはアクセス許可
    return { hasAccess: true };
  }, [dashboardInfo, pathname]);

  // 🔥 修正: テーマクラスの決定（シンプル化）
  const themeClass = useMemo(() => {
    if (!dashboardInfo) return '';

    const { permissions } = dashboardInfo;
    const isCorporateRelated =
      pathname?.startsWith('/dashboard/corporate') ||
      pathname?.startsWith('/dashboard/corporate-member') ||
      permissions.hasCorpAccess;

    return isCorporateRelated ? 'corporate-theme' : '';
  }, [dashboardInfo, pathname]);

  // 🔥 修正: リダイレクト処理（シンプル化）
  useEffect(() => {
    // 認証チェック
    if (status !== 'loading' && !session) {
      console.log('🚪 未認証 → サインインページ');
      router.push('/auth/signin');
      return;
    }

    // ダッシュボード情報の読み込み中は何もしない
    if (!dashboardInfo || isLoading) return;

    console.log('🔍 リダイレクト判定:', {
      pathname,
      hasAccess: accessCheck.hasAccess,
      redirectTo: accessCheck.redirectTo,
      reason: accessCheck.reason,
      userType: dashboardInfo.permissions.userType,
    });

    // アクセス権チェックによるリダイレクト
    if (!accessCheck.hasAccess && accessCheck.redirectTo) {
      // 既に正しいページにいる場合はリダイレクトしない
      if (pathname !== accessCheck.redirectTo) {
        console.log(
          `🚀 アクセス拒否 → リダイレクト: ${pathname} → ${accessCheck.redirectTo} (理由: ${accessCheck.reason})`,
        );
        router.push(accessCheck.redirectTo);
        return;
      }
    }

    // 🔥 修正: ダッシュボードルートでの初期リダイレクト
    if (
      pathname === '/dashboard' &&
      dashboardInfo.navigation.shouldRedirect &&
      dashboardInfo.navigation.redirectPath
    ) {
      // 無限ループを防ぐ
      if (dashboardInfo.navigation.redirectPath !== '/dashboard') {
        console.log(
          `🏠 ダッシュボードルート → 初期リダイレクト: ${dashboardInfo.navigation.redirectPath}`,
        );
        router.push(dashboardInfo.navigation.redirectPath);
        return;
      }
    }

    console.log('✅ アクセス許可:', { pathname, userType: dashboardInfo.permissions.userType });
  }, [session, status, dashboardInfo, pathname, accessCheck, router, isLoading]);

  // 早期リターン
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-500">セッション確認中...</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-500">ダッシュボード準備中...</span>
      </div>
    );
  }

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

  console.log('🎨 レンダリング:', {
    pathname,
    userType: dashboardInfo.permissions.userType,
    menuCount: menuItems.length,
    themeClass,
    hasAccess: accessCheck.hasAccess,
  });

  return (
    <div className={themeClass}>
      <DashboardLayout items={menuItems}>{children}</DashboardLayout>
    </div>
  );
}