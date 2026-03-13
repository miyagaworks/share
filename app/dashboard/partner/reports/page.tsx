// app/dashboard/partner/reports/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import {
  HiChartBar,
  HiDownload,
  HiTrendingUp,
  HiTrendingDown,
  HiArrowRight,
} from 'react-icons/hi';
import toast from 'react-hot-toast';

interface MonthlyReport {
  year: number;
  month: number;
  totalAccountsStart: number;
  totalAccountsEnd: number;
  accountsChange: number;
  newTenants: number;
  newUsers: number;
  totalProfileViews: number;
  previousMonth: {
    totalAccountsEnd: number;
    newTenants: number;
    newUsers: number;
    totalProfileViews: number;
  } | null;
}

export default function PartnerReportsPage() {
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch('/api/partner/reports?months=6');
        if (!res.ok) throw new Error('レポートの取得に失敗しました');
        const data = await res.json();
        setReports(data.reports);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    }
    fetchReports();
  }, []);

  const handleExportCSV = async () => {
    try {
      const res = await fetch('/api/partner/reports?months=6&format=csv');
      if (!res.ok) throw new Error('CSVのエクスポートに失敗しました');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `partner-report.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('CSVをエクスポートしました');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'エクスポートに失敗しました');
    }
  };

  const formatChange = (current: number, previous: number | undefined) => {
    if (previous === undefined || previous === 0) return null;
    const diff = current - previous;
    const pct = Math.round((diff / previous) * 100);
    return { diff, pct };
  };

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

  const latestReport = reports[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">利用レポート</h1>
          <p className="text-gray-500">月次の利用状況を確認できます</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <HiDownload className="h-4 w-4" />
          CSV エクスポート
        </button>
      </div>

      {/* サマリーカード（最新月） */}
      {latestReport && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="月末アカウント数"
            value={latestReport.totalAccountsEnd}
            change={formatChange(
              latestReport.totalAccountsEnd,
              latestReport.previousMonth?.totalAccountsEnd,
            )}
          />
          <SummaryCard
            title="新規ユーザー"
            value={latestReport.newUsers}
            change={formatChange(
              latestReport.newUsers,
              latestReport.previousMonth?.newUsers,
            )}
          />
          <SummaryCard
            title="新規テナント"
            value={latestReport.newTenants}
            change={formatChange(
              latestReport.newTenants,
              latestReport.previousMonth?.newTenants,
            )}
          />
          <SummaryCard
            title="プロフィール閲覧数"
            value={latestReport.totalProfileViews}
            change={null}
          />
        </div>
      )}

      {/* アカウント数推移グラフ（シンプルなバーチャート） */}
      {reports.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <HiChartBar className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold">アカウント数推移</h2>
          </div>
          <div className="flex items-end gap-2 h-48">
            {[...reports].reverse().map((report) => {
              const maxVal = Math.max(...reports.map((r) => r.totalAccountsEnd), 1);
              const height = Math.max((report.totalAccountsEnd / maxVal) * 100, 4);
              return (
                <div
                  key={`${report.year}-${report.month}`}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <span className="text-xs font-medium text-gray-700">
                    {report.totalAccountsEnd}
                  </span>
                  <div
                    className="w-full bg-blue-500 rounded-t-md transition-all"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-xs text-gray-500">
                    {report.month}月
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 月別詳細テーブル */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">年月</th>
              <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">
                アカウント数
              </th>
              <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">増減</th>
              <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">
                新規テナント
              </th>
              <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">
                新規ユーザー
              </th>
              <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">
                閲覧数
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {reports.map((report) => (
              <tr key={`${report.year}-${report.month}`} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">
                  {report.year}年{report.month}月
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm text-gray-400">{report.totalAccountsStart}</span>
                  <HiArrowRight className="inline h-3 w-3 mx-1 text-gray-300" />
                  <span className="font-medium">{report.totalAccountsEnd}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span
                    className={`font-medium ${
                      report.accountsChange > 0
                        ? 'text-green-600'
                        : report.accountsChange < 0
                          ? 'text-red-600'
                          : 'text-gray-500'
                    }`}
                  >
                    {report.accountsChange > 0 ? '+' : ''}
                    {report.accountsChange}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">{report.newTenants}</td>
                <td className="px-6 py-4 text-right">{report.newUsers}</td>
                <td className="px-6 py-4 text-right">
                  {report.totalProfileViews.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  change,
}: {
  title: string;
  value: number;
  change: { diff: number; pct: number } | null;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
      <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      <div className="text-2xl font-bold">{value.toLocaleString()}</div>
      {change && (
        <div
          className={`flex items-center gap-1 mt-1 text-sm ${
            change.diff >= 0 ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {change.diff >= 0 ? (
            <HiTrendingUp className="h-4 w-4" />
          ) : (
            <HiTrendingDown className="h-4 w-4" />
          )}
          <span>
            {change.diff >= 0 ? '+' : ''}
            {change.diff} ({change.pct}%)
          </span>
          <span className="text-gray-400 ml-1">前月比</span>
        </div>
      )}
    </div>
  );
}
