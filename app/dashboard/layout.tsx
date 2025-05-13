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
  HiShieldCheck,
  HiKey,
} from 'react-icons/hi';
import {
  corporateAccessState,
  checkCorporateAccess,
  updateCorporateAccessState,
} from '@/lib/corporateAccessState';

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  isDivider?: boolean; // オプションのプロパティを追加
}

interface DashboardLayoutWrapperProps {
  children: ReactNode;
}

// 個人用サイドバー項目
const personalSidebarItems: SidebarItem[] = [
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
    href: '/dashboard/corporate/onboarding',
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
const adminSidebarItems: SidebarItem[] = [
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
    title: 'サブスクリプション管理',
    href: '/dashboard/admin/subscriptions',
    icon: <HiCreditCard className="h-5 w-5" />,
  },
  {
    title: '権限管理',
    href: '/dashboard/admin/permissions',
    icon: <HiKey className="h-5 w-5" />,
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

  // 法人アカウントかどうかをチェック
  useEffect(() => {
    const checkCorporateStatus = async () => {
      if (status === 'loading') return;

      if (!session) {
        router.push('/auth/signin');
        return;
      }

      try {
        // 追加: 管理者権限のチェック
        const adminResponse = await fetch('/api/admin/access');
        if (adminResponse.ok) {
          const adminData = await adminResponse.json();
          if (adminData.isSuperAdmin) {
            // 管理者である場合、状態を更新
            updateCorporateAccessState({
              isSuperAdmin: true,
            });
            // 強制再レンダリング
            forceUpdate((prev) => prev + 1);
          }
        }

        // ユーザー情報を取得して永久利用権をチェック
        const profileResponse = await fetch('/api/profile');
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (profileData.user) {
            // セッションストレージに保存
            sessionStorage.setItem('userData', JSON.stringify(profileData.user));

            // 永久利用権ユーザーは法人アクセス権を持つ
            if (profileData.user.subscriptionStatus === 'permanent') {
              updateCorporateAccessState({
                hasAccess: true,
                isAdmin: true, // 法人の管理者権限はtrue
                // isSuperAdmin は変更しない（管理者チェックの結果を尊重）
                tenantId: `virtual-tenant-${profileData.user.id}`,
                userRole: 'admin',
                error: null,
                lastChecked: Date.now(),
              });
              // 強制再レンダリング
              forceUpdate((prev) => prev + 1);
            }
          }
        }

        // 永久利用権がない場合のみ法人アクセス権をチェック
        await checkCorporateAccess();
      } catch (error) {
        console.error('法人アクセスチェックエラー:', error);
      } finally {
        setIsLoading(false);
        // 状態が更新されたら再レンダリング
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
  }, [session, status, router]);

  // ユーザーが認証されているが、まだ法人アカウント状態をチェック中
  if (status !== 'loading' && session && isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // サイドバー項目の決定
  let sidebarItems: SidebarItem[] = [];

  // 管理者かどうかを判定（isSuperAdminのみを使用）
  const isAdmin = corporateAccessState.isSuperAdmin === true;

  // 永久利用権ユーザーかどうかをチェック
  const isPermanentUser = (() => {
    try {
      const userDataStr = sessionStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        return userData.subscriptionStatus === 'permanent';
      }
    } catch (e) {
      console.error('永久利用権チェックエラー:', e);
    }
    return false;
  })();

  // 1. 現在の場所に基づいてベースとなるメニューを決定
  if (pathname && pathname.startsWith('/dashboard/admin') && isAdmin) {
    // 管理者ページの場合は管理者メニューのみを表示
    sidebarItems = [...adminSidebarItems];
  } else if (
    pathname &&
    pathname.startsWith('/dashboard/corporate-profile') &&
    (corporateAccessState.hasAccess || isPermanentUser)
  ) {
    sidebarItems = [...corporateProfileSidebarItems];

    // 管理者の場合は管理者メニューも追加
    if (isAdmin) {
      sidebarItems = [
        ...sidebarItems,
        // 区切り線
        {
          title: '管理者機能',
          href: '#',
          icon: <></>,
          isDivider: true,
        },
        ...adminSidebarItems,
      ];
    }
  } else if (
    pathname &&
    pathname.startsWith('/dashboard/corporate') &&
    (corporateAccessState.hasAccess || isPermanentUser)
  ) {
    sidebarItems = [...corporateSidebarItems];

    // 管理者の場合は管理者メニューも追加
    if (isAdmin) {
      sidebarItems = [
        ...sidebarItems,
        // 区切り線
        {
          title: '管理者機能',
          href: '#',
          icon: <></>,
          isDivider: true,
        },
        ...adminSidebarItems,
      ];
    }
  } else {
    // 個人ダッシュボードのベースメニュー
    sidebarItems = [...personalSidebarItems];

    // 2. 法人メニューを追加（重複を防ぐため配列を作成）
    const corporateItems: SidebarItem[] = [];

    // 法人ユーザーまたは永久利用権ユーザーの場合
    if (corporateAccessState.hasAccess || isPermanentUser) {
      // 区切り線を追加
      corporateItems.push({
        title: '法人機能',
        href: '#',
        icon: <></>,
        isDivider: true,
      });

      // 法人メンバープロフィールを1回だけ追加
      corporateItems.push({
        title: '法人メンバープロフィール',
        href: '/dashboard/corporate-member',
        icon: <HiUser className="h-5 w-5" />,
      });

      // 法人管理者または永久利用権ユーザーの場合は法人管理ダッシュボードも追加
      if (corporateAccessState.isAdmin || isPermanentUser) {
        corporateItems.push({
          title: '法人管理ダッシュボード',
          href: '/dashboard/corporate',
          icon: <HiOfficeBuilding className="h-5 w-5" />,
        });
      }

      // 法人メニューを追加
      sidebarItems = [...sidebarItems, ...corporateItems];
    }

    // 3. 管理者メニューを最後に追加（管理者の場合のみ）
    if (isAdmin) {
      // 管理者機能区切り線を追加
      sidebarItems.push({
        title: '管理者機能',
        href: '#admin-divider', // keyとして使用するための一意のURL
        icon: <></>,
        isDivider: true,
      });

      // 管理者メニュー項目をすべて追加
      adminSidebarItems.forEach((item) => {
        sidebarItems.push(item);
      });
    }
  }

  return <DashboardLayout items={sidebarItems}>{children}</DashboardLayout>;
}