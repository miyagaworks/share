// app/dashboard/corporate/page.tsx
'use client';

import { CorporateBranding } from '@/components/ui/CorporateBranding';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { Spinner } from '@/components/ui/Spinner';
import { ActivityFeed } from '@/components/corporate/ActivityFeed';

// アイコンを代替
import {
  HiOfficeBuilding,
  HiUsers,
  HiTemplate,
  HiColorSwatch,
  HiLink,
  HiCog,
  HiExclamation,
} from 'react-icons/hi';

// 企業テナント情報の型定義
interface CorporateTenant {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  maxUsers: number;
  createdAt?: string;
  updatedAt?: string;
  userCount?: number;
  departmentCount?: number;
  users: {
    id: string;
    name: string;
    email: string;
    corporateRole: string | null;
  }[];
  departments: {
    id: string;
    name: string;
    description: string | null;
  }[];
}

// フォールバック用のデフォルトテナント情報
const DEFAULT_TENANT: CorporateTenant = {
  id: 'default',
  name: '未登録',
  logoUrl: null,
  primaryColor: null,
  secondaryColor: null,
  maxUsers: 10,
  users: [],
  departments: [],
  userCount: 0,
  departmentCount: 0,
};

// リトライボタン付きの警告バナー
const RetryableWarningBanner = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 mx-2">
    <div className="flex items-start justify-between">
      <div className="flex items-start">
        <HiExclamation className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
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
);

// カードのカラー定義
type CardColor = 'blue' | 'green' | 'indigo' | 'purple' | 'gray';

// カラーマップの定義
const colorMap = {
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-600',
    iconBg: 'bg-blue-50',
  },
  green: {
    bg: 'bg-green-100',
    text: 'text-green-600',
    iconBg: 'bg-green-50',
  },
  indigo: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-600',
    iconBg: 'bg-indigo-50',
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-600',
    iconBg: 'bg-purple-50',
  },
  gray: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    iconBg: 'bg-gray-50',
  },
};

// メニューカードコンポーネント
const MenuCard = ({
  icon,
  title,
  content,
  onClick,
  color = 'blue',
}: {
  icon: React.ReactNode;
  title: string;
  content: string | number | React.ReactNode;
  onClick: () => void;
  color?: CardColor;
}) => {
  return (
    <div
      className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden cursor-pointer transform transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
      onClick={onClick}
    >
      <div
        className={`border-b border-gray-200 px-2 sm:px-4 py-2 sm:py-3 ${colorMap[color].bg} bg-opacity-30`}
      >
        <div className="flex items-center">
          <div className={`${colorMap[color].text}`}>{icon}</div>
          <h2 className="ml-2 text-sm sm:text-base font-semibold truncate">{title}</h2>
        </div>
      </div>
      <div className="p-2 sm:p-4">
        <div className="flex flex-col items-center">
          <div
            className={`${colorMap[color].bg} p-2 sm:p-3 rounded-full mb-2 sm:mb-3 flex items-center justify-center`}
          >
            <div
              className={`h-5 w-5 sm:h-6 sm:w-6 ${colorMap[color].text} flex items-center justify-center`}
            >
              {icon}
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 text-center">{content}</p>
        </div>
      </div>
    </div>
  );
};

export default function CorporateDashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [tenantData, setTenantData] = useState<CorporateTenant | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  // 段階的読み込みの状態
  const [loadingStage, setLoadingStage] = useState<'initial' | 'tenant' | 'complete'>('initial');

  // テナント情報取得
  const fetchTenantData = useCallback(async () => {
    if (!session?.user?.id) {
      return;
    }

    try {
      setLoadingStage('tenant');

      // タイムアウト処理
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      try {
        console.log('テナントデータ取得開始');

        const response = await fetch('/api/corporate/tenant', {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));

        if (response.ok) {
          const data = await response.json();
          setTenantData(data.tenant);
          setError(null);
          setUsingFallback(false);
        } else if (response.status === 404) {
          setError('テナント情報が見つかりません。');
          setUsingFallback(true);
          setTenantData({
            ...DEFAULT_TENANT,
            id: 'unknown-tenant',
          });
        } else if (response.status === 403) {
          setError('テナントへのアクセス権限がありません。');

          try {
            const errorData = await response.json();
            if (errorData && errorData.tenant) {
              setTenantData(errorData.tenant);
              setUsingFallback(false);
            }
          } catch (e) {
            console.error('エラーレスポンスの解析に失敗:', e);
          }
        } else {
          throw new Error(`APIエラー: ${response.status}`);
        }
      } catch (apiError) {
        console.error('API接続エラー:', apiError);

        setTenantData({
          ...DEFAULT_TENANT,
          id: 'error-fallback-tenant',
          name: '接続エラー - 基本情報のみ',
        });
        setUsingFallback(true);
        setError('サーバー接続エラー - 簡易表示モードを使用します');
      }
    } catch (error) {
      console.error('テナント情報取得エラー:', error);
      setTenantData({
        ...DEFAULT_TENANT,
        id: 'error-tenant',
      });
      setError('データ取得中にエラーが発生しました。');
      setUsingFallback(true);
    } finally {
      // isLoadingDataの代わりにloadingStageを使用
      setLoadingStage('complete');
    }
  }, [session]);

  // テナント情報を再取得する関数
  const reloadTenantData = useCallback(() => {
    // 読み込み状態をリセット
    setLoadingStage('initial');
    // 少し遅延させてからデータ取得を開始
    setTimeout(() => {
      fetchTenantData();
    }, 100);
  }, [fetchTenantData]);

  // 初回マウント時の実装
  useEffect(() => {
    if (session?.user?.id) {
      fetchTenantData();
    }
  }, [session, fetchTenantData]);

  // 段階的な読み込み表示
  if (loadingStage === 'initial') {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-2 text-gray-500">基本情報を読み込み中...</p>
        </div>
      </div>
    );
  }

  // テナント情報読み込み中（スケルトンUI表示）
  if (loadingStage === 'tenant' && !tenantData) {
    return (
      <div className="max-w-full px-1 sm:px-0">
        {/* テナント情報のスケルトンUI */}
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

        {/* メニューグリッドのスケルトンUI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mx-1 sm:mx-2 mb-4 sm:mb-5">
          {[1, 2, 3, 4].map((i) => (
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
      </div>
    );
  }

  // 読み込み完了 - 通常表示
  const displayTenant = tenantData || DEFAULT_TENANT;

  return (
    <div className="max-w-full px-1 sm:px-0">
      {/* フォールバック使用時の警告バナー（再試行ボタン付き） */}
      {usingFallback && (
        <RetryableWarningBanner
          message={error || 'テナント情報を取得できませんでした。基本機能のみ表示しています。'}
          onRetry={reloadTenantData}
        />
      )}

      {/* テナント概要 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 mb-4 sm:mb-5 mx-1 sm:mx-2">
        <CorporateBranding
          primaryColor={displayTenant.primaryColor || undefined}
          secondaryColor={displayTenant.secondaryColor || undefined}
          logoUrl={displayTenant.logoUrl}
          tenantName={displayTenant.name}
          headerText={`${displayTenant.name} ダッシュボード`}
          shadow={false}
          border={false}
          showLogo={false} // ヘッダーロゴを非表示に
        >
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="flex items-center mb-2 sm:mb-0">
              {displayTenant.logoUrl ? (
                <div className="rounded-full p-2 bg-gray-50 mr-3">
                  <Image
                    src={displayTenant.logoUrl}
                    alt={`${displayTenant.name}のロゴ`}
                    width={48}
                    height={48}
                    className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-contain"
                  />
                </div>
              ) : (
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-blue-100 flex items-center justify-center mr-3 p-2">
                  <HiOfficeBuilding className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
              )}
              <div>
                <h1 className="text-lg sm:text-xl font-bold break-words">{displayTenant.name}</h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  法人プラン: 最大{displayTenant.maxUsers}ユーザー
                </p>
              </div>
            </div>
          </div>
        </CorporateBranding>
      </div>

      {/* メニューグリッド */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mx-1 sm:mx-2 mb-4 sm:mb-5">
        {/* ユーザー管理 */}
        <MenuCard
          icon={<HiUsers className="h-5 w-5" />}
          title="ユーザー管理"
          content={`${displayTenant.userCount ?? displayTenant.users?.length ?? 0}/${displayTenant.maxUsers} ユーザー`}
          onClick={() => router.push('/dashboard/corporate/users')}
          color="blue"
        />

        {/* 部署管理 */}
        <MenuCard
          icon={<HiTemplate className="h-5 w-5" />}
          title="部署管理"
          content={`${displayTenant.departmentCount ?? displayTenant.departments?.length ?? 0} 部署`}
          onClick={() => router.push('/dashboard/corporate/departments')}
          color="green"
        />

        {/* 共通SNS設定 */}
        <MenuCard
          icon={<HiLink className="h-5 w-5" />}
          title="共通SNS設定"
          content="全社員共通のSNSリンク"
          onClick={() => router.push('/dashboard/corporate/sns')}
          color="indigo"
        />

        {/* ブランディング設定 */}
        <MenuCard
          icon={<HiColorSwatch className="h-5 w-5" />}
          title="ブランディング設定"
          content="ロゴと企業カラーの設定"
          onClick={() => router.push('/dashboard/corporate/branding')}
          color="purple"
        />

        {/* 設定 */}
        <MenuCard
          icon={<HiCog className="h-5 w-5" />}
          title="設定"
          content="法人アカウント設定"
          onClick={() => router.push('/dashboard/corporate/settings')}
          color="gray"
        />
      </div>

      {/* 最近の活動 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 mx-1 sm:mx-2">
        <h2 className="text-base sm:text-lg font-medium mb-2 sm:mb-3">最近の活動</h2>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 mx-1 sm:mx-2">
          <ActivityFeed limit={5} className="w-full" autoRefresh={true} />
        </div>
      </div>
    </div>
  );
}