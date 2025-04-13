// components/layout/MobileMenuButton.tsx
'use client';

import React, { useState } from 'react';
import { HiMenu, HiX } from 'react-icons/hi';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface MenuItemType {
  title: string;
  href: string;
  icon: React.ReactNode;
}

interface MobileMenuButtonProps {
  items: MenuItemType[];
}

export function MobileMenuButton({ items }: MobileMenuButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // メニュー項目
  const mainMenuItems = [...items];
  const isCorporateSection = pathname?.startsWith('/dashboard/corporate') || false;

  // 追加リンク処理
  let additionalLink = null;
  if (isCorporateSection) {
    // 法人セクションにいる場合、個人ダッシュボードへのリンクを追加
    additionalLink = {
      title: '個人ダッシュボード',
      href: '/dashboard',
      icon: items.find((item) => item.href === '/dashboard')?.icon || null,
    };
  } else if (pathname?.startsWith('/dashboard')) {
    // 個人セクションにいる場合、法人ダッシュボードへのリンクを探す
    const corporateLinkIndex = mainMenuItems.findIndex(
      (item) => item.href === '/dashboard/corporate',
    );
    if (corporateLinkIndex >= 0) {
      additionalLink = mainMenuItems.splice(corporateLinkIndex, 1)[0];
    }
  }

  return (
    <>
      {/* メニューボタン */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed bottom-6 right-3 z-50 bg-blue-600 text-white p-5 rounded-full shadow-lg focus:outline-none"
        aria-label="メニューを開く"
      >
        <HiMenu className="h-8 w-8" />
      </button>

      {/* オーバーレイ（メニューが開いている時のみ表示） */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* メニュー - ドロップシャドウを削除 */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-full max-w-xs bg-white transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* メニューヘッダー */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <h2 className="text-xl font-medium">メニュー</h2>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-md text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label="メニューを閉じる"
            >
              <HiX className="h-7 w-7" />
            </button>
          </div>

          {/* メニュー項目 */}
          <div className="flex-1 overflow-y-auto p-4">
            <nav className="space-y-3">
              {mainMenuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center px-4 py-4 text-lg font-medium rounded-md transition-colors',
                    pathname === item.href
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700',
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <div
                    className={cn(
                      'flex-shrink-0 mr-4 text-2xl',
                      pathname === item.href ? 'text-blue-700' : 'text-gray-600',
                    )}
                  >
                    {item.icon}
                  </div>
                  <span>{item.title}</span>
                </Link>
              ))}

              {/* 追加リンク */}
              {additionalLink && (
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <Link
                    href={additionalLink.href}
                    className={cn(
                      'flex items-center px-4 py-4 text-lg font-medium rounded-md transition-colors',
                      pathname === additionalLink.href
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700',
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <div
                      className={cn(
                        'flex-shrink-0 mr-4 text-2xl',
                        pathname === additionalLink.href ? 'text-blue-700' : 'text-gray-600',
                      )}
                    >
                      {additionalLink.icon}
                    </div>
                    <span>{additionalLink.title}</span>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}