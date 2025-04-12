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

interface DashboardLayoutWrapperProps {
  children: ReactNode;
}

export default function DashboardLayoutWrapper({ children }: DashboardLayoutWrapperProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isCorporateAccount, setIsCorporateAccount] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 法人アカウントかどうかをチェック
  useEffect(() => {
    const checkCorporateStatus = async () => {
      if (status === 'loading') return;

      if (!session) {
        router.push('/auth/signin');
        return;
      }

      try {
        // テナント情報が存在するかチェック
        const response = await fetch('/api/corporate/tenant');

        if (response.ok) {
          // テナント情報が取得できた場合は法人アカウント
          setIsCorporateAccount(true);
        } else {
          // エラーの場合は法人アカウントではない
          setIsCorporateAccount(false);
          console.log('法人テナント情報が見つかりません - 個人アカウントとして扱います');
        }
      } catch (error) {
        console.error('法人アカウントチェックエラー:', error);
        setIsCorporateAccount(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkCorporateStatus();
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

  // 法人アカウントかつ法人ダッシュボード内にいる場合
  if (isCorporateAccount && pathname && pathname.startsWith('/dashboard/corporate')) {
    sidebarItems = [...corporateSidebarItems]; // 法人サイドバー項目をそのまま使用
  }
  // 法人アカウントだが個人ダッシュボード内にいる場合
  else if (isCorporateAccount) {
    // 個人サイドバー項目を使用し、法人ダッシュボードへのリンクはSidebar.tsxで自動的に追加される
    sidebarItems = [...personalSidebarItems];
  }

  return <DashboardLayout items={sidebarItems}>{children}</DashboardLayout>;
}