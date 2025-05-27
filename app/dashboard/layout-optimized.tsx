// app/dashboard/layout-optimized.tsx
'use client';

import React, { ReactNode, useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useDashboardInfo } from '@/hooks/useDashboardInfo';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Spinner } from '@/components/ui/Spinner';

// 🚀 静的アイコンマッピング（動的インポート削除で高速化）
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

  // 🚀 統合APIから全データを1回で取得
  const { data: dashboardInfo, isLoading, error } = useDashboardInfo();

  // 🚀 メモ化されたアクセスチェック（再計算を最小化）
  const accessCheck = useMemo(() => {
    if (!dashboardInfo || !pathname) return { hasAccess: true };

    const { permissions } = dashboardInfo;

    // 管理者ページチェック
    if (pathname.startsWith('/dashboard/admin') && !permissions.isSuperAdmin) {
      return { hasAccess: false, redirectTo: '/dashboard' };
    }

    // 法人ページチェック
    if (
      pathname.startsWith('/dashboard/corporate') &&
      !permissions.hasCorpAccess &&
      !permissions.isSuperAdmin
    ) {
      return { hasAccess: false, redirectTo: '/dashboard' };
    }

    // 🎯 招待メンバーの即座判定
    if (
      permissions.userType === 'invited-member' &&
      !pathname.startsWith('/dashboard/corporate-member')
    ) {
      return { hasAccess: false, redirectTo: '/dashboard/corporate-member' };
    }

    return { hasAccess: true };
  }, [dashboardInfo, pathname]);

  // 🚀 効率的なリダイレクト処理
  useEffect(() => {
    if (status !== 'loading' && !session) {
      router.push('/auth/signin');
      return;
    }

    if (!dashboardInfo) return;

    // 初期リダイレクト（ダッシュボードルートのみ）
    if (
      dashboardInfo.navigation.shouldRedirect &&
      dashboardInfo.navigation.redirectPath &&
      pathname === '/dashboard'
    ) {
      console.log('🚀 リダイレクト実行:', dashboardInfo.navigation.redirectPath);
      router.push(dashboardInfo.navigation.redirectPath);
      return;
    }

    // アクセス権チェックによるリダイレクト
    if (accessCheck.redirectTo) {
      console.log('🚀 アクセス権リダイレクト:', accessCheck.redirectTo);
      router.push(accessCheck.redirectTo);
    }
  }, [session, status, dashboardInfo, pathname, accessCheck, router]);

  // 🚀 早期リターンによる高速化
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

  // 🚀 静的マッピングによる高速アイコン変換
  const menuItems = dashboardInfo.navigation.menuItems.map((item) => ({
    ...item,
    icon: iconMap[item.icon] || iconMap.HiHome,
  }));

  console.log('🚀 レンダリング完了:', {
    userType: dashboardInfo.permissions.userType,
    menuCount: menuItems.length,
    hasAccess: accessCheck.hasAccess,
  });

  return <DashboardLayout items={menuItems}>{children}</DashboardLayout>;
}