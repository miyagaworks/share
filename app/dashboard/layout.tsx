// app/dashboard/layout.tsx
'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Spinner } from '@/components/ui/Spinner';
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
  HiShieldCheck, // 管理者アイコン追加
  HiKey, // 権限管理アイコン追加
} from 'react-icons/hi';
import {
  corporateAccessState,
  checkCorporateAccess,
  isUserSuperAdmin,
} from '@/lib/corporateAccessState';

// 個人用サイドバー項目
const personalSidebarItems = [
  {
    title: 'ダッシュボード',
    href: '/dashboard',
    icon: <HiHome className="h-5 w-5" />,
  },
  {
    title: 'プロフィール編集',
    href: '/dashboard/profile',
    icon: <HiUser className="h-5 w-5" />,
  },
  {
    title: 'SNS・リンク管理',
    href: '/dashboard/links',
    icon: <HiLink className="h-5 w-5" />,
  },
  {
    title: 'デザイン設定',
    href: '/dashboard/design',
    icon: <HiColorSwatch className="h-5 w-5" />,
  },
  {
    title: '共有設定',
    href: '/dashboard/share',
    icon: <HiShare className="h-5 w-5" />,
  },
  {
    title: 'ご利用プラン',
    href: '/dashboard/subscription',
    icon: <HiCreditCard className="h-5 w-5" />,
  },
];

// 法人プラン用サイドバー項目
const corporateSidebarItems = [
  {
    title: '法人ダッシュボード',
    href: '/dashboard/corporate',
    icon: <HiOfficeBuilding className="h-5 w-5" />,
  },
  {
    title: 'ユーザー管理',
    href: '/dashboard/corporate/users',
    icon: <HiUsers className="h-5 w-5" />,
  },
  {
    title: '部署管理',
    href: '/dashboard/corporate/departments',
    icon: <HiTemplate className="h-5 w-5" />,
  },
  {
    title: '共通SNS設定',
    href: '/dashboard/corporate/sns',
    icon: <HiLink className="h-5 w-5" />,
  },
  {
    title: 'ブランディング設定',
    href: '/dashboard/corporate/branding',
    icon: <HiColorSwatch className="h-5 w-5" />,
  },
  {
    title: 'アカウント設定',
    href: '/dashboard/corporate/settings',
    icon: <HiCog className="h-5 w-5" />,
  },
  {
    title: 'ご利用プラン',
    href: '/dashboard/subscription',
    icon: <HiCreditCard className="h-5 w-5" />,
  },
];

// 法人プロファイル用サイドバー項目
const corporateProfileSidebarItems = [
  {
    title: '法人プロフィール',
    href: '/dashboard/corporate-profile',
    icon: <HiUser className="h-5 w-5" />,
  },
  {
    title: 'プロフィール編集',
    href: '/dashboard/corporate-profile/profile',
    icon: <HiUser className="h-5 w-5" />,
  },
  {
    title: 'SNS・リンク管理',
    href: '/dashboard/corporate-profile/links',
    icon: <HiLink className="h-5 w-5" />,
  },
  {
    title: 'デザイン設定',
    href: '/dashboard/corporate-profile/design',
    icon: <HiColorSwatch className="h-5 w-5" />,
  },
  {
    title: '共有設定',
    href: '/dashboard/corporate-profile/share',
    icon: <HiShare className="h-5 w-5" />,
  },
  {
    title: '法人ダッシュボード',
    href: '/dashboard/corporate',
    icon: <HiOfficeBuilding className="h-5 w-5" />,
  },
  {
    title: 'ご利用プラン',
    href: '/dashboard/subscription',
    icon: <HiCreditCard className="h-5 w-5" />,
  },
];

// 管理者メニュー項目
const adminSidebarItems = [
  {
    title: '管理者ダッシュボード',
    href: '/dashboard/admin',
    icon: <HiShieldCheck className="h-5 w-5" />,
  },
  {
    title: 'ユーザー管理',
    href: '/dashboard/admin/users',
    icon: <HiUsers className="h-5 w-5" />,
  },
  {
    title: '権限管理',
    href: '/dashboard/admin/permissions',
    icon: <HiKey className="h-5 w-5" />,
  },
  {
    title: 'サブスクリプション管理',
    href: '/dashboard/admin/subscriptions',
    icon: <HiCreditCard className="h-5 w-5" />,
  },
];

interface DashboardLayoutWrapperProps {
  children: ReactNode;
}

export default function DashboardLayoutWrapper({ children }: DashboardLayoutWrapperProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [, forceUpdate] = useState(0); // 強制再レンダリング用
  const [isAdminChecked, setIsAdminChecked] = useState(false); // 管理者チェック状態

  // 法人アカウントかどうかをチェック
  useEffect(() => {
    const checkCorporateStatus = async () => {
      if (status === 'loading') return;

      if (!session) {
        router.push('/auth/signin');
        return;
      }

      try {
        // 管理者権限チェックを法人アクセスより先に実行
        if (!isAdminChecked && session.user?.email === 'admin@sns-share.com') {
          try {
            console.log('管理者権限チェック実行', { email: session.user.email });
            const response = await fetch('/api/admin/access');

            if (response.ok) {
              const data = await response.json();
              console.log('管理者API応答:', data);

              // 管理者フラグを直接設定
              corporateAccessState.isSuperAdmin = data.isSuperAdmin === true;

              // 状態更新を通知
              window.dispatchEvent(
                new CustomEvent('corporateAccessChanged', {
                  detail: { ...corporateAccessState },
                }),
              );

              // 再レンダリングを強制
              forceUpdate((prev) => prev + 1);
            }
          } catch (error) {
            console.error('管理者権限チェックエラー:', error);
          } finally {
            setIsAdminChecked(true);
          }
        }

        // 法人アクセス権をチェック (管理者チェック後)
        await checkCorporateAccess();
      } catch (error) {
        console.error('法人アクセスチェックエラー:', error);
      } finally {
        setIsLoading(false);
        forceUpdate((prev) => prev + 1);
      }
    };

    checkCorporateStatus();

    // アクセス状態変更イベントのリスナー
    const handleAccessChange = () => {
      forceUpdate((prev) => prev + 1);
    };

    window.addEventListener('corporateAccessChanged', handleAccessChange);

    return () => {
      window.removeEventListener('corporateAccessChanged', handleAccessChange);
    };
  }, [session, status, router, isAdminChecked]);

  // ユーザーが認証されているが、まだ法人アカウント状態をチェック中
  if (status !== 'loading' && session && isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // サイドバー項目の決定
  let sidebarItems = [...personalSidebarItems];

  // 管理者メニューの表示条件をチェック
  const isAdminRoute = pathname && pathname.startsWith('/dashboard/admin');
  const isSuperAdmin = isUserSuperAdmin(); // helper関数を使用

  // 法人プロファイルページにいる場合
  if (
    pathname &&
    pathname.startsWith('/dashboard/corporate-profile') &&
    corporateAccessState.hasAccess
  ) {
    sidebarItems = [...corporateProfileSidebarItems];
  }
  // 法人ダッシュボードにいる場合
  else if (
    pathname &&
    pathname.startsWith('/dashboard/corporate') &&
    corporateAccessState.hasAccess
  ) {
    sidebarItems = [...corporateSidebarItems];
  }
  // 管理者ページにいる場合
  else if (isAdminRoute && isSuperAdmin) {
    sidebarItems = [...adminSidebarItems];
  }
  // 個人ダッシュボードにいる場合
  else {
    // 管理者権限がある場合は管理者メニューを追加
    if (isSuperAdmin) {
      // 区切り線のためのダミー項目
      const dividerItem = {
        title: '管理者メニュー',
        href: '#',
        icon: <div className="w-5 h-5"></div>,
        isDivider: true,
      };

      // 個人メニュー + 区切り線 + 管理者メニュー
      sidebarItems = [...personalSidebarItems, dividerItem, ...adminSidebarItems];
    }
  }

  return <DashboardLayout items={sidebarItems}>{children}</DashboardLayout>;
}