// app/dashboard/corporate/page.tsx (プラン名修正版)
'use client';

import React, { memo, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { CorporateBranding } from '@/components/ui/CorporateBranding';
import { OptimizedMenuCard } from '@/components/ui/OptimizedMenuCard';
import { OptimizedActivityFeed } from '@/components/corporate/OptimizedActivityFeed';
import { useOptimizedTenant, useRefreshTenant } from '@/hooks/useOptimizedTenant';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
// Lucide Reactアイコンを使用
import { Building2, Users, Layout, Palette, Link, Settings, AlertTriangle } from 'lucide-react';

// プラン名を日本語に変換する関数
const getPlanDisplayName = (planId: string | undefined): string => {
  if (!planId) return '';

  const plan = planId.toLowerCase();

  if (plan.includes('starter')) {
    return 'スタータープラン';
  } else if (plan.includes('business') && !plan.includes('enterprise')) {
    return 'ビジネスプラン';
  } else if (plan.includes('enterprise')) {
    return 'エンタープライズプラン';
  }

  // 古いプランIDとの互換性
  if (plan === 'business_legacy') {
    return 'スタータープラン';
  } else if (plan === 'business_plus' || plan === 'business-plus') {
    return 'ビジネスプラン';
  }

  // デフォルト
  return planId;
};

// プランIDからユーザー数を取得する関数
const getMaxUsersByPlan = (planId: string | undefined): number => {
  if (!planId) return 0;

  const plan = planId.toLowerCase();

  if (plan.includes('starter') || plan === 'business_legacy') {
    return 10; // スタータープラン
  } else if (plan.includes('business') && !plan.includes('enterprise')) {
    return 30; // ビジネスプラン
  } else if (plan.includes('enterprise')) {
    return 50; // エンタープライズプラン
  } else if (plan === 'business_plus' || plan === 'business-plus') {
    return 30; // 旧ビジネスプラスは30名
  }

  // デフォルト
  return 0;
};

// デバッグ情報のプロパティ型定義
interface DebugInfoProps {
  data:
    | {
        tenant?: {
          id: string;
          name: string;
          accountStatus?: string;
        };
        isAdmin?: boolean;
        userRole?: string;
      }
    | null
    | undefined;
  isLoading: boolean;
  error: Error | null;
}

// スケルトンUIコンポーネント
const TenantSkeleton = memo(() => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 mb-4 sm:mb-5 mx-1 sm:mx-2 animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
    <div className="flex items-center space-x-4">
      <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
      <div>
        <div className="h-4 bg-gray-200 rounded w-32"></div>
        <div className="h-3 bg-gray-200 rounded w-24 mt-2"></div>
      </div>
    </div>
  </div>
));

TenantSkeleton.displayName = 'TenantSkeleton';

const MenuSkeleton = memo(() => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mx-1 sm:mx-2 mb-4 sm:mb-5">
    {Array.from({ length: 5 }, (_, i) => (
      <div
        key={i}
        className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 animate-pulse"
      >
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="flex justify-center mb-3">
          <div className="h-16 w-16 bg-gray-200 rounded-full"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
      </div>
    ))}
  </div>
));

MenuSkeleton.displayName = 'MenuSkeleton';

// デバッグ情報表示コンポーネント（開発環境のみ）
const DebugInfo = memo<DebugInfoProps>(({ data, isLoading, error }) => {
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="mx-1 sm:mx-2 mb-4 p-3 bg-gray-100 rounded-lg text-xs">
      <h3 className="font-semibold mb-2">デバッグ情報:</h3>
      <div className="space-y-1">
        <div>Loading: {isLoading ? 'true' : 'false'}</div>
        <div>Error: {error ? error.message : 'none'}</div>
        <div>Data: {data ? 'available' : 'none'}</div>
        {data?.tenant && (
          <div className="mt-2">
            <div>Tenant ID: {data.tenant.id}</div>
            <div>Tenant Name: {data.tenant.name}</div>
            <div>Account Status: {data.tenant.accountStatus || 'unknown'}</div>
            <div>User Role: {data.userRole || 'unknown'}</div>
            <div>Is Admin: {data.isAdmin ? 'true' : 'false'}</div>
          </div>
        )}
      </div>
    </div>
  );
});

DebugInfo.displayName = 'DebugInfo';

// 警告バナーコンポーネント
const RetryableWarningBanner = memo<{
  message: string;
  onRetry: () => void;
}>(({ message, onRetry }) => (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 mx-2">
    <div className="flex items-start justify-between">
      <div className="flex items-start">
        <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-yellow-700">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="ml-4 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded hover:bg-yellow-200"
      >
        再試行
      </button>
    </div>
  </div>
));

RetryableWarningBanner.displayName = 'RetryableWarningBanner';

// メインダッシュボードコンポーネント
export default function OptimizedCorporateDashboardPage() {
  const router = useRouter();
  const { data: tenantResponse, isLoading, error } = useOptimizedTenant();
  const refreshTenant = useRefreshTenant();

  // メニューアクション（メモ化）
  const menuActions = useMemo(
    () => ({
      users: () => router.push('/dashboard/corporate/users'),
      departments: () => router.push('/dashboard/corporate/departments'),
      sns: () => router.push('/dashboard/corporate/sns'),
      branding: () => router.push('/dashboard/corporate/branding'),
      settings: () => router.push('/dashboard/corporate/settings'),
    }),
    [router],
  );

  // テナントデータの取得
  const tenant = useMemo(() => tenantResponse?.tenant || null, [tenantResponse?.tenant]);

  // プラン表示名の計算（メモ化）
  const planDisplayName = useMemo(() => {
    return getPlanDisplayName(tenant?.subscriptionPlan);
  }, [tenant?.subscriptionPlan]);

  // 正しいユーザー数上限の計算（メモ化）
  const correctMaxUsers = useMemo(() => {
    return getMaxUsersByPlan(tenant?.subscriptionPlan);
  }, [tenant?.subscriptionPlan]);

  console.log('CorporateDashboard - レンダリング:', {
    isLoading,
    hasError: !!error,
    hasTenant: !!tenant,
    tenantId: tenant?.id,
    subscriptionPlan: tenant?.subscriptionPlan,
    planDisplayName,
  });

  // ローディング中の表示
  if (isLoading) {
    return (
      <div className="max-w-full px-1 sm:px-0">
        <DebugInfo data={tenantResponse || null} isLoading={isLoading} error={error} />
        <TenantSkeleton />
        <MenuSkeleton />
      </div>
    );
  }

  // エラー時の表示
  if (error || !tenant) {
    return (
      <div className="max-w-full px-1 sm:px-0">
        <DebugInfo data={tenantResponse || null} isLoading={isLoading} error={error} />
        <ErrorMessage
          message={error?.message || 'テナント情報を取得できませんでした。'}
          details={error ? `エラーの詳細: ${error.message}` : undefined}
          severity="error"
          onRetry={refreshTenant}
          className="mx-1 sm:mx-2 mb-4"
        />
      </div>
    );
  }

  return (
    <div className="max-w-full px-1 sm:px-0">
      <DebugInfo data={tenantResponse || null} isLoading={isLoading} error={error} />

      {/* テナント概要 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 mb-4 sm:mb-5 mx-1 sm:mx-2">
        <CorporateBranding
          primaryColor={tenant.primaryColor || undefined}
          secondaryColor={tenant.secondaryColor || undefined}
          logoUrl={tenant.logoUrl}
          tenantName={tenant.name}
          headerText={`${tenant.name} ダッシュボード`}
          textColor="#FFFFFF"
          shadow={false}
          border={false}
          showLogo={false}
        >
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="flex items-center mb-2 sm:mb-0">
              {tenant.logoUrl ? (
                <div className="rounded-full p-2 bg-gray-100 mr-3 flex items-center justify-center w-12 h-12">
                  <Image
                    src={tenant.logoUrl}
                    alt={`${tenant.name}のロゴ`}
                    width={30}
                    height={30}
                    className="rounded-full object-contain"
                    priority
                  />
                </div>
              ) : (
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-blue-100 flex items-center justify-center mr-3 p-2">
                  <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
              )}
              <div>
                <h1 className="text-lg sm:text-xl font-bold break-words">{tenant.name}</h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  法人プラン: 最大{correctMaxUsers || tenant.maxUsers}ユーザー
                  {planDisplayName && (
                    <span className="ml-2 text-blue-600">({planDisplayName})</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </CorporateBranding>
      </div>

      {/* メニューグリッド */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mx-1 sm:mx-2 mb-4 sm:mb-5">
        <OptimizedMenuCard
          icon={<Users className="h-5 w-5" />}
          title="ユーザー管理"
          content={`${tenant.userCount}/${correctMaxUsers || tenant.maxUsers} ユーザー`}
          onClick={menuActions.users}
          color="blue"
        />

        <OptimizedMenuCard
          icon={<Layout className="h-5 w-5" />}
          title="部署管理"
          content={`${tenant.departmentCount} 部署`}
          onClick={menuActions.departments}
          color="green"
        />

        <OptimizedMenuCard
          icon={<Link className="h-5 w-5" />}
          title="共通SNS設定"
          content="全社員共通のSNSリンク"
          onClick={menuActions.sns}
          color="indigo"
        />

        <OptimizedMenuCard
          icon={<Palette className="h-5 w-5" />}
          title="ブランディング設定"
          content="ロゴと企業カラーの設定"
          onClick={menuActions.branding}
          color="purple"
        />

        <OptimizedMenuCard
          icon={<Settings className="h-5 w-5" />}
          title="設定"
          content="法人アカウント設定"
          onClick={menuActions.settings}
          color="gray"
        />
      </div>

      {/* 最近の活動 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 mx-1 sm:mx-2">
        <OptimizedActivityFeed limit={5} autoRefresh={false} />
      </div>
    </div>
  );
}