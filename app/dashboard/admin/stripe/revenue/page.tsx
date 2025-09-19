// app/dashboard/admin/stripe/revenue/page.tsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from 'react-hot-toast';
import {
  HiCurrencyDollar,
  HiTrendingUp,
  HiDownload,
  HiRefresh,
  HiCalendar,
  HiEye,
  HiCheckCircle,
  HiExclamationCircle,
  HiInformationCircle,
  HiCreditCard,
  HiLightningBolt,
  HiCog,
  HiChartBar,
  HiClock,
  HiPlay,
  HiStop,
  HiArrowLeft,
  HiArrowRight,
} from 'react-icons/hi';

// 型定義
interface RevenueTransaction {
  transactionId: string;
  amount: number;
  currency: string;
  status: string;
  customerEmail?: string;
  description?: string;
  transactionDate: string;
  stripeFeeAmount: number;
  netAmount: number;
  subscriptionType?: string;
  planName?: string;
}

interface RevenueSummary {
  totalAmount: number;
  totalFees: number;
  netAmount: number;
  transactionCount: number;
  averageAmount: number;
  feePercentage: number;
  period: {
    startDate: Date;
    endDate: Date;
  };
}

interface PlanAnalysis {
  [planType: string]: {
    count: number;
    totalAmount: number;
    percentage: number;
  };
}

interface RevenueData {
  transactions: RevenueTransaction[];
  summary: RevenueSummary;
  planAnalysis: PlanAnalysis;
  totalCount: number;
}

interface SyncSettings {
  stripeAutoSync: boolean;
  syncFrequency: string;
  lastSyncAt: string | null;
  defaultStripeFeeRate: number;
  notifyOnLargeTransaction: boolean;
  largeTransactionThreshold: number;
}

interface MonthlyData {
  period: { year: number; month: number };
  stripeData: RevenueData;
  existingData: {
    count: number;
    hasData: boolean;
  };
}

export default function StripeRevenueManagementPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // タブ状態
  const [activeTab, setActiveTab] = useState<'monthly' | 'custom' | 'settings'>('monthly');

  // データ状態
  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);
  const [previewData, setPreviewData] = useState<RevenueData | null>(null);
  const [syncSettings, setSyncSettings] = useState<SyncSettings | null>(null);

  // 期間選択状態
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  // カスタム期間状態
  const [customRange, setCustomRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  // 権限チェック
  const checkPermission = useCallback(async () => {
    if (!session?.user?.id) {
      router.push('/auth/signin');
      return;
    }

    try {
      // 🔧 修正: 正しいAPIパスとレスポンス形式を使用
      const response = await fetch('/api/admin/access');
      const data = await response.json();

      // スーパー管理者または財務管理者の場合アクセス許可
      if (data.isSuperAdmin || data.isFinancialAdmin || data.permissions?.canViewFinancialData) {
        setHasPermission(true);
        // 初期データ読み込み
        await Promise.all([
          loadMonthlyData(selectedPeriod.year, selectedPeriod.month),
          loadSyncSettings(),
        ]);
      } else {
        toast.error('財務管理者権限が必要です');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('権限チェックエラー:', error);
      toast.error('権限の確認に失敗しました');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, router, selectedPeriod.year, selectedPeriod.month]);

  // 月次データ読み込み
  const loadMonthlyData = async (year: number, month: number) => {
    try {
      const response = await fetch(`/api/admin/stripe/revenue?year=${year}&month=${month}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setMonthlyData(data.data);
      } else {
        throw new Error(data.error || '月次データの取得に失敗しました');
      }
    } catch (error: any) {
      console.error('月次データ読み込みエラー:', error);
      toast.error(error.message || '月次データの取得に失敗しました');
    }
  };

  // 同期設定読み込み
  const loadSyncSettings = async () => {
    try {
      const response = await fetch('/api/admin/stripe/settings');
      const data = await response.json();

      if (response.ok && data.success) {
        setSyncSettings(data.settings);
      } else {
        throw new Error(data.error || '同期設定の取得に失敗しました');
      }
    } catch (error: any) {
      console.error('同期設定読み込みエラー:', error);
      toast.error(error.message || '同期設定の取得に失敗しました');
    }
  };

  // データプレビュー
  const handlePreview = async (isCustom: boolean = false) => {
    try {
      setActionLoading(true);
      setPreviewData(null);

      const requestData = isCustom
        ? {
            startDate: customRange.startDate,
            endDate: customRange.endDate,
            preview: true,
          }
        : {
            startDate: new Date(selectedPeriod.year, selectedPeriod.month - 1, 1).toISOString(),
            endDate: new Date(
              selectedPeriod.year,
              selectedPeriod.month,
              0,
              23,
              59,
              59,
            ).toISOString(),
            preview: true,
          };

      const response = await fetch('/api/admin/stripe/revenue/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setPreviewData(result.data);
        toast.success('プレビューデータを取得しました');
      } else {
        throw new Error(result.error || 'プレビューの取得に失敗しました');
      }
    } catch (error: any) {
      console.error('プレビューエラー:', error);
      toast.error(error.message || 'プレビューの取得に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  // データ保存
  const handleSaveData = async (isCustom: boolean = false) => {
    try {
      setActionLoading(true);

      const requestData = isCustom
        ? {
            startDate: customRange.startDate,
            endDate: customRange.endDate,
            preview: false,
          }
        : {
            startDate: new Date(selectedPeriod.year, selectedPeriod.month - 1, 1).toISOString(),
            endDate: new Date(
              selectedPeriod.year,
              selectedPeriod.month,
              0,
              23,
              59,
              59,
            ).toISOString(),
            preview: false,
          };

      const response = await fetch('/api/admin/stripe/revenue/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        toast.success(result.message);
        setPreviewData(null);

        // 月次データを再取得
        if (!isCustom) {
          await loadMonthlyData(selectedPeriod.year, selectedPeriod.month);
        }
      } else {
        throw new Error(result.error || 'データの保存に失敗しました');
      }
    } catch (error: any) {
      console.error('データ保存エラー:', error);
      toast.error(error.message || 'データの保存に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  // 同期設定の更新
  const handleUpdateSettings = async (newSettings: Partial<SyncSettings>) => {
    try {
      setActionLoading(true);
      const response = await fetch('/api/admin/stripe/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setSyncSettings({ ...syncSettings!, ...newSettings });
        toast.success('設定を更新しました');
      } else {
        throw new Error(result.error || '設定の更新に失敗しました');
      }
    } catch (error: any) {
      console.error('設定更新エラー:', error);
      toast.error(error.message || '設定の更新に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  // 月変更
  const changeMonth = (direction: number) => {
    const newDate = new Date(selectedPeriod.year, selectedPeriod.month - 1 + direction);
    setSelectedPeriod({
      year: newDate.getFullYear(),
      month: newDate.getMonth() + 1,
    });
  };

  // 通貨フォーマット
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  // 初期化
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  // 月次データの再読み込み
  useEffect(() => {
    if (hasPermission && activeTab === 'monthly') {
      loadMonthlyData(selectedPeriod.year, selectedPeriod.month);
    }
  }, [selectedPeriod, hasPermission, activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <HiExclamationCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">アクセス権限がありません</h2>
          <p className="text-gray-600">財務管理者権限が必要です。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl p-8 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <HiLightningBolt className="h-10 w-10" />
            <div>
              <h1 className="text-3xl font-bold">売上管理</h1>
              <p className="text-blue-100 mt-2">売上データの取得・分析・同期設定を一元管理</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <HiCreditCard className="h-5 w-5" />
                <span className="text-sm font-medium">Stripe連携</span>
              </div>
            </div>
            <button
              onClick={() => {
                if (activeTab === 'monthly') {
                  loadMonthlyData(selectedPeriod.year, selectedPeriod.month);
                } else if (activeTab === 'settings') {
                  loadSyncSettings();
                }
              }}
              disabled={loading}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <HiRefresh className="h-5 w-5" />
              <span>更新</span>
            </button>
          </div>
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('monthly')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'monthly'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <HiCalendar className="h-5 w-5" />
                <span>月次売上管理</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'custom'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <HiChartBar className="h-5 w-5" />
                <span>カスタム期間分析</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <HiCog className="h-5 w-5" />
                <span>同期設定</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* 月次売上管理 */}
      {activeTab === 'monthly' && (
        <div className="space-y-8">
          {/* 月選択 */}
          <div className="flex items-center justify-center space-x-6">
            <button
              onClick={() => changeMonth(-1)}
              className="p-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <HiArrowLeft className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-3 bg-white px-8 py-4 rounded-xl border shadow-sm">
              <HiCalendar className="h-6 w-6 text-gray-500" />
              <span className="text-2xl font-bold text-gray-900">
                {selectedPeriod.year}年{selectedPeriod.month}月
              </span>
            </div>
            <button
              onClick={() => changeMonth(1)}
              className="p-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <HiArrowRight className="h-6 w-6" />
            </button>
          </div>

          {monthlyData ? (
            <div className="space-y-8">
              {/* 月次サマリー */}
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">月次サマリー</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(monthlyData.stripeData.summary.totalAmount)}
                    </div>
                    <div className="text-sm text-gray-500">総売上</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(monthlyData.stripeData.summary.totalFees)}
                    </div>
                    <div className="text-sm text-gray-500">手数料</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(monthlyData.stripeData.summary.netAmount)}
                    </div>
                    <div className="text-sm text-gray-500">純売上</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {monthlyData.stripeData.summary.transactionCount}
                    </div>
                    <div className="text-sm text-gray-500">取引数</div>
                  </div>
                </div>
              </div>

              {/* 操作ボタン */}
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => handlePreview(false)}
                  disabled={actionLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 disabled:opacity-50"
                >
                  <HiEye className="h-5 w-5" />
                  <span>プレビュー</span>
                </button>
                <button
                  onClick={() => handleSaveData(false)}
                  disabled={actionLoading}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 disabled:opacity-50"
                >
                  <HiCheckCircle className="h-5 w-5" />
                  <span>データ保存</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border shadow-sm p-8 text-center">
              <HiInformationCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">データがありません</h3>
              <p className="text-gray-500 mb-6">この月の売上データを取得してください。</p>
              <button
                onClick={() => handlePreview(false)}
                disabled={actionLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto disabled:opacity-50"
              >
                <HiEye className="h-5 w-5" />
                <span>プレビュー</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* カスタム期間分析 */}
      {activeTab === 'custom' && (
        <div className="space-y-8">
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">期間設定</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">開始日</label>
                <input
                  type="date"
                  value={customRange.startDate}
                  onChange={(e) => setCustomRange({ ...customRange, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">終了日</label>
                <input
                  type="date"
                  value={customRange.endDate}
                  onChange={(e) => setCustomRange({ ...customRange, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => handlePreview(true)}
                disabled={actionLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 disabled:opacity-50"
              >
                <HiEye className="h-5 w-5" />
                <span>プレビュー</span>
              </button>
              <button
                onClick={() => handleSaveData(true)}
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 disabled:opacity-50"
              >
                <HiCheckCircle className="h-5 w-5" />
                <span>データ保存</span>
              </button>
            </div>
          </div>

          {/* プレビューデータ表示 */}
          {previewData && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">プレビュー結果</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(previewData.summary.totalAmount)}
                    </div>
                    <div className="text-sm text-gray-500">総売上</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(previewData.summary.totalFees)}
                    </div>
                    <div className="text-sm text-gray-500">手数料</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(previewData.summary.netAmount)}
                    </div>
                    <div className="text-sm text-gray-500">純売上</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {previewData.summary.transactionCount}
                    </div>
                    <div className="text-sm text-gray-500">取引数</div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                  <p className="text-amber-800 text-sm">
                    <strong>注意:</strong> プレビューデータはデータベースに保存されていません。
                    保存ボタンをクリックして実際にデータを保存してください。
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 同期設定 */}
      {activeTab === 'settings' && syncSettings && (
        <div className="space-y-8">
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="p-6 border-b">
              <h3 className="text-lg font-bold text-gray-900">自動同期設定</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-base font-medium text-gray-900">自動同期</label>
                  <p className="text-sm text-gray-500">Stripeデータの自動同期を有効にする</p>
                </div>
                <button
                  onClick={() =>
                    handleUpdateSettings({
                      stripeAutoSync: !syncSettings.stripeAutoSync,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    syncSettings.stripeAutoSync ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      syncSettings.stripeAutoSync ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">同期頻度</label>
                <select
                  value={syncSettings.syncFrequency}
                  onChange={(e) => handleUpdateSettings({ syncFrequency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="daily">毎日</option>
                  <option value="weekly">毎週</option>
                  <option value="manual">手動のみ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  デフォルト手数料率 (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={syncSettings.defaultStripeFeeRate}
                  onChange={(e) =>
                    handleUpdateSettings({
                      defaultStripeFeeRate: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  大額取引の通知閾値 (円)
                </label>
                <input
                  type="number"
                  min="0"
                  value={syncSettings.largeTransactionThreshold}
                  onChange={(e) =>
                    handleUpdateSettings({
                      largeTransactionThreshold: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-base font-medium text-gray-900">大額取引通知</label>
                  <p className="text-sm text-gray-500">閾値を超える取引の通知を有効にする</p>
                </div>
                <button
                  onClick={() =>
                    handleUpdateSettings({
                      notifyOnLargeTransaction: !syncSettings.notifyOnLargeTransaction,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    syncSettings.notifyOnLargeTransaction ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      syncSettings.notifyOnLargeTransaction ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {syncSettings.lastSyncAt && (
                <div className="pt-4 border-t">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <HiClock className="h-4 w-4" />
                    <span>
                      最終同期: {new Date(syncSettings.lastSyncAt).toLocaleString('ja-JP')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ローディング表示 */}
      {actionLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
            <Spinner size="md" />
            <span className="text-gray-900">処理中...</span>
          </div>
        </div>
      )}
    </div>
  );
}