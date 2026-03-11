// app/dashboard/admin/partners/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import {
  HiPlus,
  HiOfficeBuilding,
  HiUsers,
  HiGlobe,
  HiCheck,
  HiX,
} from 'react-icons/hi';

interface Partner {
  id: string;
  name: string;
  brandName: string;
  slug: string;
  plan: string;
  accountStatus: string;
  customDomain: string | null;
  domainVerified: boolean;
  totalAccounts: number;
  maxAccounts: number;
  totalTenants: number;
  createdAt: string;
}

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    brandName: '',
    slug: '',
    adminEmail: '',
    plan: 'basic',
  });
  const [creating, setCreating] = useState(false);

  const fetchPartners = async () => {
    try {
      const res = await fetch('/api/admin/partners');
      if (!res.ok) throw new Error('パートナー一覧の取得に失敗しました');
      const data = await res.json();
      setPartners(data.partners);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || '作成に失敗しました');
      }
      setShowCreateForm(false);
      setFormData({ name: '', brandName: '', slug: '', adminEmail: '', plan: 'basic' });
      await fetchPartners();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setCreating(false);
    }
  };

  const planLabels: Record<string, string> = {
    basic: 'ベーシック',
    pro: 'プロ',
    premium: 'プレミアム',
  };

  const statusLabels: Record<string, { label: string; color: string }> = {
    active: { label: '有効', color: 'bg-green-100 text-green-800' },
    trial: { label: 'トライアル', color: 'bg-blue-100 text-blue-800' },
    suspended: { label: '停止中', color: 'bg-red-100 text-red-800' },
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">パートナー管理</h1>
          <p className="text-gray-500">ホワイトラベルパートナーの管理</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <HiPlus className="h-4 w-4" />
          新規パートナー作成
        </button>
      </div>

      {/* 新規作成フォーム */}
      {showCreateForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">新規パートナー作成</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">企業名</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ブランド名（サービス名）
                </label>
                <input
                  type="text"
                  value={formData.brandName}
                  onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">スラッグ（URL識別子）</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例: print-company"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  管理者メールアドレス
                </label>
                <input
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">プラン</label>
                <select
                  value={formData.plan}
                  onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="basic">ベーシック（月額¥30,000 / 300アカウント）</option>
                  <option value="pro">プロ（月額¥50,000 / 600アカウント）</option>
                  <option value="premium">プレミアム（月額¥80,000 / 1,000アカウント）</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? '作成中...' : '作成'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      )}

      {/* パートナー一覧 */}
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      ) : partners.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <HiOfficeBuilding className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">パートナーがいません</h3>
          <p className="mt-1 text-gray-500">最初のパートナーを作成してください。</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">パートナー</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">プラン</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">ステータス</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">ドメイン</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">アカウント</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">テナント</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {partners.map((partner) => {
                const status = statusLabels[partner.accountStatus] || {
                  label: partner.accountStatus,
                  color: 'bg-gray-100 text-gray-800',
                };
                return (
                  <tr key={partner.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium">{partner.brandName}</div>
                        <div className="text-sm text-gray-500">{partner.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">{planLabels[partner.plan] || partner.plan}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {partner.customDomain ? (
                        <div className="flex items-center gap-1">
                          <HiGlobe className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{partner.customDomain}</span>
                          {partner.domainVerified ? (
                            <HiCheck className="h-4 w-4 text-green-500" />
                          ) : (
                            <HiX className="h-4 w-4 text-red-400" />
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">未設定</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <HiUsers className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {partner.totalAccounts} / {partner.maxAccounts}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{partner.totalTenants}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
