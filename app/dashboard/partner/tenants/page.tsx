// app/dashboard/partner/tenants/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { HiPlus, HiOfficeBuilding, HiUsers } from 'react-icons/hi';
import Link from 'next/link';

interface Tenant {
  id: string;
  name: string;
  accountStatus: string;
  userCount: number;
  createdAt: string;
}

export default function PartnerTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTenants() {
      try {
        const res = await fetch('/api/partner/tenants');
        if (!res.ok) throw new Error('テナント一覧の取得に失敗しました');
        const data = await res.json();
        setTenants(data.tenants);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    }
    fetchTenants();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">テナント管理</h1>
          <p className="text-gray-500">顧客企業のテナントを管理します</p>
        </div>
        <Link
          href="/dashboard/partner/tenants/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <HiPlus className="h-4 w-4" />
          新規テナント作成
        </Link>
      </div>

      {tenants.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <HiOfficeBuilding className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">テナントがありません</h3>
          <p className="mt-1 text-gray-500">最初のテナントを作成してください。</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                  テナント名
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                  ステータス
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                  ユーザー数
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">作成日</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <HiOfficeBuilding className="h-5 w-5 text-gray-400" />
                      <span className="font-medium">{tenant.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tenant.accountStatus === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {tenant.accountStatus === 'active' ? '有効' : tenant.accountStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <HiUsers className="h-4 w-4 text-gray-400" />
                      <span>{tenant.userCount}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(tenant.createdAt).toLocaleDateString('ja-JP')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
