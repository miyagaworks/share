// app/dashboard/corporate/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useCorporateAccess } from '@/hooks/useCorporateAccess';
import { corporateAccessState } from '@/lib/corporateAccessState';
import { CorporateDebugPanel } from '@/components/debug/CorporateDebugPanel';

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

// ローディングスピナー
const Spinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClass = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }[size];

  return (
    <div className="flex justify-center items-center">
      <div
        className={`${sizeClass} animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent`}
      />
    </div>
  );
};

// フォールバック用のデフォルトテナント情報
const DEFAULT_TENANT = {
  id: 'default',
  name: '未登録',
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

// 警告バナーコンポーネント
const WarningBanner = ({ message }: { message: string }) => (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 mx-2">
    <div className="flex items-start">
      <HiExclamation className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm text-yellow-700">{message}</p>
      </div>
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
  },
  green: {
    bg: 'bg-green-100',
    text: 'text-green-600',
  },
  indigo: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-600',
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-600',
  },
  gray: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
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
  content: string;
  onClick: () => void;
  color?: CardColor;
}) => {
  return (
    <div
      className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden cursor-pointer transform transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
      onClick={onClick}
    >
      <div className="border-b border-gray-200 px-2 sm:px-4 py-2 sm:py-3">
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

  // 法人アクセス権を確認するフックを使用
  const { isLoading: isAccessLoading } = useCorporateAccess({
    redirectIfNoAccess: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [tenantData, setTenantData] = useState<CorporateTenant | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  // テナント情報を取得
  useEffect(() => {
    const fetchTenantData = async () => {
      if (!session?.user?.id) {
        return;
      }

      // アクセス権チェックが完了していない場合はまだ待機
      if (isAccessLoading) {
        return;
      }

      // 現在のテナントIDを取得
      const currentTenantId = corporateAccessState.tenantId;

      try {
        setIsLoading(true);

        // テナントIDがある場合はAPIからデータを取得
        if (currentTenantId) {
          try {
            const response = await fetch('/api/corporate/tenant');

            if (response.ok) {
              const data = await response.json();
              setTenantData(data.tenant);
              setError(null);
              setUsingFallback(false);
            } else {
              throw new Error('API接続エラー: ' + response.status);
            }
          } catch (error) {
            console.error('API接続エラー:', error);
            // エラー時のみフォールバック処理
            setTenantData({
              id: currentTenantId,
              name: '未登録',
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
          }
          return;
        }

        // ダミーデータを使用
        setTenantData(DEFAULT_TENANT);
        setUsingFallback(true);
        setError('テナント情報を読み込めませんでした。デフォルト表示を使用します。');
      } catch (error) {
        console.error('テナント情報取得エラー:', error);
        // フォールバックとしてデフォルトテナント情報を使用
        setTenantData(DEFAULT_TENANT);
        setUsingFallback(true);
        setError('テナント情報を読み込めませんでした。デフォルト表示を使用します。');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenantData();
  }, [session, isAccessLoading]);

  // 読み込み中
  if (isAccessLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Spinner size="lg" />
      </div>
    );
  }

  // テナントデータがない場合はフォールバック用のテナントデータを使用
  const displayTenant = tenantData || DEFAULT_TENANT;

  return (
    <div className="max-w-full px-1 sm:px-0">
      {/* フォールバック使用時の警告バナー */}
      {usingFallback && (
        <WarningBanner
          message={error || 'テナント情報を取得できませんでした。基本機能のみ表示しています。'}
        />
      )}

      {/* テナント概要 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 mb-4 sm:mb-5 mx-1 sm:mx-2">
        <div className="flex flex-col sm:flex-row sm:items-center">
          <div className="flex items-center mb-2 sm:mb-0">
            {displayTenant.logoUrl ? (
              <Image
                src={displayTenant.logoUrl}
                alt={`${displayTenant.name}のロゴ`}
                width={48}
                height={48}
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full mr-3 object-contain bg-gray-300"
              />
            ) : (
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-blue-100 flex items-center justify-center mr-3">
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
      </div>

      {/* メニューグリッド */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mx-1 sm:mx-2 mb-4 sm:mb-5">
        {/* ユーザー管理 */}
        <MenuCard
          icon={<HiUsers className="h-5 w-5" />}
          title="ユーザー管理"
          content={`${displayTenant.users.length}/${displayTenant.maxUsers} ユーザー`}
          onClick={() => router.push('/dashboard/corporate/users')}
          color="blue"
        />

        {/* 部署管理 */}
        <MenuCard
          icon={<HiTemplate className="h-5 w-5" />}
          title="部署管理"
          content={`${displayTenant.departments.length} 部署`}
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
        <div className="text-xs sm:text-sm text-center text-gray-500 py-4 sm:py-6">
          活動データは現在利用できません
        </div>
      </div>

      {/* 開発環境かどうかをチェックして表示 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 sm:mt-5 mx-1 sm:mx-2 mb-16">
          <details className="bg-gray-50 border border-gray-200 rounded-lg">
            <summary className="px-4 py-2 text-sm font-medium cursor-pointer">
              開発者ツール - 法人アクセス情報
            </summary>
            <div className="p-4 border-t border-gray-200">
              <CorporateDebugPanel />
            </div>
          </details>
        </div>
      )}
    </div>
  );
}