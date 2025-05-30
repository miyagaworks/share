// app/dashboard/corporate-member/layout.tsx (完全版)
'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { HiUser, HiLink, HiColorSwatch, HiShare, HiOfficeBuilding, HiMenu } from 'react-icons/hi';
import { Spinner } from '@/components/ui/Spinner';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface CorporateMemberLayoutProps {
  children: ReactNode;
}

interface AccessData {
  hasAccess: boolean;
  isAdmin: boolean;
  userRole: string | null;
  tenantId: string | null;
  error: string | null;
}

interface TenantData {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
}

export default function CorporateMemberLayout({ children }: CorporateMemberLayoutProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const [accessData, setAccessData] = useState<AccessData | null>(null);
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // シンプルな初期化処理
  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    const initializeAccess = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 1. アクセス権限をチェック
        const accessResponse = await fetch('/api/corporate/access');
        if (!accessResponse.ok) {
          throw new Error('アクセス権限の確認に失敗しました');
        }

        const accessResult = await accessResponse.json();

        // 2. アクセス権限の検証（シンプル化）
        if (!accessResult.hasAccess) {
          console.log('❌ 法人メンバーアクセス権限なし:', accessResult);

          // 🔥 修正: 個人プランユーザーを個人ダッシュボードにリダイレクト
          if (!accessResult.userRole || accessResult.userRole === null) {
            console.log('🚀 個人プランユーザー → 個人ダッシュボード');
            router.push('/dashboard');
            return;
          }

          // 不完全な招待メンバーの場合
          if (accessResult.userRole === 'incomplete-member') {
            setError('招待の設定が完了していません。管理者にお問い合わせください。');
          } else {
            setError('法人メンバーとしてのアクセス権限がありません。');
          }
          setIsLoading(false);
          return;
        }

        setAccessData(accessResult);

        // 3. テナント情報を取得
        try {
          const tenantResponse = await fetch('/api/corporate-profile');
          if (tenantResponse.ok) {
            const tenantResult = await tenantResponse.json();
            setTenantData(tenantResult.tenant);
          } else {
            console.warn('テナント情報の取得に失敗、デフォルト値を使用');
            setTenantData({
              id: accessResult.tenantId || 'default',
              name: '法人テナント',
              logoUrl: null,
              primaryColor: '#1E3A8A',
              secondaryColor: '#122153',
            });
          }
        } catch (tenantError) {
          console.warn('テナント情報取得エラー:', tenantError);
          setTenantData({
            id: accessResult.tenantId || 'default',
            name: '法人テナント',
            logoUrl: null,
            primaryColor: '#1E3A8A',
            secondaryColor: '#122153',
          });
        }
      } catch (error) {
        console.error('❌ 初期化エラー:', error);
        setError('システムエラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAccess();
  }, [session, status, router]);

  // CSSテーマの設定
  useEffect(() => {
    document.documentElement.classList.add('corporate-theme');
    return () => {
      document.documentElement.classList.remove('corporate-theme');
    };
  }, []);

  // ナビゲーション項目の定義（シンプル化）
  const navItems = [
    {
      label: '概要',
      href: '/dashboard/corporate-member',
      icon: <HiUser className="w-5 h-5" />,
      adminOnly: false,
    },
    {
      label: 'プロフィール編集',
      href: '/dashboard/corporate-member/profile',
      icon: <HiUser className="w-5 h-5" />,
      adminOnly: false,
    },
    {
      label: 'SNS・リンク管理',
      href: '/dashboard/corporate-member/links',
      icon: <HiLink className="w-5 h-5" />,
      adminOnly: false,
    },
    {
      label: 'デザイン設定',
      href: '/dashboard/corporate-member/design',
      icon: <HiColorSwatch className="w-5 h-5" />,
      adminOnly: false,
    },
    {
      label: '共有設定',
      href: '/dashboard/corporate-member/share',
      icon: <HiShare className="w-5 h-5" />,
      adminOnly: false,
    },
    {
      label: '法人ダッシュボード',
      href: '/dashboard/corporate',
      icon: <HiOfficeBuilding className="w-5 h-5" />,
      adminOnly: true,
    },
  ];

  // フィルタリング（管理者のみのアイテムを制御）
  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || accessData?.isAdmin === true,
  );

  // 現在のページタイトルを取得
  const getCurrentPageTitle = () => {
    const currentItem = filteredNavItems.find((item) => item.href === pathname);
    return currentItem ? currentItem.label : '法人メンバープロフィール';
  };

  // ローディング表示
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">データを読み込んでいます...</p>
        </div>
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <HiOfficeBuilding className="h-8 w-8 text-gray-700 mr-3" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">法人メンバープロフィール</h1>
            <p className="text-gray-600">あなたの法人メンバープロフィールの概要</p>
          </div>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-700 mb-2">アクセス権限がありません</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="flex space-x-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              個人ダッシュボードへ
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              再読み込み
            </button>
          </div>
        </div>
      </div>
    );
  }

  // プライマリカラーの設定
  const primaryColor = tenantData?.primaryColor || '#1E3A8A';

  return (
    <div
      className="corporate-theme"
      style={
        {
          '--color-corporate-primary': primaryColor,
          '--color-corporate-secondary': tenantData?.secondaryColor || '#122153',
        } as React.CSSProperties
      }
    >
      {/* モバイル用ヘッダー */}
      <div className="flex justify-between items-center mb-6 md:hidden">
        <h1 className="text-lg font-medium">{getCurrentPageTitle()}</h1>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-md text-[#1E3A8A]"
          aria-label={mobileMenuOpen ? 'メニューを閉じる' : 'メニューを開く'}
        >
          <HiMenu className="h-6 w-6" />
        </button>
      </div>

      {/* モバイルメニュー */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-base font-medium text-[#1E3A8A]">メニュー</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-md text-[#1E3A8A]"
              >
                <HiMenu className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4 px-2">
              <nav className="flex flex-col space-y-1">
                {filteredNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button
                      variant={pathname === item.href ? 'corporate' : 'ghost'}
                      className="w-full justify-start text-left py-3"
                    >
                      <span className="flex items-center">
                        {React.cloneElement(item.icon, { className: 'w-5 h-5 mr-3' })}
                        {item.label}
                      </span>
                    </Button>
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* デスクトップ用タブナビゲーション */}
      <div className="hidden md:block mb-6 overflow-x-auto">
        <div className="flex space-x-2 min-w-max pb-2">
          {filteredNavItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={pathname === item.href ? 'corporate' : 'ghost'}
                className="flex items-center whitespace-nowrap"
              >
                {item.icon}
                <span className="ml-2">{item.label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="px-1">{children}</div>
    </div>
  );
}