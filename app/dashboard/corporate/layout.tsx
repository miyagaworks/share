// app/dashboard/corporate/layout.tsx
'use client';

import React, { ReactNode, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { SuspendedBanner } from '@/components/corporate/SuspendedBanner';

interface CorporateLayoutProps {
  children: ReactNode;
}

export default function CorporateLayout({ children }: CorporateLayoutProps) {
  const { data: session, status } = useSession();
  // テナントデータの状態を削除（未使用のため）

  // テナント情報を取得とSuspendedBannerに必要な情報のみを取得
  useEffect(() => {
    const fetchTenantData = async () => {
      if (status !== 'authenticated') return;

      try {
        const response = await fetch('/api/corporate/tenant');
        if (response.ok) {
          const data = await response.json();

          // テナントが一時停止中の場合は警告表示
          if (data.tenant?.accountStatus === 'suspended') {
            console.warn('このテナントは現在一時停止中です');
          }
        }
      } catch (error) {
        console.error('テナント情報取得エラー:', error);
      }
    };

    fetchTenantData();
  }, [session, status]);

  return (
    <div className="space-y-6">
      {/* 一時停止中バナーの表示 */}
      <SuspendedBanner />

      {/* メインコンテンツ */}
      {children}
    </div>
  );
}