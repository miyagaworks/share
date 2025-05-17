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
  HiBell,
  HiOutlineMail,
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
    title: '永久利用権管理',
    href: '/dashboard/admin/permissions',
    icon: <HiKey className="h-5 w-5" />,
  },
  {
    title: 'お知らせ管理',
    href: '/dashboard/admin/notifications',
    icon: <HiBell className="h-5 w-5" />,
  },
  {
    title: 'メール配信管理',
    href: '/dashboard/admin/email',
    icon: <HiOutlineMail className="h-5 w-5" />,
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
  const [isPermanentUser, setIsPermanentUser] = useState(false);

  // 法人アカウントかどうかをチェック
  useEffect(() => {
    const checkCorporateStatus = async () => {
      if (status === 'loading') return;
      if (!session) {
        router.push('/auth/signin');
        return;
      }

      try {
        // ユーザー情報を取得して永久利用権をチェック
        const profileResponse = await fetch('/api/profile');
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (profileData.user) {
            // 永久利用権ユーザー判定
            const isPermanent = profileData.user.subscriptionStatus === 'permanent';
            setIsPermanentUser(isPermanent);

            // 永久利用権ユーザーは法人アクセス権を持つが、管理者権限は持たない
            if (isPermanent) {
              updateCorporateAccessState({
                hasAccess: true,
                isAdmin: true,
                isSuperAdmin: false,
                tenantId: `virtual-tenant-${profileData.user.id}`,
                userRole: 'admin',
                lastChecked: Date.now(),
              });
            }
          }
        }

        // 管理者権限チェック（永久利用権ユーザーでない場合のみ）
        if (!isPermanentUser) {
          const adminResponse = await fetch('/api/admin/access');
          if (adminResponse.ok) {
            const adminData = await adminResponse.json();
            if (adminData.isSuperAdmin) {
              updateCorporateAccessState({
                isSuperAdmin: true,
              });
            }
          }
        }

        // 永久利用権がない場合のみ法人アクセス権をチェック
        if (!isPermanentUser) {
          await checkCorporateAccess();
        }
      } catch (error) {
        console.error('アクセスチェックエラー:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkCorporateStatus();
  }, [session, status, router, isPermanentUser]);

  // ローディング表示
  if (status !== 'loading' && session && isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // サイドバー項目の決定 - シンプルに
  let sidebarItems: SidebarItem[] = [];

  // 1. 永久利用権ユーザーは特別処理
  if (isPermanentUser) {
    // 永久利用権ユーザーは基本メニュー + 法人機能のみ
    sidebarItems = [...personalSidebarItems];

    // 法人機能を追加
    sidebarItems.push({
      title: '法人機能',
      href: '#corporate-divider',
      icon: <></>,
      isDivider: true,
    });

    sidebarItems.push({
      title: '法人メンバープロフィール',
      href: '/dashboard/corporate-member',
      icon: <HiUser className="h-5 w-5" />,
    });

    sidebarItems.push({
      title: '法人管理ダッシュボード',
      href: '/dashboard/corporate',
      icon: <HiOfficeBuilding className="h-5 w-5" />,
    });

    // 注意: 永久利用権ユーザーには管理者メニューを追加しない
  }
  // 2. 管理者ページの場合
  else if (pathname?.startsWith('/dashboard/admin') && corporateAccessState.isSuperAdmin) {
    sidebarItems = [...adminSidebarItems];
  }
  // 3. 法人プロファイルページの場合
  else if (pathname?.startsWith('/dashboard/corporate-profile') && corporateAccessState.hasAccess) {
    sidebarItems = [...corporateProfileSidebarItems];

    // 管理者の場合は管理者メニューも追加
    if (corporateAccessState.isSuperAdmin) {
      sidebarItems.push({
        title: '管理者機能',
        href: '#admin-divider',
        icon: <></>,
        isDivider: true,
      });

      adminSidebarItems.forEach((item) => sidebarItems.push(item));
    }
  }
  // 4. 法人ページの場合
  else if (pathname?.startsWith('/dashboard/corporate') && corporateAccessState.hasAccess) {
    sidebarItems = [...corporateSidebarItems];

    // 管理者の場合は管理者メニューも追加
    if (corporateAccessState.isSuperAdmin) {
      sidebarItems.push({
        title: '管理者機能',
        href: '#admin-divider',
        icon: <></>,
        isDivider: true,
      });

      adminSidebarItems.forEach((item) => sidebarItems.push(item));
    }
  }
  // 5. 通常の個人ダッシュボード
  else {
    sidebarItems = [...personalSidebarItems];

    // 法人アクセス権がある場合は法人メニューを追加
    if (corporateAccessState.hasAccess) {
      sidebarItems.push({
        title: '法人機能',
        href: '#corporate-divider',
        icon: <></>,
        isDivider: true,
      });

      sidebarItems.push({
        title: '法人メンバープロフィール',
        href: '/dashboard/corporate-member',
        icon: <HiUser className="h-5 w-5" />,
      });

      if (corporateAccessState.isAdmin) {
        sidebarItems.push({
          title: '法人管理ダッシュボード',
          href: '/dashboard/corporate',
          icon: <HiOfficeBuilding className="h-5 w-5" />,
        });
      }
    }

    // 管理者の場合は管理者メニューも追加
    if (corporateAccessState.isSuperAdmin) {
      sidebarItems.push({
        title: '管理者機能',
        href: '#admin-divider',
        icon: <></>,
        isDivider: true,
      });

      adminSidebarItems.forEach((item) => sidebarItems.push(item));
    }
  }

  return <DashboardLayout items={sidebarItems}>{children}</DashboardLayout>;
}