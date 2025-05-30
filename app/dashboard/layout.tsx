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

  // 🚀 Body要素にパス名属性を設定（CSSでの判定用）
  useEffect(() => {
    if (typeof document !== 'undefined' && pathname) {
      document.body.setAttribute('data-pathname', pathname);

      // クリーンアップ
      return () => {
        document.body.removeAttribute('data-pathname');
      };
    }
  }, [pathname]);

  // 🚀 修正されたアクセスチェック
  const accessCheck = useMemo(() => {
    if (!dashboardInfo || !pathname) return { hasAccess: true };

    const { permissions } = dashboardInfo;

    console.log('🔧 アクセスチェック:', {
      userType: permissions.userType,
      pathname,
      hasCorpAccess: permissions.hasCorpAccess,
      isInvitedMember: permissions.userType === 'invited-member',
      isAdmin: permissions.isAdmin,
      isSuperAdmin: permissions.isSuperAdmin,
    });

    // 管理者ページチェック
    if (pathname.startsWith('/dashboard/admin') && !permissions.isSuperAdmin) {
      return { hasAccess: false, redirectTo: '/dashboard' };
    }

    // 🔥 修正: 法人ページのアクセス権チェックを改善
    if (
      pathname.startsWith('/dashboard/corporate') &&
      !pathname.startsWith('/dashboard/corporate-member')
    ) {
      // 法人管理ページへのアクセス権チェック
      if (!permissions.hasCorpAccess && !permissions.isSuperAdmin && !permissions.isAdmin) {
        return { hasAccess: false, redirectTo: '/dashboard' };
      }
    }

    // 🔥 修正: 法人メンバーページのアクセス権チェックを大幅に改善
    if (pathname.startsWith('/dashboard/corporate-member')) {
      // 法人アクセス権があるユーザーは全てアクセス可能（管理者・招待メンバー問わず）
      if (!permissions.hasCorpAccess && !permissions.isSuperAdmin) {
        console.log('🔧 法人メンバーページアクセス権なし:', {
          hasCorpAccess: permissions.hasCorpAccess,
          isSuperAdmin: permissions.isSuperAdmin,
          userType: permissions.userType,
        });
        return { hasAccess: false, redirectTo: '/dashboard' };
      }

      // アクセス権がある場合は許可
      console.log('🔧 法人メンバーページアクセス許可:', {
        userType: permissions.userType,
        hasCorpAccess: permissions.hasCorpAccess,
        isAdmin: permissions.isAdmin,
      });
    }

    // 🎯 招待メンバーの厳格なチェック（修正）
    if (permissions.userType === 'invited-member') {
      // 招待メンバーは法人メンバーページ以外アクセス禁止
      if (!pathname.startsWith('/dashboard/corporate-member')) {
        console.log('🔧 招待メンバーを法人メンバーページにリダイレクト');
        return { hasAccess: false, redirectTo: '/dashboard/corporate-member' };
      }
    }

    return { hasAccess: true };
  }, [dashboardInfo, pathname]);

  // 🚀 テーマクラスの決定
  const themeClass = useMemo(() => {
    if (!dashboardInfo) return '';

    const { permissions } = dashboardInfo;
    const isCorporateSection = pathname?.startsWith('/dashboard/corporate');
    const isCorporateMemberSection = pathname?.startsWith('/dashboard/corporate-member');

    // 法人関連セクションまたは法人ユーザータイプの場合
    if (
      isCorporateSection ||
      isCorporateMemberSection ||
      permissions.userType === 'corporate' ||
      permissions.userType === 'invited-member' ||
      permissions.hasCorpAccess
    ) {
      return 'corporate-theme';
    }

    return '';
  }, [dashboardInfo, pathname]);

  // 🔥 大幅修正: リダイレクト処理を改善
  useEffect(() => {
    if (status !== 'loading' && !session) {
      router.push('/auth/signin');
      return;
    }

    if (!dashboardInfo) return;

    console.log('🔧 リダイレクト判定:', {
      pathname,
      shouldRedirect: dashboardInfo.navigation.shouldRedirect,
      redirectPath: dashboardInfo.navigation.redirectPath,
      userType: dashboardInfo.permissions.userType,
      accessCheck: accessCheck,
    });

    // 🔥 修正: ダッシュボードルート（/dashboard）の場合のみ初期リダイレクト
    if (
      pathname === '/dashboard' &&
      dashboardInfo.navigation.shouldRedirect &&
      dashboardInfo.navigation.redirectPath
    ) {
      console.log(
        '🚀 /dashboard からの初期リダイレクト実行:',
        dashboardInfo.navigation.redirectPath,
      );
      router.push(dashboardInfo.navigation.redirectPath);
      return;
    }

    // 🔥 修正: アクセス権チェックによるリダイレクト（法人メンバーページを除外）
    if (!accessCheck.hasAccess && accessCheck.redirectTo && accessCheck.redirectTo !== pathname) {
      // 法人メンバーページでのリダイレクトをより慎重に処理
      if (pathname.startsWith('/dashboard/corporate-member')) {
        console.log('🔧 法人メンバーページでのアクセス権チェック詳細:', {
          pathname,
          userType: dashboardInfo.permissions.userType,
          hasCorpAccess: dashboardInfo.permissions.hasCorpAccess,
          isAdmin: dashboardInfo.permissions.isAdmin,
          accessCheck,
        });

        // 本当にアクセス権がない場合のみリダイレクト
        if (!dashboardInfo.permissions.hasCorpAccess && !dashboardInfo.permissions.isSuperAdmin) {
          console.log('🚀 法人メンバーページでのアクセス権リダイレクト:', {
            from: pathname,
            to: accessCheck.redirectTo,
            reason: '法人アクセス権なし',
          });
          router.push(accessCheck.redirectTo);
          return;
        } else {
          console.log('🔧 法人メンバーページアクセス許可（リダイレクトなし）');
          return;
        }
      } else {
        console.log('🚀 一般的なアクセス権によるリダイレクト:', {
          from: pathname,
          to: accessCheck.redirectTo,
          reason: 'アクセス権なし',
        });
        router.push(accessCheck.redirectTo);
        return;
      }
    }

    // 🔥 追加: 法人メンバーページへのアクセス許可をログ出力
    if (pathname.startsWith('/dashboard/corporate-member')) {
      console.log('🔧 法人メンバーページアクセス許可確定:', {
        pathname,
        userType: dashboardInfo.permissions.userType,
        hasCorpAccess: dashboardInfo.permissions.hasCorpAccess,
        isAdmin: dashboardInfo.permissions.isAdmin,
      });
    }
  }, [session, status, dashboardInfo, pathname, accessCheck, router]);

  // 🚀 早期リターン
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

  console.log('🚀 レンダリング完了:', {
    userType: dashboardInfo.permissions.userType,
    menuCount: menuItems.length,
    hasAccess: accessCheck.hasAccess,
    themeClass,
    pathname,
  });

  // 🚀 テーマクラスを動的に適用
  return (
    <div className={themeClass}>
      <DashboardLayout items={menuItems}>{children}</DashboardLayout>
    </div>
  );
}