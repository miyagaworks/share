// components/layout/MobileMenuButton.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { HiMenu, HiX, HiOfficeBuilding, HiUser } from 'react-icons/hi';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { corporateAccessState, checkCorporateAccess } from '@/lib/corporateAccess';
interface MenuItemType {
  title: string;
  href: string;
  icon: React.ReactNode;
  isDivider?: boolean;
  adminOnly?: boolean;
}
interface MobileMenuButtonProps {
  items: MenuItemType[];
}
export function MobileMenuButton({ items }: MobileMenuButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  // 強制再レンダリング用
  const [, setRenderKey] = useState(0);
  // 🔧 招待メンバー判定の状態を追加
  const [isInvitedMember, setIsInvitedMember] = useState(false);
  const [isUserTypeResolved, setIsUserTypeResolved] = useState(false);
  // 法人アクセス権を確認
  useEffect(() => {
    const initAccess = async () => {
      // 既に確認済みの場合は再チェックしない
      if (corporateAccessState.hasAccess !== null) {
        return;
      }
      try {
        await checkCorporateAccess();
        // 状態が変更されたら再レンダリング
        setRenderKey((prev) => prev + 1);
      } catch {
      }
    };
    initAccess();
    // 🔧 メンバー状態更新関数
    const updateMemberStatus = () => {
      // 招待メンバー判定（corporateAccessStateから）
      const isInvited = corporateAccessState.userRole === 'member' && !corporateAccessState.isAdmin;
      setIsInvitedMember(isInvited);
      // ユーザータイプ解決判定
      const isResolved =
        corporateAccessState.lastChecked > 0 ||
        corporateAccessState.hasAccess === true ||
        corporateAccessState.hasAccess === false ||
        corporateAccessState.error !== null;
      setIsUserTypeResolved(isResolved);
    };
    // 初期状態をチェック
    updateMemberStatus();
    // アクセス状態変更イベントのリスナー
    const handleAccessChange = () => {
      updateMemberStatus();
      setRenderKey((prev) => prev + 1);
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
  // メニュー項目
  const mainMenuItems = [...items];
  // 現在のURLのセクションをチェック
  const isCorporateSection = pathname?.startsWith('/dashboard/corporate');
  const isCorporateMemberSection = pathname?.startsWith('/dashboard/corporate-member');
  const isCorporateRelated = isCorporateSection || isCorporateMemberSection;
  // メインメニューに存在するリンクのパスを収集
  const mainItemPaths = new Set(mainMenuItems.map((item) => item.href));
  // 追加リンク処理
  const additionalLinks: MenuItemType[] = [];
  // リンクを追加する関数（重複チェック付き）
  const addLink = (link: MenuItemType) => {
    // すでにメインメニューに存在する場合は追加しない
    if (!mainItemPaths.has(link.href)) {
      additionalLinks.push(link);
    }
  };
  // 🔧 招待メンバーでない場合のみ追加リンクを生成
  if (!isInvitedMember && isUserTypeResolved) {
    // 法人セクションにいる場合、法人メンバーダッシュボードへのリンクを追加
    if (isCorporateSection) {
      // 法人管理者は法人メンバーダッシュボードも表示
      if (corporateAccessState.hasAccess) {
        addLink({
          title: '法人メンバープロフィール',
          href: '/dashboard/corporate-member',
          icon: <HiUser className="h-5 w-5" />,
        });
      }
    }
    // 法人メンバーセクションにいる場合、法人ダッシュボードへのリンクを追加
    else if (isCorporateMemberSection) {
      // 法人管理者の場合は法人管理ダッシュボードへのリンクも表示
      if (corporateAccessState.isAdmin) {
        addLink({
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
      addLink({
        title: '法人メンバープロフィール',
        href: '/dashboard/corporate-member',
        icon: <HiUser className="h-5 w-5" />,
      });
      // 法人管理者の場合は法人管理ダッシュボードへのリンクも追加
      if (corporateAccessState.isAdmin) {
        addLink({
          title: '法人管理ダッシュボード',
          href: '/dashboard/corporate',
          icon: <HiOfficeBuilding className="h-5 w-5" />,
        });
      }
    }
  }
  // 管理者権限によるフィルタリング
  const filteredMainItems = mainMenuItems.filter(
    (item) => !item.adminOnly || corporateAccessState.isAdmin,
  );
  // 法人セクション関連のメニューボタンスタイル
  const getMenuButtonStyle = () => {
    if (isCorporateRelated) {
      // 明示的に色を指定する
      return 'lg:hidden fixed bottom-6 right-3 z-50 bg-[#1E3A8A] text-white p-5 rounded-full shadow-lg focus:outline-none';
    }
    return 'lg:hidden fixed bottom-6 right-3 z-50 bg-blue-600 text-white p-5 rounded-full shadow-lg focus:outline-none';
  };
  return (
    <>
      {/* メニューボタン */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={getMenuButtonStyle()}
        aria-label="メニューを開く"
      >
        <HiMenu className="h-8 w-8" />
      </button>
      {/* オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
          onClick={() => setIsOpen(false)}
        />
      )}
      {/* メニュー */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-full max-w-xs bg-white transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* メニューヘッダー */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <h2 className="text-xl font-medium">
              {/* 🔧 招待メンバーの場合は専用のタイトルを表示 */}
              {isInvitedMember ? '法人メンバーメニュー' : 'メニュー'}
            </h2>
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
              {filteredMainItems.map((item) => {
                // 区切り線の場合は特別な表示を行う
                if (item.isDivider) {
                  return (
                    <div key={`divider-${item.title}`} className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="px-2 bg-white text-xs font-semibold uppercase text-gray-500">
                          {item.title}
                        </span>
                      </div>
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
                  if (isCorporateRelated || isCorporateLink) {
                    // 法人セクションでの非アクティブ（hover含む）
                    itemClass = 'text-gray-700 hover:corporate-menu-active';
                    iconClass = 'text-gray-600 group-hover:corporate-icon-active';
                  } else {
                    // 通常セクションでの非アクティブ
                    itemClass = 'text-gray-700 hover:bg-blue-50 hover:text-blue-700';
                    iconClass = 'text-gray-600 group-hover:text-blue-700';
                  }
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center px-4 py-4 text-lg font-medium rounded-md transition-colors group',
                      itemClass,
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <div className={cn('flex-shrink-0 mr-4 text-2xl', iconClass)}>{item.icon}</div>
                    <span>{item.title}</span>
                  </Link>
                );
              })}
              {/* 追加リンク - 招待メンバーでない場合のみ表示 */}
              {!isInvitedMember && additionalLinks.length > 0 && (
                <div className="pt-4">
                  {/* 区切り線 */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-2 bg-white text-xs font-semibold uppercase text-gray-500">
                        その他
                      </span>
                    </div>
                  </div>
                  {additionalLinks.map((link, index) => {
                    // 区切り線の場合は特別な表示を行う
                    if (link.isDivider) {
                      return (
                        <div key={`add-divider-${link.title}-${index}`} className="relative my-6">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                          </div>
                          <div className="relative flex justify-center">
                            <span className="px-2 bg-white text-xs font-semibold uppercase text-gray-500">
                              {link.title}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    // アクティブなリンクかどうか
                    const isActive = pathname === link.href;
                    // 法人関連のリンクかどうか
                    const isCorporateLink = link.href.includes('/corporate');
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
                        // 法人セクションでの非アクティブ（hover含む）
                        itemClass = 'text-gray-700 hover:corporate-menu-active';
                        iconClass = 'text-gray-600 group-hover:corporate-icon-active';
                      } else {
                        // 通常セクションでの非アクティブ
                        itemClass = 'text-gray-700 hover:bg-blue-50 hover:text-blue-700';
                        iconClass = 'text-gray-600 group-hover:text-blue-700';
                      }
                    }
                    return (
                      <Link
                        key={`add-${link.href}-${index}`}
                        href={link.href}
                        className={cn(
                          'flex items-center px-4 py-4 text-lg font-medium rounded-md transition-colors group',
                          itemClass,
                        )}
                        onClick={() => setIsOpen(false)}
                      >
                        <div className={cn('flex-shrink-0 mr-4 text-2xl', iconClass)}>
                          {link.icon}
                        </div>
                        <span>{link.title}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}