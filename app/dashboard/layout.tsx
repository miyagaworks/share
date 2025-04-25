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
} from 'react-icons/hi';
import { corporateAccessState, checkCorporateAccess } from '@/lib/corporateAccessState';

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
        // 法人アクセス権をチェック
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
  let sidebarItems = [...personalSidebarItems];

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
  // 個人ダッシュボードにいる場合で法人ユーザーの場合は「法人ダッシュボード」を通常メニューには含めない
  // 区切り線と共に別途表示するため、ここでは追加しない

  return <DashboardLayout items={sidebarItems}>{children}</DashboardLayout>;
}