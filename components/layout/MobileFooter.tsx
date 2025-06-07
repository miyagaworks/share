// components/layout/MobileFooter.tsx - モバイル専用固定フッター
'use client';
import React from 'react';
import Link from 'next/link';
import { HiOutlineMail } from 'react-icons/hi';

export function MobileFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <>
      {/* スペーサー（フッターの高さ分の余白を確保） */}
      <div className="h-16 md:hidden" />

      {/* 固定フッター */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 md:hidden">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* コピーライト */}
            <div className="text-xs text-gray-500">&copy; {currentYear} Bialpha Inc.</div>

            {/* お問い合わせリンク */}
            <Link
              href="/support/contact"
              className="flex items-center px-3 py-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
            >
              <HiOutlineMail className="h-4 w-4 mr-1" />
              お問い合わせ
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}

export default MobileFooter;