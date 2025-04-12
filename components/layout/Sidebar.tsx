// components/layout/Sidebar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HiChevronLeft, HiChevronRight, HiHome, HiOfficeBuilding } from 'react-icons/hi';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
// import Image from 'next/image';

interface SidebarProps {
  items: {
    title: string;
    href: string;
    icon: React.ReactNode;
  }[];
  onToggleCollapse: (collapsed: boolean) => void;
}

export function Sidebar({ items, onToggleCollapse }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  // 現在の URL が法人ダッシュボードかどうかを確認
  const isCorporateSection = pathname?.startsWith('/dashboard/corporate');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
    onToggleCollapse(!collapsed);
  };

  if (!isMounted) {
    // ハイドレーション不一致を避けるためにサーバーサイドレンダリング時は最小限の内容を返す
    return (
      <div className="fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-20 transition-all duration-300 transform">
        {/* ロゴプレースホルダー */}
        <div className="h-16 border-b border-gray-200 flex items-center px-4">
          <div className="w-8 h-8 bg-gray-200 rounded-md"></div>
        </div>
      </div>
    );
  }

  // メインメニュー項目と追加メニュー項目を分離
  const mainMenuItems = [...items];
  let additionalLink = null;

  // 法人セクションにいる場合、個人ダッシュボードへのリンクを追加メニューに
  if (isCorporateSection) {
    additionalLink = {
      title: '個人ダッシュボード',
      href: '/dashboard',
      icon: <HiHome className="h-5 w-5" />,
    };
  }
  // 個人セクションにいる場合、法人ダッシュボードへのリンクを追加メニューに
  else if (!isCorporateSection && pathname?.startsWith('/dashboard')) {
    // mainMenuItemsから法人ダッシュボードへのリンクが含まれている場合は削除
    const corporateLinkIndex = mainMenuItems.findIndex(
      (item) => item.href === '/dashboard/corporate',
    );
    if (corporateLinkIndex >= 0) {
      additionalLink = mainMenuItems.splice(corporateLinkIndex, 1)[0];
    } else {
      // 含まれていない場合は新規作成
      additionalLink = {
        title: '法人ダッシュボード',
        href: '/dashboard/corporate',
        icon: <HiOfficeBuilding className="h-5 w-5" />,
      };
    }
  }

  return (
    <motion.div
      initial={false}
      animate={{ width: collapsed ? 64 : 256 }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-20 pt-16"
    >
      <div className="h-full overflow-y-auto overflow-x-hidden">
        <div className="flex items-center justify-between p-4 mb-2">
          <h2
            className={cn(
              'text-sm font-semibold text-gray-600 uppercase transition-opacity',
              collapsed ? 'opacity-0' : 'opacity-100',
            )}
          >
            メニュー
          </h2>
          <button
            onClick={toggleCollapse}
            className="p-1 rounded-md hover:bg-blue-100 transition-colors focus:outline-none"
            aria-label={collapsed ? 'サイドバーを展開' : 'サイドバーを折りたたむ'}
          >
            {collapsed ? (
              <HiChevronRight className="h-5 w-5 text-gray-600" />
            ) : (
              <HiChevronLeft className="h-5 w-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* メインメニュー項目 */}
        <nav className="space-y-1 px-2">
          {mainMenuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors group',
                pathname === item.href
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700',
                collapsed ? 'justify-center' : 'justify-start',
              )}
            >
              <div
                className={cn(
                  'flex-shrink-0',
                  pathname === item.href
                    ? 'text-blue-700'
                    : 'text-gray-600 group-hover:text-blue-700',
                )}
              >
                {item.icon}
              </div>
              <span
                className={cn(
                  'ml-3 transition-opacity duration-200',
                  collapsed ? 'opacity-0 hidden' : 'opacity-100',
                )}
              >
                {item.title}
              </span>
            </Link>
          ))}
        </nav>

        {/* 区切り線と追加リンク */}
        {additionalLink && (
          <div className="mt-4">
            {/* 区切り線 */}
            <div
              className={cn('mx-2 border-t border-gray-200 my-4', collapsed ? 'mx-2' : 'mx-4')}
            ></div>

            {/* 追加リンク */}
            <nav className="space-y-1 px-2">
              <Link
                href={additionalLink.href}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors group',
                  pathname === additionalLink.href
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700',
                  collapsed ? 'justify-center' : 'justify-start',
                )}
              >
                <div
                  className={cn(
                    'flex-shrink-0',
                    pathname === additionalLink.href
                      ? 'text-blue-700'
                      : 'text-gray-600 group-hover:text-blue-700',
                  )}
                >
                  {additionalLink.icon}
                </div>
                <span
                  className={cn(
                    'ml-3 transition-opacity duration-200',
                    collapsed ? 'opacity-0 hidden' : 'opacity-100',
                  )}
                >
                  {additionalLink.title}
                </span>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </motion.div>
  );
}