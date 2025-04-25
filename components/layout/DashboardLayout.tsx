// components/layout/DashboardLayout.tsx
'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileMenuButton } from '@/components/layout/MobileMenuButton';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
  items: {
    title: string;
    href: string;
    icon: React.ReactNode;
  }[];
}

interface DashboardSectionProps {
  children: ReactNode;
  className?: string;
}

// DashboardSectionコンポーネントの追加
export function DashboardSection({ children, className }: DashboardSectionProps) {
  return <div className={cn('space-y-4', className)}>{children}</div>;
}

export function DashboardLayout({ children, items }: DashboardLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // 画面サイズの変更を監視
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Header />

      {/* PCではサイドバー表示、モバイルでは非表示 */}
      <div className="hidden lg:block">
        <Sidebar items={items} onToggleCollapse={(collapsed) => setIsSidebarCollapsed(collapsed)} />
      </div>

      {/* モバイルではボタンでメニュー表示 */}
      <div className="lg:hidden">
        <MobileMenuButton items={items} />
      </div>

      {/* メインコンテンツ */}
      <div
        className={`flex-1 pt-16 transition-all ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}
      >
        {/* 修正：コンテナのpx-4とmd:px-6を削除して一貫した余白を適用 */}
        <main className="px-4 md:px-6 py-4 md:py-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cn('pb-12', isMobile && 'pt-4')}
          >
            {/* 修正：すべてのページで一貫した余白を適用するためのラッパー追加 */}
            <div className="space-y-6 px-2 sm:px-4 w-full">{children}</div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}