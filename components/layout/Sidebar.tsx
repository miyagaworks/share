// components/layout/Sidebar.tsx (修正版)
'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HiChevronLeft,
  HiChevronRight,
  HiOfficeBuilding,
  HiUser,
  HiLink,
  HiColorSwatch,
  HiShare,
} from 'react-icons/hi';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { corporateAccessState, PermanentPlanType } from '@/lib/corporateAccess';
// サイドバー項目の型定義
interface SidebarItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  isDivider?: boolean;
}
interface SidebarProps {
  items: SidebarItem[];
  onToggleCollapse: (collapsed: boolean) => void;
}
export function Sidebar({ items, onToggleCollapse }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  // 永久利用権関連の状態
  const [isPermanentUser, setIsPermanentUser] = useState(false);
  const [permanentPlanType, setPermanentPlanType] = useState<string | null>(null);
  // 🔧 招待メンバー判定を状態管理に変更（重要な修正）
  const [isInvitedMember, setIsInvitedMember] = useState(false);
  const [isUserTypeResolved, setIsUserTypeResolved] = useState(false);
  // 現在の URL パスをチェック
  const isCorporateSection = pathname?.startsWith('/dashboard/corporate');
  const isCorporateMemberSection = pathname?.startsWith('/dashboard/corporate-member');
  const isCorporateRelated = isCorporateSection || isCorporateMemberSection;
  useEffect(() => {
    setIsMounted(true);
    // 🔧 初期状態の設定とイベントリスナーを統合
    const updateMemberStatus = () => {
      // 招待メンバー判定（corporateAccessStateから）
      const isInvited = corporateAccessState.userRole === 'member' && !corporateAccessState.isAdmin;
      setIsInvitedMember(isInvited);
      // 🔧 ユーザータイプ解決判定をより柔軟に
      const isResolved =
        corporateAccessState.lastChecked > 0 || // APIが一度でも実行された
        corporateAccessState.hasAccess === true || // 明確にアクセス権あり
        corporateAccessState.hasAccess === false || // 明確にアクセス権なし
        corporateAccessState.error !== null; // エラーが発生した場合も解決済み
      setIsUserTypeResolved(isResolved);
    };
    // 初期状態をチェック
    updateMemberStatus();
    // クライアントサイドでのみ永久利用権のチェック
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      try {
        // ユーザーデータからの永久利用権チェック
        const userDataStr = sessionStorage.getItem('userData');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          setIsPermanentUser(userData.subscriptionStatus === 'permanent');
        }
        // corporateAccessStateからのプラン種別チェック
        if (corporateAccessState.isPermanentUser) {
          setPermanentPlanType(corporateAccessState.permanentPlanType);
        }
      } catch (e) {
      }
    }
    // アクセス状態変更イベントのリスナー
    const handleAccessChange = () => {
      // 永久利用権状態の更新
      if (corporateAccessState.isPermanentUser) {
        setIsPermanentUser(true);
        setPermanentPlanType(corporateAccessState.permanentPlanType);
      }
      // 招待メンバー状態の更新
      updateMemberStatus();
    };
    window.addEventListener('corporateAccessChanged', handleAccessChange);
    // 🔧 安全措置: 5秒後に強制的に解決済みにする
    const safetyTimer = setTimeout(() => {
      setIsUserTypeResolved(true);
    }, 5000);
    return () => {
      window.removeEventListener('corporateAccessChanged', handleAccessChange);
      clearTimeout(safetyTimer);
    };
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
  // 🔧 ユーザータイプが解決されていない場合は最小限の表示
  if (!isUserTypeResolved) {
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
              読み込み中...
            </h2>
            <button
              onClick={toggleCollapse}
              className="p-1 rounded-md hover:bg-gray-100 transition-colors focus:outline-none"
              aria-label={collapsed ? 'サイドバーを展開' : 'サイドバーを折りたたむ'}
            >
              {collapsed ? (
                <HiChevronRight className="h-5 w-5 text-gray-600" />
              ) : (
                <HiChevronLeft className="h-5 w-5 text-gray-600" />
              )}
            </button>
          </div>
          {/* メインメニュー項目のみ表示（追加リンクは表示しない） */}
          <nav className="space-y-1 px-2">
            {items.map((item) => {
              // 区切り線の場合は特別な表示を行う
              if (item.isDivider) {
                return (
                  <div key={`divider-${item.title}`} className="relative my-6">
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
                        <span className="px-2 bg-white text-xs font-semibold uppercase text-gray-500">
                          {item.title}
                        </span>
                      </div>
                    )}
                  </div>
                );
              }
              // アクティブなリンクかどうか
              const isActive = pathname === item.href;
              // 法人関連のリンクかどうか
              const isCorporateLink = item.href.includes('/corporate');
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
                itemClass = 'text-gray-600 hover:bg-blue-50 hover:text-blue-700';
                iconClass = 'text-gray-600 group-hover:text-blue-700';
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
        </div>
      </motion.div>
    );
  }
  // 法人メンバーセクションにいて、招待メンバーの場合は専用のメニューを表示
  if (isCorporateMemberSection && isInvitedMember) {
    // 招待メンバー向けの専用メニュー（上部メニューと同じ項目）
    const memberMenuItems: SidebarItem[] = [
      {
        title: '概要',
        href: '/dashboard/corporate-member',
        icon: <HiUser className="h-5 w-5 text-corporate-primary" />,
      },
      {
        title: 'プロフィール編集',
        href: '/dashboard/corporate-member/profile',
        icon: <HiUser className="h-5 w-5 text-corporate-primary" />,
      },
      {
        title: 'SNS・リンク管理',
        href: '/dashboard/corporate-member/links',
        icon: <HiLink className="h-5 w-5 text-corporate-primary" />,
      },
      {
        title: 'デザイン設定',
        href: '/dashboard/corporate-member/design',
        icon: <HiColorSwatch className="h-5 w-5 text-corporate-primary" />,
      },
      {
        title: '共有設定',
        href: '/dashboard/corporate-member/share',
        icon: <HiShare className="h-5 w-5 text-corporate-primary" />,
      },
    ];
    // 招待メンバー向けのサイドバーを表示
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
              法人メンバーメニュー
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
          {/* 招待メンバー向けのメニュー項目のみ（個人機能へのリンクなし） */}
          <nav className="space-y-1 px-2">
            {memberMenuItems.map((item, index) => {
              // 区切り線の場合は特別な表示を行う
              if (item.isDivider) {
                return (
                  <div key={`divider-${item.title}-${index}`} className="relative my-6">
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
                        <span className="px-2 bg-white text-xs font-semibold uppercase text-gray-500">
                          {item.title}
                        </span>
                      </div>
                    )}
                  </div>
                );
              }
              // アクティブなリンクかどうか
              const isActive = pathname === item.href;
              // 法人メンバー専用のスタイル
              let itemClass = '';
              let iconClass = '';
              if (isActive) {
                itemClass = 'corporate-menu-active';
                iconClass = 'corporate-icon-active';
              } else {
                itemClass = 'text-gray-600 hover:corporate-menu-active';
                iconClass = 'text-gray-600 group-hover:corporate-icon-active';
              }
              return (
                <Link
                  key={`${item.href}-${index}`}
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
        </div>
      </motion.div>
    );
  }

  // メインメニュー項目
  const mainMenuItems = [...items];
  // 追加リンク用配列
  const additionalLinks: SidebarItem[] = [];
  // メニュー項目のURLを取得する関数
  const getItemUrls = (items: SidebarItem[]): Set<string> => {
    return new Set(items.map((item) => item.href));
  };
  // 既存のメニューURLのセット
  const existingUrls = getItemUrls(mainMenuItems);
  // 永久利用権ユーザーの法人アクセス判定
  const isPermanentBusinessUser =
    isPermanentUser && permanentPlanType && permanentPlanType !== PermanentPlanType.PERSONAL;
  // 🔧 修正: 追加リンクの生成を招待メンバーでない場合のみに制限し、順序を修正
  if (!isInvitedMember) {
    // 法人セクションにいる場合
    if (isCorporateSection) {
      // 🔥 修正: 法人メンバープロフィールを区切り線の下に配置
      if (
        (corporateAccessState.hasAccess || isPermanentBusinessUser) &&
        !existingUrls.has('/dashboard/corporate-member')
      ) {
        // 区切り線を追加
        additionalLinks.push({
          title: '法人メンバー機能',
          href: '#member-divider',
          icon: <></>,
          isDivider: true,
        });
        // 法人メンバープロフィールを追加
        additionalLinks.push({
          title: '法人メンバープロフィール',
          href: '/dashboard/corporate-member',
          icon: <HiUser className="h-5 w-5" />,
        });
      }
    }
    // 法人メンバーセクションにいる場合
    else if (isCorporateMemberSection) {
      // 法人管理者または永久利用権ユーザーの場合、法人管理ダッシュボードも表示
      if (
        (corporateAccessState.isAdmin || isPermanentBusinessUser) &&
        !existingUrls.has('/dashboard/corporate')
      ) {
        additionalLinks.push({
          title: '法人管理ダッシュボード',
          href: '/dashboard/corporate',
          icon: <HiOfficeBuilding className="h-5 w-5" />,
        });
      }
    }
    // 個人セクションにいて法人アクセス権がある場合
    else if (
      !isCorporateSection &&
      !isCorporateMemberSection &&
      pathname?.startsWith('/dashboard') &&
      (corporateAccessState.hasAccess || isPermanentBusinessUser)
    ) {
      // 法人メンバーダッシュボードへのリンクを追加（存在しない場合のみ）
      if (!existingUrls.has('/dashboard/corporate-member')) {
        additionalLinks.push({
          title: '法人メンバープロフィール',
          href: '/dashboard/corporate-member',
          icon: <HiUser className="h-5 w-5" />,
        });
      }
      // 法人管理者または法人プラン永久利用権ユーザーの場合、法人管理ダッシュボードも表示
      if (
        (corporateAccessState.isAdmin || isPermanentBusinessUser) &&
        !existingUrls.has('/dashboard/corporate')
      ) {
        additionalLinks.push({
          title: '法人管理ダッシュボード',
          href: '/dashboard/corporate',
          icon: <HiOfficeBuilding className="h-5 w-5" />,
        });
      }
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
                <div key={`divider-${item.title}`} className="relative my-6">
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
                      <span className="px-2 bg-white text-xs font-semibold uppercase text-gray-500">
                        {item.title}
                      </span>
                    </div>
                  )}
                </div>
              );
            }
            // アクティブなリンクかどうか
            const isActive = pathname === item.href;
            // 法人関連のリンクかどうか
            const isCorporateLink = item.href.includes('/corporate');
            // 特別処理が必要なリンク（ご利用プラン）
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
                  // 法人セクション内での特別リンク（ご利用プラン）
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
            {/* 追加リンク */}
            <nav className="space-y-1 px-2">
              {additionalLinks.map((link, index) => {
                // 区切り線の場合は特別な表示を行う
                if (link.isDivider) {
                  return (
                    <div key={`add-divider-${link.title}-${index}`} className="relative my-6">
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
                          <span className="px-2 bg-white text-xs font-semibold uppercase text-gray-500">
                            {link.title}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                }
                // アクティブなリンクかどうか
                const isActive = pathname === link.href;
                // 法人関連のリンクかどうか
                const isCorporateLink = link.href.includes('/corporate');
                // 特別処理が必要なリンク（ご利用プラン）
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
                      // 法人セクション内での特別リンク（ご利用プラン）
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