// app/dashboard/corporate-member/layout.tsx (修正版)
'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { HiUser, HiLink, HiColorSwatch, HiShare, HiOfficeBuilding, HiMenu } from 'react-icons/hi';
import { Spinner } from '@/components/ui/Spinner';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { corporateAccessState, checkCorporateAccess } from '@/lib/corporateAccess';

interface CorporateMemberLayoutProps {
  children: ReactNode;
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
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // モバイルメニューの表示状態
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // APIからテナント情報を取得
  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    const fetchTenantData = async () => {
      try {
        // 法人アクセス権を確認
        await checkCorporateAccess({ force: true });

        // 🔥 修正: アクセス権チェックをより柔軟に
        if (!corporateAccessState.hasAccess && !corporateAccessState.isAdmin) {
          console.log('法人アクセス権がありません');

          // 🔥 修正: 招待メンバーの場合は個人ダッシュボードではなく適切なページにリダイレクト
          const userRole = corporateAccessState.userRole;
          if (userRole === 'member') {
            // 招待メンバーの場合は、エラーを表示するがリダイレクトしない
            setError('法人メンバー機能へのアクセス権の確認中です。しばらくお待ちください。');
            return;
          } else {
            // その他のユーザーは個人ダッシュボードにリダイレクト
            router.push('/dashboard');
            return;
          }
        }

        // 法人テナント情報取得処理...
        const response = await fetch('/api/corporate-profile');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: '不明なエラー' }));
          console.error('法人プロフィールAPI エラー:', response.status, errorData);
          throw new Error(errorData.error || '法人テナント情報の取得に失敗しました');
        }

        const data = await response.json();
        console.log('法人プロフィールデータ取得成功:', {
          hasUser: !!data.user,
          hasTenant: !!data.tenant,
          tenantId: data.tenant?.id,
        });

        if (data.tenant) {
          setTenantData(data.tenant);
          setError(null);
        } else {
          throw new Error('テナント情報が含まれていません');
        }
      } catch (error) {
        console.error('法人テナント情報取得エラー:', error);
        setError('法人テナント情報の取得に失敗しました');

        // 🔥 修正: 招待メンバーの場合はリダイレクトしない
        const userRole = corporateAccessState.userRole;
        if (userRole !== 'member') {
          // 招待メンバー以外の場合のみリダイレクト
          router.push('/dashboard');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenantData();
  }, [session, status, router, pathname]);

  useEffect(() => {
    // ルート要素にクラスを追加（グローバルCSSでスタイルを定義するため）
    document.documentElement.classList.add('corporate-theme');

    return () => {
      // クリーンアップ時にクラスを削除
      document.documentElement.classList.remove('corporate-theme');
    };
  }, []);

  // 🔥 修正: ナビゲーション項目の定義を改善
  const navItems = [
    {
      label: '概要',
      href: '/dashboard/corporate-member',
      icon: <HiUser className="w-5 h-5 text-corporate-primary" />,
      adminOnly: false, // すべてのユーザーがアクセス可能
    },
    {
      label: 'プロフィール編集',
      href: '/dashboard/corporate-member/profile',
      icon: <HiUser className="w-5 h-5 text-corporate-primary" />,
      adminOnly: false, // すべてのユーザーがアクセス可能
    },
    {
      label: 'SNS・リンク管理',
      href: '/dashboard/corporate-member/links',
      icon: <HiLink className="w-5 h-5 text-corporate-primary" />,
      adminOnly: false, // すべてのユーザーがアクセス可能
    },
    {
      label: 'デザイン設定',
      href: '/dashboard/corporate-member/design',
      icon: <HiColorSwatch className="w-5 h-5 text-corporate-primary" />,
      adminOnly: false, // すべてのユーザーがアクセス可能
    },
    {
      label: '共有設定',
      href: '/dashboard/corporate-member/share',
      icon: <HiShare className="w-5 h-5 text-corporate-primary" />,
      adminOnly: false, // すべてのユーザーがアクセス可能
    },
    // 🔥 修正: 法人ダッシュボードへのリンクを管理者のみに制限
    {
      label: '法人ダッシュボード',
      href: '/dashboard/corporate',
      icon: <HiOfficeBuilding className="w-5 h-5 text-corporate-primary" />,
      adminOnly: true, // 管理者のみアクセス可能
    },
  ];

  console.log('🔧 Corporate Member Layout - 状態確認:', {
    corporateAccessState: {
      hasAccess: corporateAccessState.hasAccess,
      isAdmin: corporateAccessState.isAdmin,
      userRole: corporateAccessState.userRole,
    },
    pathname,
  });

  // 🔥 修正: フィルタリングロジックの改善
  const filteredNavItems = navItems.filter((item) => {
    // adminOnlyフラグがない項目はすべて表示
    if (!item.adminOnly) return true;

    // adminOnlyがある項目は、管理者権限をチェック
    const isUserAdmin = corporateAccessState.isAdmin || corporateAccessState.userRole === 'admin';

    console.log('🔧 管理者権限チェック:', {
      itemLabel: item.label,
      adminOnly: item.adminOnly,
      isUserAdmin,
      corporateAccessStateIsAdmin: corporateAccessState.isAdmin,
      userRole: corporateAccessState.userRole,
    });

    return item.adminOnly && isUserAdmin;
  });

  console.log('🔧 フィルタリング結果:', {
    originalCount: navItems.length,
    filteredCount: filteredNavItems.length,
    filteredItems: filteredNavItems.map((item) => ({
      label: item.label,
      adminOnly: item.adminOnly,
    })),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-700 mb-2">エラーが発生しました</h2>
        <p className="text-red-600">{error}</p>
        <div className="mt-4 flex space-x-2">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            再読み込み
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            ダッシュボードへ戻る
          </button>
        </div>
      </div>
    );
  }

  // プライマリカラーの設定
  const primaryColor = tenantData?.primaryColor || 'var(--color-corporate-primary)';

  // 現在のページのタイトルを取得
  const getCurrentPageTitle = () => {
    const currentItem = filteredNavItems.find((item) => item.href === pathname);
    return currentItem ? currentItem.label : '法人メンバープロフィール';
  };

  return (
    <div>
      {/* CSSの変数をドキュメントのルートに設定してテーマを切り替える */}
      <div
        className="corporate-theme"
        style={
          {
            '--color-corporate-primary': primaryColor,
            '--color-corporate-secondary':
              tenantData?.secondaryColor || 'var(--color-corporate-secondary)',
          } as React.CSSProperties
        }
      >
        {/* モバイル用ヘッダー - 現在のページ名とメニューボタン */}
        <div className="flex justify-between items-center mb-6 md:hidden">
          <h1 className="text-lg font-medium">{getCurrentPageTitle()}</h1>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-[#1E3A8A]" // 紺色のコーポレートカラーに固定
            aria-label={mobileMenuOpen ? 'メニューを閉じる' : 'メニューを開く'}
          >
            <HiMenu className="h-6 w-6" />
          </button>
        </div>

        {/* モバイルメニュードロップダウン - 修正部分 */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* オーバーレイ */}
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-75"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* メニューパネル */}
            <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-xl flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-[#1E3A8A]/20">
                <h2 className="text-base font-medium text-[#1E3A8A]">メニュー</h2>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-md text-[#1E3A8A]"
                  aria-label="メニューを閉じる"
                >
                  <HiMenu className="h-6 w-6" />
                </button>
              </div>

              {/* メニュー項目 */}
              <div className="flex-1 overflow-y-auto py-4 px-2">
                <nav className="flex flex-col space-y-1">
                  {filteredNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block" // ブロック要素に
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

        {/* 🔥 修正: デスクトップ用タブナビゲーション - モバイルでは非表示 */}
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
    </div>
  );
}