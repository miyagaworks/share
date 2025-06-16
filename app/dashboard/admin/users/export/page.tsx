// app/dashboard/admin/users/export/page.tsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { HiDownload, HiArrowLeft, HiFilter, HiRefresh } from 'react-icons/hi';

// 並び替えのタイプ
type SortType =
  | 'created_asc'
  | 'created_desc'
  | 'nameKana_asc'
  | 'nameKana_desc'
  | 'email_asc'
  | 'email_desc'
  | 'grace_period';

// エクスポートフィルターの型定義
interface ExportFilters {
  planStatus: string[];
  startDate: string;
  endDate: string;
  searchTerm: string;
  sortType: SortType;
}

// ユーザー統計情報の型定義
interface UserStats {
  total: number;
  permanent: number;
  active: number;
  expired: number;
  trial: number;
  none: number;
}

export default function UserExportPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [previewCount, setPreviewCount] = useState<number>(0);

  const [exportFilters, setExportFilters] = useState<ExportFilters>({
    planStatus: [],
    startDate: '',
    endDate: '',
    searchTerm: '',
    sortType: 'grace_period',
  });

  // 管理者チェック
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!session?.user?.id) {
        router.push('/auth/signin');
        return;
      }
      try {
        const response = await fetch('/api/admin/access');
        const data = await response.json();
        if (data.isSuperAdmin) {
          setIsAdmin(true);
          fetchUserStats();
        } else {
          router.push('/dashboard');
        }
      } catch {
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    checkAdminAccess();
  }, [session, router]);

  // ユーザー統計情報の取得
  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        const users = data.users;

        const stats: UserStats = {
          total: users.length,
          permanent: users.filter((u: any) => u.isPermanentUser).length,
          active: users.filter((u: any) => u.subscription?.status === 'active').length,
          expired: users.filter((u: any) => u.isGracePeriodExpired).length,
          trial: users.filter((u: any) => u.trialEndsAt && !u.isGracePeriodExpired).length,
          none: users.filter((u: any) => !u.subscription && !u.trialEndsAt).length,
        };

        setUserStats(stats);
      }
    } catch (error) {
      console.error('ユーザー統計の取得に失敗:', error);
    }
  };

  // プレビュー件数の取得
  const fetchPreviewCount = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filters: exportFilters,
          preview: true, // プレビューモード
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewCount(data.count || 0);
      }
    } catch (error) {
      console.error('プレビュー件数の取得に失敗:', error);
    }
  }, [exportFilters]);

  // フィルター変更時にプレビュー件数を更新
  useEffect(() => {
    if (isAdmin) {
      fetchPreviewCount();
    }
  }, [exportFilters, isAdmin, fetchPreviewCount]);

  // エクスポート実行
  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch('/api/admin/users/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filters: exportFilters,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast.success(`${previewCount}件のユーザーデータをエクスポートしました`);
      } else {
        toast.error('エクスポートに失敗しました');
      }
    } catch {
      toast.error('エクスポート中にエラーが発生しました');
    } finally {
      setExporting(false);
    }
  };

  // フィルターリセット
  const resetFilters = () => {
    setExportFilters({
      planStatus: [],
      startDate: '',
      endDate: '',
      searchTerm: '',
      sortType: 'grace_period',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-2 text-gray-500">管理者権限を確認中...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="max-w-[90vw] mx-auto">
      {/* ヘッダー */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/admin/users')}
              className="mr-4"
            >
              <HiArrowLeft className="mr-2 h-4 w-4" />
              ユーザー管理に戻る
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <HiDownload className="mr-3 h-6 w-6 text-blue-600" />
                ユーザーデータエクスポート
              </h1>
              <p className="text-gray-600 mt-1">
                条件を指定してユーザーデータをCSV形式でエクスポートできます
              </p>
            </div>
          </div>
        </div>

        {/* ユーザー統計 */}
        {userStats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-900">{userStats.total}</div>
              <div className="text-sm text-gray-500">総ユーザー数</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-900">{userStats.permanent}</div>
              <div className="text-sm text-purple-600">永久利用権</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-900">{userStats.active}</div>
              <div className="text-sm text-green-600">有効サブスク</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-900">{userStats.expired}</div>
              <div className="text-sm text-red-600">猶予期間切れ</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-900">{userStats.trial}</div>
              <div className="text-sm text-blue-600">トライアル中</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-900">{userStats.none}</div>
              <div className="text-sm text-gray-500">プランなし</div>
            </div>
          </div>
        )}
      </div>

      {/* エクスポート設定 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-center mb-4">
          <HiFilter className="h-5 w-5 text-blue-600 mr-2" />
          <h2 className="text-lg font-medium">エクスポート条件設定</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* プラン状態の絞り込み */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              プラン状態で絞り込み
            </label>
            <div className="space-y-2">
              {[
                { value: 'permanent', label: '永久利用権', count: userStats?.permanent || 0 },
                { value: 'active', label: '有効サブスクリプション', count: userStats?.active || 0 },
                { value: 'expired', label: '猶予期間切れ', count: userStats?.expired || 0 },
                { value: 'trial', label: 'トライアル中', count: userStats?.trial || 0 },
                { value: 'none', label: 'プランなし', count: userStats?.none || 0 },
              ].map((option) => (
                <label key={option.value} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportFilters.planStatus.includes(option.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setExportFilters((prev) => ({
                            ...prev,
                            planStatus: [...prev.planStatus, option.value],
                          }));
                        } else {
                          setExportFilters((prev) => ({
                            ...prev,
                            planStatus: prev.planStatus.filter((s) => s !== option.value),
                          }));
                        }
                      }}
                      className="mr-3"
                    />
                    <span className="text-sm">{option.label}</span>
                  </div>
                  <span className="text-sm text-gray-500">({option.count}件)</span>
                </label>
              ))}
            </div>
          </div>

          {/* その他の条件 */}
          <div className="space-y-4">
            {/* 登録日期間 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">登録日期間</label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={exportFilters.startDate}
                  onChange={(e) =>
                    setExportFilters((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="開始日"
                />
                <input
                  type="date"
                  value={exportFilters.endDate}
                  onChange={(e) =>
                    setExportFilters((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="終了日"
                />
              </div>
            </div>

            {/* 検索条件 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">検索条件</label>
              <input
                type="text"
                value={exportFilters.searchTerm}
                onChange={(e) =>
                  setExportFilters((prev) => ({ ...prev, searchTerm: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="名前・メールアドレス"
              />
            </div>

            {/* 並び替え */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">並び替え</label>
              <select
                value={exportFilters.sortType}
                onChange={(e) =>
                  setExportFilters((prev) => ({ ...prev, sortType: e.target.value as SortType }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="grace_period">猶予期間切れ優先</option>
                <option value="created_desc">登録日 (新→古)</option>
                <option value="created_asc">登録日 (古→新)</option>
                <option value="nameKana_asc">フリガナ (ア→ワ)</option>
                <option value="nameKana_desc">フリガナ (ワ→ア)</option>
                <option value="email_asc">メール (A→Z)</option>
                <option value="email_desc">メール (Z→A)</option>
              </select>
            </div>
          </div>
        </div>

        {/* プレビューとアクション */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-50 px-4 py-2 rounded-lg">
                <span className="text-sm text-blue-600">
                  エクスポート対象: <strong>{previewCount}件</strong>
                </span>
              </div>
              <Button
                variant="outline"
                onClick={fetchPreviewCount}
                size="sm"
                className="flex items-center"
              >
                <HiRefresh className="mr-1 h-4 w-4" />
                件数更新
              </Button>
            </div>

            <div className="flex space-x-3">
              <Button variant="outline" onClick={resetFilters} disabled={exporting}>
                条件リセット
              </Button>
              <Button
                onClick={handleExport}
                disabled={exporting || previewCount === 0}
                className="flex items-center"
              >
                {exporting ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    エクスポート中...
                  </>
                ) : (
                  <>
                    <HiDownload className="mr-2 h-4 w-4" />
                    CSVエクスポート
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* エクスポート内容の説明 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium mb-3">エクスポートされるデータ</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-600">
          <div>• ユーザーID</div>
          <div>• ユーザー名</div>
          <div>• フリガナ</div>
          <div>• メールアドレス</div>
          <div>• 電話番号</div>
          <div>• 会社名</div>
          <div>• 登録日</div>
          <div>• 更新日</div>
          <div>• プラン状態</div>
          <div>• サブスクリプションプラン</div>
          <div>• サブスクリプション期限</div>
          <div>• トライアル期限</div>
          <div>• 永久利用権</div>
          <div>• 猶予期間切れ</div>
        </div>
        <p className="text-sm text-gray-500 mt-3">
          ※
          ファイルはUTF-8形式のCSVで出力されます。Excelで開く場合は文字化けしないよう注意してください。
        </p>
      </div>
    </div>
  );
}