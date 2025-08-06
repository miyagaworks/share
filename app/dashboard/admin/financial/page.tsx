// app/dashboard/admin/financial/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Spinner } from '@/components/ui/Spinner';
import {
  HiCurrencyDollar,
  HiTrendingUp,
  HiTrendingDown,
  HiCreditCard,
  HiExclamationCircle,
  HiCheckCircle,
  HiInformationCircle,
  HiRefresh,
  HiCalendar,
  HiDocumentReport,
  HiUsers,
} from 'react-icons/hi';

interface FinancialDashboardData {
  currentMonth: {
    revenue: {
      total: number;
      growth: number;
      transactionCount: number;
      averageAmount: number;
    };
    fees: {
      total: number;
      percentage: number;
    };
    expenses: {
      company: number;
      contractors: number;
      total: number;
    };
    profit: {
      gross: number;
      net: number;
      margin: number;
    };
    allocations: {
      total: number;
      remaining: number;
    };
  };
  recentTransactions: Array<{
    id: string;
    type: 'stripe_revenue' | 'company_expense' | 'contractor_expense';
    title: string;
    amount: number;
    date: string;
    status?: string;
  }>;
  pendingApprovals: {
    companyExpenses: number;
    contractorExpenses: number;
    profitAllocations: number;
  };
  alerts: Array<{
    type: 'high_fees' | 'unusual_expense' | 'low_profit' | 'large_transaction';
    message: string;
    severity: 'info' | 'warning' | 'error';
    actionRequired: boolean;
  }>;
  period: {
    year: number;
    month: number;
  };
}

export default function FinancialDashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FinancialDashboardData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });
  const [refreshing, setRefreshing] = useState(false);

  // データ取得
  const fetchDashboardData = async (year: number, month: number) => {
    try {
      setRefreshing(true);
      const response = await fetch(`/api/admin/financial/dashboard?year=${year}&month=${month}`);
      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
      } else {
        console.error('財務ダッシュボードデータ取得失敗');
      }
    } catch (error) {
      console.error('財務ダッシュボードデータ取得エラー:', error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  // 権限チェックとデータロード
  useEffect(() => {
    const checkPermissionAndLoadData = async () => {
      if (!session?.user?.id) {
        router.push('/auth/signin');
        return;
      }

      try {
        // 権限チェック
        const accessResponse = await fetch('/api/admin/access');
        const accessData = await accessResponse.json();

        if (!accessData.isFinancialAdmin && !accessData.isSuperAdmin) {
          router.push('/dashboard');
          return;
        }

        // データ取得
        await fetchDashboardData(selectedPeriod.year, selectedPeriod.month);
      } catch (error) {
        console.error('権限チェックまたはデータ取得エラー:', error);
        router.push('/dashboard');
      }
    };

    checkPermissionAndLoadData();
  }, [session, router, selectedPeriod]);

  // 期間変更ハンドラ
  const handlePeriodChange = (year: number, month: number) => {
    setSelectedPeriod({ year, month });
    fetchDashboardData(year, month);
  };

  // 数値フォーマット関数
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-2 text-gray-500">財務データを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">財務ダッシュボードデータの取得に失敗しました</p>
      </div>
    );
  }

  // メトリクスカードコンポーネント
  const MetricCard = ({
    title,
    value,
    subtitle,
    icon,
    trend,
    color = 'blue',
  }: {
    title: string;
    value: string;
    subtitle?: string;
    icon: React.ReactNode;
    trend?: { value: number; label: string };
    color?: 'blue' | 'green' | 'red' | 'yellow';
  }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      red: 'bg-red-50 text-red-600 border-red-200',
      yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    };

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>{icon}</div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center">
            {trend.value >= 0 ? (
              <HiTrendingUp className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <HiTrendingDown className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span
              className={`text-sm font-medium ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {formatPercent(trend.value)}
            </span>
            <span className="text-sm text-gray-500 ml-1">{trend.label}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-lg p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <HiCurrencyDollar className="h-8 w-8 mr-3" />
            <div>
              <h1 className="text-2xl font-bold">財務ダッシュボード</h1>
              <p className="mt-1 opacity-90">
                {data.period.year}年{data.period.month}月の財務状況
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* 期間選択 */}
            <div className="flex items-center space-x-2">
              <HiCalendar className="h-5 w-5" />
              <select
                value={selectedPeriod.year}
                onChange={(e) => handlePeriodChange(parseInt(e.target.value), selectedPeriod.month)}
                className="bg-white/20 text-white rounded px-3 py-1 text-sm"
              >
                {[2024, 2025, 2026].map((year) => (
                  <option key={year} value={year} className="text-gray-900">
                    {year}
                  </option>
                ))}
              </select>
              <select
                value={selectedPeriod.month}
                onChange={(e) => handlePeriodChange(selectedPeriod.year, parseInt(e.target.value))}
                className="bg-white/20 text-white rounded px-3 py-1 text-sm"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={month} className="text-gray-900">
                    {month}月
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => fetchDashboardData(selectedPeriod.year, selectedPeriod.month)}
              disabled={refreshing}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              <HiRefresh className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>更新</span>
            </button>
          </div>
        </div>
      </div>

      {/* アラート */}
      {data.alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {data.alerts.map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg flex items-center space-x-3 ${
                alert.severity === 'error'
                  ? 'bg-red-50 border border-red-200'
                  : alert.severity === 'warning'
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-blue-50 border border-blue-200'
              }`}
            >
              {alert.severity === 'error' ? (
                <HiExclamationCircle className="h-5 w-5 text-red-600" />
              ) : alert.severity === 'warning' ? (
                <HiExclamationCircle className="h-5 w-5 text-yellow-600" />
              ) : (
                <HiInformationCircle className="h-5 w-5 text-blue-600" />
              )}
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    alert.severity === 'error'
                      ? 'text-red-800'
                      : alert.severity === 'warning'
                        ? 'text-yellow-800'
                        : 'text-blue-800'
                  }`}
                >
                  {alert.message}
                </p>
                {alert.actionRequired && (
                  <p className="text-xs text-gray-600 mt-1">対応が必要です</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* メトリクスカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="総売上"
          value={formatCurrency(data.currentMonth.revenue.total)}
          subtitle={`${data.currentMonth.revenue.transactionCount}件の取引`}
          icon={<HiCurrencyDollar className="h-6 w-6" />}
          trend={{
            value: data.currentMonth.revenue.growth,
            label: '前月比',
          }}
          color="green"
        />

        <MetricCard
          title="Stripe手数料"
          value={formatCurrency(data.currentMonth.fees.total)}
          subtitle={`${data.currentMonth.fees.percentage.toFixed(2)}%`}
          icon={<HiCreditCard className="h-6 w-6" />}
          color="red"
        />

        <MetricCard
          title="純利益"
          value={formatCurrency(data.currentMonth.profit.net)}
          subtitle={`利益率: ${data.currentMonth.profit.margin.toFixed(1)}%`}
          icon={<HiTrendingUp className="h-6 w-6" />}
          color={data.currentMonth.profit.net >= 0 ? 'green' : 'red'}
        />

        <MetricCard
          title="総経費"
          value={formatCurrency(data.currentMonth.expenses.total)}
          subtitle={`委託者: ${formatCurrency(data.currentMonth.expenses.company)}`}
          icon={<HiDocumentReport className="h-6 w-6" />}
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近の取引 */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold">最近の取引</h2>
          </div>
          <div className="p-6">
            {data.recentTransactions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">取引データがありません</p>
            ) : (
              <div className="space-y-4">
                {data.recentTransactions.slice(0, 8).map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          transaction.type === 'stripe_revenue'
                            ? 'bg-green-500'
                            : transaction.type === 'company_expense'
                              ? 'bg-red-500'
                              : 'bg-yellow-500'
                        }`}
                      ></div>
                      <div>
                        <p className="font-medium text-sm">{transaction.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.date).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-medium text-sm ${
                          transaction.type === 'stripe_revenue' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {transaction.type === 'stripe_revenue' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </p>
                      {transaction.status && (
                        <p className="text-xs text-gray-500">{transaction.status}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 承認待ち */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold">承認待ち</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <HiExclamationCircle className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium">委託者経費</span>
                </div>
                <span className="bg-yellow-100 text-yellow-800 text-sm px-2 py-1 rounded-full">
                  {data.pendingApprovals.companyExpenses}件
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <HiExclamationCircle className="h-5 w-5 text-orange-600" />
                  <span className="font-medium">受託者経費</span>
                </div>
                <span className="bg-orange-100 text-orange-800 text-sm px-2 py-1 rounded-full">
                  {data.pendingApprovals.contractorExpenses}件
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <HiInformationCircle className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">利益分配調整</span>
                </div>
                <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
                  {data.pendingApprovals.profitAllocations}件
                </span>
              </div>
            </div>

            {data.pendingApprovals.companyExpenses + data.pendingApprovals.contractorExpenses ===
              0 && (
              <div className="text-center py-4">
                <HiCheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-green-600 font-medium">承認待ちはありません</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* クイックアクション */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">クイックアクション</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push('/dashboard/admin/company-expenses')}
            className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <HiDocumentReport className="h-6 w-6 text-blue-600 mb-2" />
            <h3 className="font-medium">経費管理</h3>
            <p className="text-sm text-gray-600">委託者経費の登録・管理</p>
          </button>

          <button
            onClick={() => router.push('/dashboard/admin/stripe/revenue')}
            className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <HiCurrencyDollar className="h-6 w-6 text-green-600 mb-2" />
            <h3 className="font-medium">売上管理</h3>
            <p className="text-sm text-gray-600">売上データの取得・分析・同期設定</p>
          </button>

          <button
            onClick={() => router.push('/dashboard/admin/contractor-payments')}
            className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <HiUsers className="h-6 w-6 text-purple-600 mb-2" />
            <h3 className="font-medium">受託者支払い管理</h3>
            <p className="text-sm text-gray-600">月次利益配分と受託者支払い管理</p>
          </button>
        </div>
      </div>
    </div>
  );
}