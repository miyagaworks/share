// app/dashboard/corporate/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { HiOfficeBuilding, HiUsers, HiColorSwatch, HiTemplate } from 'react-icons/hi';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { DashboardCard } from '@/components/ui/DashboardCard';
import Image from 'next/image';

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
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [tenantData, setTenantData] = useState<CorporateTenant | null>(null);
  const [error, setError] = useState<string | null>(null);

  // テナント情報を取得
  useEffect(() => {
    const fetchTenantData = async () => {
      if (!session?.user?.id) return;

      try {
        setIsLoading(true);

        // テナント情報取得API（実装予定）
        const response = await fetch('/api/corporate/tenant');

        if (!response.ok) {
          throw new Error('テナント情報の取得に失敗しました');
        }

        const data = await response.json();
        setTenantData(data.tenant);
        setError(null);
      } catch (err) {
        console.error('テナント情報取得エラー:', err);
        setError('テナント情報を読み込めませんでした');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenantData();
  }, [session]);

  // 法人プランへのアクセス権がない場合のリダイレクト処理
  useEffect(() => {
    if (!isLoading && !tenantData && !error) {
      router.push('/dashboard');
    }
  }, [isLoading, tenantData, error, router]);

  // 読み込み中
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Spinner size="lg" />
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-red-800 mb-2">エラーが発生しました</h3>
        <p className="text-red-700">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          再読み込み
        </Button>
      </div>
    );
  }

  // テナントデータがない場合
  if (!tenantData) {
    return null; // リダイレクト中なので何も表示しない
  }

  // ページコンテンツ
  return (
    <div className="space-y-6">
      {/* テナント概要 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center mb-4">
          {tenantData.logoUrl ? (
            <Image
              src={tenantData.logoUrl}
              alt={`${tenantData.name}のロゴ`}
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
            <h1 className="text-2xl font-bold">{tenantData.name}</h1>
            <p className="text-sm text-gray-500">法人プラン: 最大{tenantData.maxUsers}ユーザー</p>
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
              {tenantData.users.length}/{tenantData.maxUsers} ユーザー
            </p>
          </div>
        </DashboardCard>

        {/* 部署管理 */}
        <DashboardCard
          title="部署管理"
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push('/dashboard/corporate/users')}
        >
          <div className="flex flex-col items-center p-4">
            <div className="bg-green-100 p-3 rounded-full mb-3">
              <HiTemplate className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-medium text-center">部署管理</h3>
            <p className="text-sm text-gray-500 text-center mt-1">
              {tenantData.departments.length} 部署
            </p>
          </div>
        </DashboardCard>

        {/* ブランディング設定 */}
        <DashboardCard
          title="ブランディング管理"
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push('/dashboard/corporate/users')}
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
              <svg
                className="h-6 w-6 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.678.413 1.566.417 2.572-.066z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
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
    </div>
  );
}