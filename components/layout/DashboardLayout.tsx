// components/layout/DashboardLayout.tsx - フッター統合版
'use client';
import React, { ReactNode, useState, useEffect, memo, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileMenuButton } from '@/components/layout/MobileMenuButton';
import { MobileFooter } from '@/components/layout/MobileFooter';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// React.memoを使用して不要な再レンダリングを防止
const MemoizedHeader = memo(Header);
const MemoizedSidebar = memo(Sidebar);
const MemoizedMobileMenu = memo(MobileMenuButton);
const MemoizedMobileFooter = memo(MobileFooter);

interface DashboardLayoutProps {
  children: ReactNode;
  items: {
    title: string;
    href: string;
    icon: React.ReactNode;
    isDivider?: boolean;
  }[];
}

interface DashboardSectionProps {
  children: ReactNode;
  className?: string;
}

// DashboardSectionコンポーネントを最適化
export const DashboardSection = memo(function DashboardSection({
  children,
  className,
}: DashboardSectionProps) {
  return <div className={cn('space-y-4', className)}>{children}</div>;
});

export function DashboardLayout({ children, items }: DashboardLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Hydration問題を防止 - マウント後のみレンダリング
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // デバウンスされたリサイズハンドラー - パフォーマンス向上
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth < 1024);
      }, 100); // 100msのデバウンス
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // メインコンテナのクラスをメモ化
  const mainContainerClass = useMemo(
    () => `flex-1 pt-16 transition-all ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`,
    [isSidebarCollapsed],
  );

  // ハイドレーション前は最小限のコンテンツを表示
  if (!isMounted) {
    return <div className="min-h-screen bg-gray-50"></div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <MemoizedHeader />

      {/* PCではサイドバー表示 */}
      {!isMobile && <MemoizedSidebar items={items} onToggleCollapse={setIsSidebarCollapsed} />}

      {/* モバイルではメニューボタン表示 */}
      {isMobile && <MemoizedMobileMenu items={items} />}

      {/* メインコンテンツ */}
      <div className={mainContainerClass}>
        <main className="px-4 md:px-6 py-4 md:py-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={isMounted ? 'mounted' : 'not-mounted'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className={cn('pb-12', isMobile && 'pt-4')}
            >
              <div className="space-y-6 px-2 sm:px-4 w-full">{children}</div>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* モバイル専用フッター */}
        <MemoizedMobileFooter />
      </div>
    </div>
  );
}

// デフォルトエクスポートも最適化
export default memo(DashboardLayout);