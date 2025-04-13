// app/dashboard/corporate-profile/layout.tsx
'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { HiUser, HiLink, HiColorSwatch, HiShare, HiOfficeBuilding } from 'react-icons/hi';
import { Spinner } from '@/components/ui/Spinner';

interface CorporateProfileLayoutProps {
  children: ReactNode;
}

interface TenantData {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
}

export default function CorporateProfileLayout({ children }: CorporateProfileLayoutProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // APIからテナント情報を取得
  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    const fetchTenantData = async () => {
      try {
        // 通常のダッシュボードにいるが法人ユーザーの場合、法人プロファイルにリダイレクト
        if (pathname === '/dashboard' && !pathname.startsWith('/dashboard/corporate-profile')) {
          const checkResponse = await fetch('/api/corporate/tenant');
          if (checkResponse.ok) {
            // 法人テナントが存在する場合は法人プロファイルへリダイレクト
            router.push('/dashboard/corporate-profile');
            return;
          }
        }

        const response = await fetch('/api/corporate-profile');
        if (!response.ok) {
          throw new Error('法人テナント情報の取得に失敗しました');
        }

        const data = await response.json();
        setTenantData(data.tenant);
      } catch (error) {
        console.error('法人テナント情報取得エラー:', error);
        router.push('/dashboard'); // 通常ダッシュボードへリダイレクト
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenantData();
  }, [session, status, router, pathname]);

  // ナビゲーション項目の定義
  const navItems = [
    {
      label: '概要',
      href: '/dashboard/corporate-profile',
      icon: <HiUser className="w-5 h-5" />,
    },
    {
      label: 'プロフィール編集',
      href: '/dashboard/corporate-profile/profile',
      icon: <HiUser className="w-5 h-5" />,
    },
    {
      label: 'SNS・リンク管理',
      href: '/dashboard/corporate-profile/links',
      icon: <HiLink className="w-5 h-5" />,
    },
    {
      label: 'デザイン設定',
      href: '/dashboard/corporate-profile/design',
      icon: <HiColorSwatch className="w-5 h-5" />,
    },
    {
      label: '共有設定',
      href: '/dashboard/corporate-profile/share',
      icon: <HiShare className="w-5 h-5" />,
    },
    {
      label: '法人ダッシュボード',
      href: '/dashboard/corporate',
      icon: <HiOfficeBuilding className="w-5 h-5" />,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  // プライマリカラーの設定
  const primaryColor = tenantData?.primaryColor || '#3B82F6';

  return (
    <div>
      {/* タブナビゲーション */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex space-x-2 min-w-max pb-2">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors 
                ${pathname === item.href ? `text-white` : 'text-gray-600 hover:bg-gray-100'}`}
              style={{
                backgroundColor: pathname === item.href ? primaryColor : '',
                color: pathname === item.href ? 'white' : 'inherit',
              }}
            >
              {item.icon}
              <span className="ml-2">{item.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="px-1">{children}</div>
    </div>
  );
}