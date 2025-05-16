// components/layout/DashboardHeader.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { NotificationBell } from './NotificationBell'; // 追加

export function DashboardHeader() {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  // プロフィール情報を保持するためのstate
  const [profileData, setProfileData] = useState<{
    name: string;
    image: string | null;
  }>({
    name: session?.user?.name || 'ユーザー',
    image: session?.user?.image || null,
  });

  // APIからプロフィール情報を取得
  useEffect(() => {
    if (session?.user?.id) {
      const fetchProfileData = async () => {
        try {
          const response = await fetch('/api/profile');
          if (response.ok) {
            const data = await response.json();
            if (data.user) {
              setProfileData({
                name: data.user.name || session?.user?.name || 'ユーザー',
                image: data.user.image || null,
              });
            }
          }
        } catch (error) {
          console.error('プロフィール情報取得エラー:', error);
        }
      };

      fetchProfileData();
    }
  }, [session]);

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

    // イベントリスナーを追加
    document.addEventListener('mousedown', handleClickOutside);

    // クリーンアップ
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

  // アカウント削除処理 - 専用ページに遷移
  const handleDeleteAccount = () => {
    setIsMenuOpen(false);
    router.push('/dashboard/account/delete');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200">
      <div className="mx-auto flex h-16 items-center justify-between px-2 sm:px-6 lg:px-8">
        <div className="flex items-center">
          {/* ロゴ */}
          <Link href="/dashboard" className="flex items-center px-2">
            <Image src="/logo.svg" alt="Share Logo" width={145} height={42} priority />
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          {' '}
          {/* space-x-4を追加 */}
          {/* お知らせベル */}
          <NotificationBell />
          {/* ユーザーアイコン */}
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center space-x-2 rounded-full focus:outline-none"
            >
              {profileData.image ? (
                // 画像がある場合
                <div className="overflow-hidden rounded-full border-2 border-transparent hover:border-blue-500 transition-colors">
                  <Image
                    src={profileData.image}
                    alt={profileData.name}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full object-cover"
                    onError={(e) => {
                      console.error('プロフィール画像の読み込みエラー:', e);
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                // デフォルトのユーザーアイコン（人間アイコン）
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-800 transition-colors">
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
                </div>

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