// components/layout/Header.tsx
'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
// 必要なアイコンのみをインポート
import {
  HiOutlineInformationCircle,
  HiOutlinePhone,
  HiOutlineUser,
  HiOutlineCreditCard,
} from 'react-icons/hi';
interface HeaderProps {
  className?: string;
}
export function Header({ className }: HeaderProps) {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // ダッシュボード関連のページで新しいヘッダーを使用
  if (session) {
    return <DashboardHeader />;
  }
  // 一般ユーザー向けの既存のヘッダー
  return (
    <header
      className={cn('fixed top-0 left-0 right-0 z-40 border-b border-gray-200 bg-white', className)}
    >
      <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="メニューを開く" // 明示的なラベルを追加
          >
            {/* sr-onlyのスパンを削除（aria-labelで代替） */}
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              // aria-hidden属性を削除
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <Link href="/dashboard" className="ml-4 flex items-center lg:ml-0">
            <Image src="/logo.svg" alt="Share Logo" width={145} height={42} priority />
          </Link>
        </div>
        <div className="hidden md:flex md:items-center md:space-x-6">
          <Link href="/features" className="text-sm font-medium text-gray-700 hover:text-gray-900">
            機能
          </Link>
          <Link href="/pricing" className="text-sm font-medium text-gray-700 hover:text-gray-900">
            料金
          </Link>
          <Link href="/contact" className="text-sm font-medium text-gray-700 hover:text-gray-900">
            お問い合わせ
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/auth/signin">
            <Button variant="outline" size="sm">
              ログイン
            </Button>
          </Link>
          <Link href="/auth/signup" className="hidden md:inline-block">
            <Button size="sm">登録</Button>
          </Link>
        </div>
      </div>
      {/* モバイルメニュー */}
      <div className={`lg:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="space-y-1 px-2 pt-2 pb-3">
          <Link
            href="/features"
            className="flex items-center rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            onClick={() => setMobileMenuOpen(false)}
          >
            <HiOutlineInformationCircle className="mr-3 h-5 w-5 text-gray-500" />
            機能
          </Link>
          <Link
            href="/pricing"
            className="flex items-center rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            onClick={() => setMobileMenuOpen(false)}
          >
            <HiOutlineCreditCard className="mr-3 h-5 w-5 text-gray-500" />
            料金
          </Link>
          <Link
            href="/contact"
            className="flex items-center rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            onClick={() => setMobileMenuOpen(false)}
          >
            <HiOutlinePhone className="mr-3 h-5 w-5 text-gray-500" />
            お問い合わせ
          </Link>
          <Link
            href="/auth/signin"
            className="flex items-center rounded-md px-3 py-2 text-base font-medium text-blue-600 hover:bg-blue-50"
            onClick={() => setMobileMenuOpen(false)}
          >
            <HiOutlineUser className="mr-3 h-5 w-5 text-blue-500" />
            ログイン
          </Link>
          <Link
            href="/auth/signup"
            className="flex items-center rounded-md px-3 py-2 text-base font-medium text-blue-600 hover:bg-blue-50"
            onClick={() => setMobileMenuOpen(false)}
          >
            <HiOutlineUser className="mr-3 h-5 w-5 text-blue-500" />
            登録
          </Link>
        </div>
      </div>
    </header>
  );
}
