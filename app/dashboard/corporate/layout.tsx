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

    // ネットワーク接続の監視
    const handleOnline = () => {
      console.log('ネットワーク接続回復');
      // 接続が復旧したらフラグをリセット
      window.sessionStorage.setItem('networkWasOffline', 'false');
    };

    const handleOffline = () => {
      console.log('ネットワーク接続切断');
      // オフライン状態をセッションストレージに記録
      window.sessionStorage.setItem('networkWasOffline', 'true');
    };

    // 初期状態チェック - オフラインだった場合
    if (typeof window !== 'undefined' && !navigator.onLine) {
      handleOffline();
    }

    // イベントリスナーを設定
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      // クリーンアップ時にクラスを削除
      document.documentElement.classList.remove('corporate-theme');

      // イベントリスナーの削除
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  return (
    <div className="w-full max-w-full box-border">
      <SuspendedBanner />
      {children}
    </div>
  );
}