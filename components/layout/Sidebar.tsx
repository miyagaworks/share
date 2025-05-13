// components/layout/Sidebar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HiChevronLeft, HiChevronRight, HiHome, HiOfficeBuilding, HiUser } from 'react-icons/hi';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { corporateAccessState } from '@/lib/corporateAccessState';

interface SidebarProps {
  items: {
    title: string;
    href: string;
    icon: React.ReactNode;
    isDivider?: boolean; // オプションのプロパティを追加
  }[];
  onToggleCollapse: (collapsed: boolean) => void;
}

export function Sidebar({ items, onToggleCollapse }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  // 現在の URL パスをチェック
  const isCorporateSection = pathname?.startsWith('/dashboard/corporate');
  const isCorporateMemberSection = pathname?.startsWith('/dashboard/corporate-member');
  const isCorporateRelated = isCorporateSection || isCorporateMemberSection;

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

  // メインメニュー項目
  const mainMenuItems = [...items];

  // 追加リンク用変数
  const additionalLinks = [];

  // 永久利用権ユーザーかどうかをチェック
  const isPermanentUser = (() => {
    if (typeof window !== 'undefined') {
      try {
        const userDataStr = sessionStorage.getItem('userData');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          return userData.subscriptionStatus === 'permanent';
        }
      } catch (e) {
        console.error('永久利用権チェックエラー:', e);
      }
    }
    return false;
  })();

  // 法人セクションにいる場合、個人ダッシュボードと法人メンバーダッシュボードへのリンクを追加
  if (isCorporateSection) {
    additionalLinks.push({
      title: '個人ダッシュボード',
      href: '/dashboard',
      icon: <HiHome className="h-5 w-5" />,
    });

    // 法人管理者または永久利用権ユーザーは法人メンバーダッシュボードも表示
    if (corporateAccessState.hasAccess || isPermanentUser) {
      additionalLinks.push({
        title: '法人メンバープロフィール',
        href: '/dashboard/corporate-member',
        icon: <HiUser className="h-5 w-5" />,
      });
    }
  }

  // 法人メンバーセクションにいる場合、個人ダッシュボードと法人ダッシュボードへのリンクを追加
  else if (isCorporateMemberSection) {
    additionalLinks.push({
      title: '個人ダッシュボード',
      href: '/dashboard',
      icon: <HiHome className="h-5 w-5" />,
    });

    // 法人管理者の場合は法人管理ダッシュボードへのリンクも表示
    if (corporateAccessState.isAdmin) {
      additionalLinks.push({
        title: '法人管理ダッシュボード',
        href: '/dashboard/corporate',
        icon: <HiOfficeBuilding className="h-5 w-5" />,
      });
    }
  }

  // 個人セクションにいて法人アクセス権がある場合、法人関連リンクを追加
  else if (
    !isCorporateSection &&
    !isCorporateMemberSection &&
    pathname?.startsWith('/dashboard') &&
    corporateAccessState.hasAccess
  ) {
    // 法人メンバーダッシュボードへのリンクを追加
    additionalLinks.push({
      title: '法人メンバープロフィール',
      href: '/dashboard/corporate-member',
      icon: <HiUser className="h-5 w-5" />,
    });

    // 法人管理者の場合は法人管理ダッシュボードへのリンクも追加
    if (corporateAccessState.isAdmin) {
      additionalLinks.push({
        title: '法人管理ダッシュボード',
        href: '/dashboard/corporate',
        icon: <HiOfficeBuilding className="h-5 w-5" />,
      });
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
          {mainMenuItems.map((item) => {
            // 区切り線の場合は特別な表示を行う
            if (item.isDivider) {
              return (
                <div key={`divider-${item.title}`} className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div
                      className={cn(
                        'border-t border-gray-200',
                        collapsed ? 'w-10 mx-auto' : 'w-full',
                      )}
                    ></div>
                  </div>
                  {!collapsed && (
                    <div className="relative flex justify-center">
                      <span className="px-2 bg-white text-xs text-gray-500">{item.title}</span>
                    </div>
                  )}
                </div>
              );
            }

            // アクティブなリンクかどうか
            const isActive = pathname === item.href;
            // 法人関連のリンクかどうか
            const isCorporateLink = item.href.includes('/corporate');

            // 特別処理が必要なリンク（ご利用プランと個人ダッシュボード）
            const isSpecialLink =
              item.href === '/dashboard/subscription' || item.href === '/dashboard';

            // 条件に応じたクラス生成
            let itemClass = '';
            let iconClass = '';

            if (isActive) {
              if (isCorporateRelated || isCorporateLink) {
                // 法人セクションまたは法人関連リンクのアクティブスタイル
                itemClass = 'corporate-menu-active';
                iconClass = 'corporate-icon-active';
              } else {
                // 通常セクションのアクティブスタイル
                itemClass = 'bg-blue-50 text-blue-700';
                iconClass = 'text-blue-700';
              }
            } else {
              // 非アクティブスタイル
              if (isCorporateRelated || isCorporateLink) {
                if (isSpecialLink) {
                  // 法人セクション内での特別リンク（ご利用プランと個人ダッシュボード）
                  itemClass = 'text-gray-600 hover:bg-blue-50 hover:text-blue-700';
                  iconClass = 'text-gray-600 group-hover:text-blue-700';
                } else {
                  // 法人セクションでの通常の非アクティブ（hover含む）
                  itemClass = 'text-gray-600 hover:corporate-menu-active';
                  iconClass = 'text-gray-600 group-hover:corporate-icon-active';
                }
              } else {
                // 通常セクションでの非アクティブ
                itemClass = 'text-gray-600 hover:bg-blue-50 hover:text-blue-700';
                iconClass = 'text-gray-600 group-hover:text-blue-700';
              }
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors group',
                  itemClass,
                  collapsed ? 'justify-center' : 'justify-start',
                )}
              >
                <div className={cn('flex-shrink-0', iconClass)}>{item.icon}</div>
                <span
                  className={cn(
                    'ml-3 transition-opacity duration-200',
                    collapsed ? 'opacity-0 hidden' : 'opacity-100',
                  )}
                >
                  {item.title}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* 区切り線と追加リンク */}
        {additionalLinks.length > 0 && (
          <div className="mt-4">
            {/* 区切り線 */}
            <div
              className={cn('mx-2 border-t border-gray-200 my-4', collapsed ? 'mx-2' : 'mx-4')}
            ></div>

            {/* 追加リンク */}
            <nav className="space-y-1 px-2">
              {additionalLinks.map((link, index) => {
                // アクティブなリンクかどうか
                const isActive = pathname === link.href;
                // 法人関連のリンクかどうか
                const isCorporateLink = link.href.includes('/corporate');

                // 特別処理が必要なリンク（ご利用プランと個人ダッシュボード）
                const isSpecialLink =
                  link.href === '/dashboard/subscription' || link.href === '/dashboard';

                // 条件に応じたクラス生成
                let itemClass = '';
                let iconClass = '';

                if (isActive) {
                  if (isCorporateRelated || isCorporateLink) {
                    // 法人セクションまたは法人関連リンクのアクティブスタイル
                    itemClass = 'corporate-menu-active';
                    iconClass = 'corporate-icon-active';
                  } else {
                    // 通常セクションのアクティブスタイル
                    itemClass = 'bg-blue-50 text-blue-700';
                    iconClass = 'text-blue-700';
                  }
                } else {
                  // 非アクティブスタイル
                  if (isCorporateRelated || isCorporateLink) {
                    if (isSpecialLink) {
                      // 法人セクション内での特別リンク（ご利用プランと個人ダッシュボード）
                      itemClass = 'text-gray-600 hover:bg-blue-50 hover:text-blue-700';
                      iconClass = 'text-gray-600 group-hover:text-blue-700';
                    } else {
                      // 法人セクションでの通常の非アクティブ（hover含む）
                      itemClass = 'text-gray-600 hover:corporate-menu-active';
                      iconClass = 'text-gray-600 group-hover:corporate-icon-active';
                    }
                  } else {
                    // 通常セクションでの非アクティブ
                    itemClass = 'text-gray-600 hover:bg-blue-50 hover:text-blue-700';
                    iconClass = 'text-gray-600 group-hover:text-blue-700';
                  }
                }

                return (
                  <Link
                    key={`${link.href}-${index}`}
                    href={link.href}
                    className={cn(
                      'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors group',
                      itemClass,
                      collapsed ? 'justify-center' : 'justify-start',
                    )}
                  >
                    <div className={cn('flex-shrink-0', iconClass)}>{link.icon}</div>
                    <span
                      className={cn(
                        'ml-3 transition-opacity duration-200',
                        collapsed ? 'opacity-0 hidden' : 'opacity-100',
                      )}
                    >
                      {link.title}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </motion.div>
  );
}