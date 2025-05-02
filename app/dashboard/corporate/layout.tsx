// app/dashboard/corporate/layout.tsx
'use client';

import React, { ReactNode, useEffect } from 'react';
import { SuspendedBanner } from '@/components/corporate/SuspendedBanner';

interface CorporateLayoutProps {
  children: ReactNode;
}

export default function CorporateLayout({ children }: CorporateLayoutProps) {
  // CSSの変数をドキュメントのルートに設定してテーマを切り替える
  useEffect(() => {
    // ルート要素にクラスを追加（グローバルCSSでスタイルを定義するため）
    document.documentElement.classList.add('corporate-theme');

    return () => {
      // クリーンアップ時にクラスを削除
      document.documentElement.classList.remove('corporate-theme');
    };
  }, []);

  return (
    <div className="w-full max-w-full box-border">
      <SuspendedBanner />
      {children}
    </div>
  );
}