// app/dashboard/corporate/layout.tsx
'use client';

import React, { ReactNode, useEffect } from 'react';
// import { CorporateAccessGuard } from '@/components/guards/CorporateAccessGuard';

interface CorporateLayoutProps {
  children: ReactNode;
}

// 一時的に無効化
/*
export default function CorporateLayout({ children }: CorporateLayoutProps) {
  console.log('[CorporateLayout] レイアウトコンポーネント初期化');

  useEffect(() => {
    console.log('[CorporateLayout] レイアウトマウント完了');
    return () => {
      console.log('[CorporateLayout] レイアウトアンマウント');
    };
  }, []);

  console.log('[CorporateLayout] CorporateAccessGuardをレンダリング');
  return <CorporateAccessGuard>{children}</CorporateAccessGuard>;
}
*/

// 最終的には削除
export default function CorporateLayout({ children }: CorporateLayoutProps) {
  // ガードをバイパスして、childrenを直接返す
  // return <CorporateAccessGuard>{children}</CorporateAccessGuard>;
  return <>{children}</>; // ガードを一時的に無効化
}