// app/dashboard/partner/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Spinner } from '@/components/ui/Spinner';
import { HiOfficeBuilding, HiUsers, HiUserAdd, HiEye } from 'react-icons/hi';

interface PartnerDashboardData {
  partner: {
    name: string;
    brandName: string;
    plan: string;
    accountStatus: string;
  };
  stats: {
    totalTenants: number;
    totalAccounts: number;
    maxAccounts: number;
    newUsersThisMonth: number;
    totalProfileViews: number;
  };
  warningLevel: 'normal' | 'warning' | 'critical';
}

export default function PartnerDashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<PartnerDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/partner/dashboard');
        if (!res.ok) {
          throw new Error('データの取得に失敗しました');
        }
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-500">読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const accountRatio = data.stats.totalAccounts / data.stats.maxAccounts;
  const planLabels: Record<string, string> = {
    basic: 'ベーシック',
    pro: 'プロ',
    premium: 'プレミアム',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">パートナーダッシュボード</h1>
          <p className="text-gray-500">
            {data.partner.brandName} ({planLabels[data.partner.plan] || data.partner.plan}プラン)
          </p>
        </div>
      </div>

      {/* アカウント上限警告バナー */}
      {data.warningLevel !== 'normal' && (
        <div
          className={`rounded-lg p-4 ${
            data.warningLevel === 'critical'
              ? 'bg-red-50 border border-red-200'
              : 'bg-yellow-50 border border-yellow-200'
          }`}
        >
          <p
            className={`font-medium ${
              data.warningLevel === 'critical' ? 'text-red-800' : 'text-yellow-800'
            }`}
          >
            {data.warningLevel === 'critical'
              ? `アカウント数が上限に近づいています (${data.stats.totalAccounts}/${data.stats.maxAccounts})。プランのアップグレードをご検討ください。`
              : `アカウント数が上限の80%を超えています (${data.stats.totalAccounts}/${data.stats.maxAccounts})。`}
          </p>
        </div>
      )}

      {/* KPIカード */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* アカウント数 */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <div className="flex items-center gap-2 mb-2">
            <HiUsers className="h-5 w-5 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-500">アカウント数</h3>
          </div>
          <div className="text-2xl font-bold">
            {data.stats.totalAccounts}
            <span className="text-sm font-normal text-gray-400 ml-1">
              / {data.stats.maxAccounts}
            </span>
          </div>
          {/* プログレスバー */}
          <div className="mt-2 w-full bg-gray-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                accountRatio >= 0.9
                  ? 'bg-red-500'
                  : accountRatio >= 0.8
                    ? 'bg-yellow-500'
                    : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(accountRatio * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* テナント数 */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <div className="flex items-center gap-2 mb-2">
            <HiOfficeBuilding className="h-5 w-5 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-500">テナント数</h3>
          </div>
          <div className="text-2xl font-bold">{data.stats.totalTenants}</div>
        </div>

        {/* 今月の新規ユーザー */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <div className="flex items-center gap-2 mb-2">
            <HiUserAdd className="h-5 w-5 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-500">今月の新規ユーザー</h3>
          </div>
          <div className="text-2xl font-bold">{data.stats.newUsersThisMonth}</div>
        </div>

        {/* プロフィール閲覧数 */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <div className="flex items-center gap-2 mb-2">
            <HiEye className="h-5 w-5 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-500">プロフィール閲覧数</h3>
          </div>
          <div className="text-2xl font-bold">{data.stats.totalProfileViews}</div>
        </div>
      </div>
    </div>
  );
}
