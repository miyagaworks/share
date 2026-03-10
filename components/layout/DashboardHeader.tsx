// components/layout/DashboardHeader.tsx (プロフィール編集リンク追加版)
'use client';
import React, { useState, useRef, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useDashboardInfo } from '@/hooks/useDashboardInfo';
import NotificationBell from './NotificationBell';
import { DEFAULT_BRAND_NAME } from '@/lib/brand/defaults';

export function DashboardHeader() {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  // 🚀 統合APIからユーザー情報を取得
  const { data: dashboardInfo } = useDashboardInfo();

  // 🚀 統合されたプロフィール情報（APIを優先、フォールバックはセッション）
  const profileData = {
    name: dashboardInfo?.user.name || session?.user?.name || 'ユーザー',
    image: dashboardInfo?.user.image || session?.user?.image || null,
  };

  // 🚀 管理者権限判定（厳密な判定）
  const isAdmin =
    dashboardInfo?.permissions?.isSuperAdmin === true ||
    dashboardInfo?.permissions?.isFinancialAdmin === true;

  // 🚀 法人プランユーザーかどうかを判定
  const isCorporateUser =
    dashboardInfo?.permissions.userType === 'corporate' ||
    dashboardInfo?.permissions.userType === 'invited-member' ||
    dashboardInfo?.permissions.hasCorpAccess === true ||
    dashboardInfo?.permissions.planType === 'corporate';

  // 🚀 プラン別のアイコン色を設定
  const getIconColors = () => {
    if (isCorporateUser) {
      // 法人プランユーザー: #1E3A8A系
      return {
        normal: 'bg-[#1E3A8A]',
        hover: 'hover:bg-[#122153]',
      };
    } else {
      // 個人プランユーザー: 青系
      return {
        normal: 'bg-blue-600',
        hover: 'hover:bg-blue-800',
      };
    }
  };

  const iconColors = getIconColors();

  // クリックイベントハンドラを設定して、メニュー外のクリックを検知
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // セッションがない場合はログインページにリダイレクト
  if (!session) {
    return null;
  }

  // ログアウト処理
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  // アカウント削除処理
  const handleDeleteAccount = () => {
    setIsMenuOpen(false);
    router.push('/dashboard/account/delete');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200">
      <div className="mx-auto flex h-16 items-center justify-between px-2 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <Link href="/dashboard" className="flex items-center px-2">
            <Image src="/logo.svg" alt={`${DEFAULT_BRAND_NAME} Logo`} width={145} height={42} priority />
          </Link>
        </div>
        <div className="flex items-center space-x-4 mt-1">
          <NotificationBell />
          {/* 🚀 統合されたユーザーアイコン（プラン別色対応） */}
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center space-x-2 rounded-full focus:outline-none mb-1"
            >
              {profileData.image ? (
                <div className="overflow-hidden rounded-full border-2 border-transparent hover:border-blue-500 transition-colors">
                  <Image
                    src={profileData.image}
                    alt={profileData.name}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${iconColors.normal} ${iconColors.hover} text-white transition-colors`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              )}
              <span className="hidden md:inline-block text-sm font-medium">{profileData.name}</span>
            </button>
            {/* ドロップダウンメニュー */}
            {isMenuOpen && (
              <div
                ref={menuRef}
                className="absolute right-0 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 z-50"
              >
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{profileData.name}</p>
                  {/* 🆕 管理者バッジを追加 */}
                  {isAdmin && (
                    <p className="text-xs text-blue-600 font-medium">
                      {dashboardInfo?.permissions.isSuperAdmin ? 'スーパー管理者' : '財務管理者'}
                    </p>
                  )}
                </div>

                {/* 🆕 管理者用プロフィール編集リンクを追加 */}
                {isAdmin && (
                  <Link
                    href="/dashboard/admin/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    プロフィール編集
                  </Link>
                )}

                <Link
                  href="/auth/change-password"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  パスワード変更
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 border-t border-gray-100 mt-1"
                >
                  ログアウト
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  アカウント削除
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}