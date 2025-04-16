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
  const [isCorporateAccount, setIsCorporateAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 法人アカウントかどうかをチェック
  useEffect(() => {
    const checkCorporateStatus = async () => {
      if (status === 'loading') return;

      if (!session) {
        router.push('/auth/signin');
        return;
      }

      // デバッグモード：常に法人アカウント扱いにする（開発環境用）
      if (process.env.NODE_ENV === 'development') {
        console.log('[Dashboard] 開発環境: 法人アカウントアクセスを許可します');
        setIsCorporateAccess(true);
        setIsLoading(false);
        return;
      }

      // 本来のAPIチェックコード...
      setIsCorporateAccess(false);
      setIsLoading(false);

      // リダイレクト処理をコメントアウト
      /*
    // 法人ページにアクセスしようとしている場合は個人ダッシュボードにリダイレクト
    if (pathname?.startsWith('/dashboard/corporate')) {
      router.push('/dashboard');
    }
    */
    };

    checkCorporateStatus();
  }, [session, status, router, pathname]);

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
  if (pathname && pathname.startsWith('/dashboard/corporate-profile') && isCorporateAccount) {
    sidebarItems = [...corporateProfileSidebarItems];
  }
  // 法人ダッシュボードにいる場合
  else if (pathname && pathname.startsWith('/dashboard/corporate') && isCorporateAccount) {
    sidebarItems = [...corporateSidebarItems];
  }
  // 個人ダッシュボードにいる場合で法人ユーザーの場合
  else if (isCorporateAccount) {
    // 法人プロファイルへのリンクを追加
    sidebarItems = [
      ...personalSidebarItems,
      {
        title: '法人プロフィール',
        href: '/dashboard/corporate-profile',
        icon: <HiUser className="h-5 w-5" />,
      },
      {
        title: '法人ダッシュボード',
        href: '/dashboard/corporate',
        icon: <HiOfficeBuilding className="h-5 w-5" />,
      },
    ];
  }

  return <DashboardLayout items={sidebarItems}>{children}</DashboardLayout>;
}