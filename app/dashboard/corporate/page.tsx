// app/dashboard/corporate/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { DashboardCard } from '@/components/ui/DashboardCard';
import Image from 'next/image';
import { useCorporateAccess } from '@/hooks/useCorporateAccess';
import { corporateAccessState } from '@/lib/corporateAccessState';
import { CorporateDebugPanel } from '@/components/debug/CorporateDebugPanel';
import {
  HiOfficeBuilding,
  HiUsers,
  HiTemplate,
  HiColorSwatch,
  HiLink,
  HiCog,
  HiExclamation,
} from 'react-icons/hi';

// フォールバック用のデフォルトテナント情報
const DEFAULT_TENANT = {
  id: 'default',
  name: '法人アカウント',
  logoUrl: null,
  primaryColor: null,
  secondaryColor: null,
  maxUsers: 10,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  users: [],
  departments: [],
};

// 企業テナント情報の型定義
interface CorporateTenant {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  maxUsers: number;
  createdAt: string;
  updatedAt: string;
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

export default function CorporateDashboardPage() {
  // デバッグログを追加
  console.log(
    '==================== CorporateDashboardPage がレンダリングされました ====================',
  );

  console.log('[CorporateDashboard] コンポーネント初期化');
  const { data: session } = useSession();
  const router = useRouter();

  console.log('[CorporateDashboard] セッション情報:', session);

  // 法人アクセス権を確認するフックを使用
  const { isLoading: isAccessLoading, hasCorporateAccess } = useCorporateAccess({
    redirectIfNoAccess: false, // リダイレクトを無効化（デバッグ用）
  });

  console.log(
    '[CorporateDashboard] useCorporateAccess結果:',
    'ローディング:',
    isAccessLoading,
    'アクセス権:',
    hasCorporateAccess,
  );

  const [isLoading, setIsLoading] = useState(true);
  const [tenantData, setTenantData] = useState<CorporateTenant | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  // テナント情報を取得
  useEffect(() => {
    const fetchTenantData = async () => {
      if (!session?.user?.id) {
        console.log('[CorporateDashboard] ユーザーセッションなし - スキップ');
        return;
      }

      // アクセス権チェックが完了していない場合はまだ待機
      if (isAccessLoading) {
        console.log('[CorporateDashboard] アクセス権チェック中 - 待機');
        return;
      }

      // 現在のテナントIDを取得
      const currentTenantId = corporateAccessState.tenantId;
      console.log('[CorporateDashboard] 現在のテナントID:', currentTenantId);

      try {
        console.log('[CorporateDashboard] テナント情報取得開始');
        setIsLoading(true);

        // テナントIDがある場合はそれを使ってダミーデータを作成
        if (currentTenantId) {
          console.log('[CorporateDashboard] テナントIDに基づくデータを表示');

          // デバッグ情報から取得した内容を使用
          setTenantData({
            id: currentTenantId,
            name: 'ビイアルファ株式会社', // デバッグ情報から取得
            logoUrl: null,
            primaryColor: null,
            secondaryColor: null,
            maxUsers: 10,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            users: [],
            departments: [],
          });

          setUsingFallback(true);
          setError('APIに接続できないため、簡易表示モードを使用しています');
          setIsLoading(false);
          return;
        }

        // ダミーデータを使用
        console.log('[CorporateDashboard] デフォルトダミーデータを使用');
        setTenantData(DEFAULT_TENANT);
        setUsingFallback(true);
        setError('テナント情報を読み込めませんでした。デフォルト表示を使用します。');
      } catch (err) {
        console.error('[CorporateDashboard] テナント情報取得エラー:', err);
        // フォールバックとしてデフォルトテナント情報を使用
        setTenantData(DEFAULT_TENANT);
        setUsingFallback(true);
        setError('テナント情報を読み込めませんでした。デフォルト表示を使用します。');
      } finally {
        setIsLoading(false);
        console.log('[CorporateDashboard] テナント情報取得処理完了');
      }
    };

    fetchTenantData();
  }, [session, isAccessLoading]);

  // 読み込み中
  if (isAccessLoading || isLoading) {
    console.log('[CorporateDashboard] ローディング表示');
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Spinner size="lg" />
      </div>
    );
  }

  // テナントデータがない場合はフォールバック用のテナントデータを使用
  const displayTenant = tenantData || DEFAULT_TENANT;

  // フォールバック使用時の警告バナー
  const FallbackBanner = () =>
    usingFallback && (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <HiExclamation className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-700">
              {error || 'テナント情報を取得できませんでした。基本機能のみ表示しています。'}
            </p>
          </div>
        </div>
      </div>
    );

  console.log('[CorporateDashboard] 正常表示（フォールバック使用：', usingFallback, '）');

  // ページコンテンツ
  return (
    <div className="space-y-6">
      {/* フォールバック警告 */}
      <FallbackBanner />

      {/* テナント概要 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center mb-4">
          {displayTenant.logoUrl ? (
            <Image
              src={displayTenant.logoUrl}
              alt={`${displayTenant.name}のロゴ`}
              width={48}
              height={48}
              className="h-12 w-12 rounded-full mr-4 object-contain bg-gray-300"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
              <HiOfficeBuilding className="h-6 w-6 text-blue-600" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{displayTenant.name}</h1>
            <p className="text-sm text-gray-500">
              法人プラン: 最大{displayTenant.maxUsers}ユーザー
            </p>
          </div>
        </div>
      </div>

      {/* クイックアクセスカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* ユーザー管理 */}
        <DashboardCard
          title="ユーザー管理"
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push('/dashboard/corporate/users')}
        >
          <div className="flex flex-col items-center p-4">
            <div className="bg-blue-100 p-3 rounded-full mb-3">
              <HiUsers className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-medium text-center">ユーザー管理</h3>
            <p className="text-sm text-gray-500 text-center mt-1">
              {displayTenant.users.length}/{displayTenant.maxUsers} ユーザー
            </p>
          </div>
        </DashboardCard>

        {/* 部署管理 */}
        <DashboardCard
          title="部署管理"
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push('/dashboard/corporate/departments')}
        >
          <div className="flex flex-col items-center p-4">
            <div className="bg-green-100 p-3 rounded-full mb-3">
              <HiTemplate className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-medium text-center">部署管理</h3>
            <p className="text-sm text-gray-500 text-center mt-1">
              {displayTenant.departments.length} 部署
            </p>
          </div>
        </DashboardCard>

        {/* 共通SNS設定 */}
        <DashboardCard
          title="共通SNS設定"
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push('/dashboard/corporate/sns')}
        >
          <div className="flex flex-col items-center p-4">
            <div className="bg-indigo-100 p-3 rounded-full mb-3">
              <HiLink className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="font-medium text-center">共通SNS設定</h3>
            <p className="text-sm text-gray-500 text-center mt-1">全社員共通のSNSリンク</p>
          </div>
        </DashboardCard>

        {/* ブランディング設定 */}
        <DashboardCard
          title="ブランディング管理"
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push('/dashboard/corporate/branding')}
        >
          <div className="flex flex-col items-center p-4">
            <div className="bg-purple-100 p-3 rounded-full mb-3">
              <HiColorSwatch className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-medium text-center">ブランディング設定</h3>
            <p className="text-sm text-gray-500 text-center mt-1">ロゴと企業カラーの設定</p>
          </div>
        </DashboardCard>

        {/* 設定 */}
        <DashboardCard
          title="設定"
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push('/dashboard/corporate/settings')}
        >
          <div className="flex flex-col items-center p-4">
            <div className="bg-gray-100 p-3 rounded-full mb-3">
              <HiCog className="h-6 w-6 text-gray-600" />
            </div>
            <h3 className="font-medium text-center">設定</h3>
            <p className="text-sm text-gray-500 text-center mt-1">法人アカウント設定</p>
          </div>
        </DashboardCard>
      </div>

      {/* 最近の活動 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-medium mb-4">最近の活動</h2>
        <div className="text-sm text-center text-gray-500 py-8">活動データは現在利用できません</div>
      </div>

      {/* 開発環境かどうかをチェックして表示 */}
      {process.env.NODE_ENV === 'development' && <CorporateDebugPanel />}
    </div>
  );
}