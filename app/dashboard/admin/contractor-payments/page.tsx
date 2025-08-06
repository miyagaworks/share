// app/dashboard/admin/contractor-payments/page.tsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from 'react-hot-toast';
import {
  HiCurrencyDollar,
  HiUsers,
  HiCalendar,
  HiCheckCircle,
  HiClock,
  HiExclamationCircle,
  HiTrendingUp,
  HiDocumentText,
  HiAdjustments,
  HiRefresh,
  HiEye,
  HiCheck,
  HiX,
  HiInformationCircle,
  HiArrowLeft,
  HiArrowRight,
  HiDownload,
  HiChartBar,
} from 'react-icons/hi';
import { getPagePermissions, ReadOnlyBanner } from '@/lib/utils/admin-permissions';

// AdminAccess型定義
interface AdminAccess {
  isSuperAdmin: boolean;
  isFinancialAdmin: boolean;
  adminLevel: 'super' | 'financial' | 'none';
}

// 型定義（lib/profit-allocation.tsと一致）
interface ContractorAllocation {
  contractorId: string;
  name: string;
  email: string;
  originalPercent: number;
  adjustedPercent: number;
  allocationAmount: number;
  expenseReimbursement: number;
  totalPayment: number;
  adjustmentReason?: string;
}

interface ProfitAllocation {
  year: number;
  month: number;
  totalRevenue: number;
  totalFees: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  totalContractorShare: number;
  companyShare: number;
  contractors: {
    yoshitsune: ContractorAllocation;
    kensei: ContractorAllocation;
  };
  hasAdjustments: boolean;
  adjustments: any[];
  status: 'draft' | 'finalized' | 'paid';
  finalizedAt?: string;
  paidAt?: string;
}

interface SettlementData {
  allocation: ProfitAllocation;
  pendingAdjustments: number;
  canFinalize: boolean;
  canMarkPaid: boolean;
}

interface AdjustmentRequest {
  adjustmentType: 'self_reduction' | 'admin_proposal' | 'peer_proposal';
  targetPerson: 'yoshitsune' | 'kensei';
  adjustedPercent: number;
  reason: string;
}

export default function ContractorPaymentsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminAccess, setAdminAccess] = useState<AdminAccess | null>(null);
  const [data, setData] = useState<SettlementData | null>(null);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [actionLoading, setActionLoading] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState<AdjustmentRequest>({
    adjustmentType: 'admin_proposal',
    targetPerson: 'yoshitsune',
    adjustedPercent: 30,
    reason: '',
  });

  // 🔧 修正: 財務管理者も許可する権限チェック
  const checkPermissions = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/api/admin/access');
      if (response.ok) {
        const accessData = await response.json();

        // スーパー管理者または財務管理者の場合アクセス許可
        if (accessData.adminLevel !== 'none') {
          setAdminAccess({
            isSuperAdmin: accessData.isSuperAdmin,
            isFinancialAdmin: accessData.isFinancialAdmin,
            adminLevel: accessData.adminLevel,
          });
        } else {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error('権限チェックエラー:', error);
      router.push('/dashboard');
    }
  }, [session?.user?.id, router]);

  // 🆕 権限設定の取得
  const permissions = adminAccess
    ? getPagePermissions(
        adminAccess.isSuperAdmin ? 'admin' : 'financial-admin',
        'contractor-payments',
      )
    : { canView: false, canEdit: false, canDelete: false, canCreate: false };

  // 月次精算データの取得（計画書準拠の統合実装）
  const loadSettlementData = useCallback(async () => {
    if (!adminAccess) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/monthly-settlement?year=${currentYear}&month=${currentMonth}`,
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '精算データの取得に失敗しました');
      }

      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || '精算データの取得に失敗しました');
      }
    } catch (error: any) {
      console.error('精算データ取得エラー:', error);
      toast.error(error.message || '精算データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [adminAccess, currentYear, currentMonth]);

  // 精算確定（契約書第6条準拠）
  const handleFinalize = async () => {
    if (!adminAccess?.isSuperAdmin || !data?.canFinalize || !permissions.canEdit) {
      toast.error('精算確定にはスーパー管理者権限が必要です');
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch('/api/admin/monthly-settlement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: currentYear,
          month: currentMonth,
          action: 'finalize',
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(result.message);
        await loadSettlementData();
      } else {
        throw new Error(result.error || '精算確定に失敗しました');
      }
    } catch (error: any) {
      console.error('精算確定エラー:', error);
      toast.error(error.message || '精算確定に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  // 支払い完了記録（契約書第6条準拠：翌月10日支払い）
  const handleMarkPaid = async () => {
    if (!adminAccess?.isSuperAdmin || !data?.canMarkPaid || !permissions.canEdit) {
      toast.error('支払い完了記録にはスーパー管理者権限が必要です');
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch('/api/admin/monthly-settlement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: currentYear,
          month: currentMonth,
          action: 'mark_paid',
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(result.message);
        await loadSettlementData();
      } else {
        throw new Error(result.error || '支払い完了記録に失敗しました');
      }
    } catch (error: any) {
      console.error('支払い完了記録エラー:', error);
      toast.error(error.message || '支払い完了記録に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  // 配分調整申請（契約書第3条第4項準拠）
  const handleAdjustmentSubmit = async () => {
    if (!permissions.canEdit) {
      toast.error('配分調整申請にはスーパー管理者権限が必要です');
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch('/api/admin/revenue-adjustment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: currentYear,
          month: currentMonth,
          ...adjustmentForm,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(result.message);
        setIsAdjustmentModalOpen(false);
        setAdjustmentForm({
          adjustmentType: 'admin_proposal',
          targetPerson: 'yoshitsune',
          adjustedPercent: 30,
          reason: '',
        });
        await loadSettlementData();
      } else {
        throw new Error(result.error || '配分調整申請に失敗しました');
      }
    } catch (error: any) {
      console.error('配分調整申請エラー:', error);
      toast.error(error.message || '配分調整申請に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  // 月変更
  const changeMonth = (delta: number) => {
    let newMonth = currentMonth + delta;
    let newYear = currentYear;

    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }

    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  // データエクスポート（将来拡張用）
  const handleExportData = async () => {
    if (!data?.allocation) return;

    try {
      const exportData = {
        period: `${currentYear}年${currentMonth}月`,
        ...data.allocation,
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contractor-payments-${currentYear}-${currentMonth}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('データをエクスポートしました');
    } catch (error) {
      console.error('エクスポートエラー:', error);
      toast.error('エクスポートに失敗しました');
    }
  };

  // 初期化
  useEffect(() => {
    if (session?.user?.id) {
      checkPermissions();
    }
  }, [session?.user?.id, checkPermissions]);

  useEffect(() => {
    if (adminAccess) {
      loadSettlementData();
    }
  }, [adminAccess, loadSettlementData]);

  // フォーマット関数
  const formatCurrency = (amount: number) => `¥${amount.toLocaleString()}`;
  const formatPercent = (percent: number) => `${percent.toFixed(1)}%`;

  // ローディング・権限チェック
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner />
          <p className="mt-2 text-gray-500">受託者支払い管理画面を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!adminAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <HiExclamationCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">アクセス権限がありません</h1>
          <p className="text-gray-600 mb-6">財務管理者権限以上が必要です</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            ダッシュボードに戻る
          </button>
        </div>
      </div>
    );
  }

  const allocation = data?.allocation;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* 🆕 権限バナー表示 */}
        <ReadOnlyBanner message={permissions.readOnlyMessage} />

        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <HiUsers className="h-10 w-10" />
              <div>
                <h1 className="text-3xl font-bold">受託者支払い管理</h1>
                <p className="text-emerald-100 mt-2">
                  業務委託契約書第3条・第6条準拠の月次利益配分システム
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* 🆕 権限バッジ表示 */}
              <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                {adminAccess.isSuperAdmin ? 'スーパー管理者' : '財務管理者'}
              </div>
              <button
                onClick={handleExportData}
                disabled={!allocation}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
              >
                <HiDownload className="h-5 w-5" />
                <span>エクスポート</span>
              </button>
              <button
                onClick={loadSettlementData}
                disabled={loading}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <HiRefresh className="h-5 w-5" />
                <span>更新</span>
              </button>
            </div>
          </div>
        </div>

        {/* 月選択 */}
        <div className="flex items-center justify-center space-x-6 mb-8">
          <button
            onClick={() => changeMonth(-1)}
            className="p-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <HiArrowLeft className="h-6 w-6" />
          </button>
          <div className="flex items-center space-x-3 bg-white px-8 py-4 rounded-xl border shadow-sm">
            <HiCalendar className="h-6 w-6 text-gray-500" />
            <span className="text-2xl font-bold text-gray-900">
              {currentYear}年{currentMonth}月
            </span>
          </div>
          <button
            onClick={() => changeMonth(1)}
            className="p-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <HiArrowRight className="h-6 w-6" />
          </button>
        </div>

        {allocation ? (
          <>
            {/* ステータス表示 */}
            <div className="mb-8">
              <div
                className={`p-6 rounded-xl border-2 ${
                  allocation.status === 'paid'
                    ? 'bg-green-50 border-green-200'
                    : allocation.status === 'finalized'
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {allocation.status === 'paid' && (
                      <HiCheckCircle className="h-8 w-8 text-green-600" />
                    )}
                    {allocation.status === 'finalized' && (
                      <HiClock className="h-8 w-8 text-blue-600" />
                    )}
                    {allocation.status === 'draft' && (
                      <HiExclamationCircle className="h-8 w-8 text-yellow-600" />
                    )}
                    <div>
                      <h3
                        className={`text-xl font-bold ${
                          allocation.status === 'paid'
                            ? 'text-green-800'
                            : allocation.status === 'finalized'
                              ? 'text-blue-800'
                              : 'text-yellow-800'
                        }`}
                      >
                        {allocation.status === 'paid' && '✅ 支払い完了'}
                        {allocation.status === 'finalized' && '⏰ 精算確定済み（支払い待ち）'}
                        {allocation.status === 'draft' && '📝 下書き状態'}
                      </h3>
                      <p
                        className={`text-sm ${
                          allocation.status === 'paid'
                            ? 'text-green-700'
                            : allocation.status === 'finalized'
                              ? 'text-blue-700'
                              : 'text-yellow-700'
                        }`}
                      >
                        {allocation.status === 'paid' &&
                          allocation.paidAt &&
                          `支払い完了日: ${new Date(allocation.paidAt).toLocaleDateString('ja-JP')}`}
                        {allocation.status === 'finalized' &&
                          allocation.finalizedAt &&
                          `確定日: ${new Date(allocation.finalizedAt).toLocaleDateString('ja-JP')} | 支払い予定: 翌月10日`}
                        {allocation.status === 'draft' && '精算確定前の計算結果です'}
                      </p>
                    </div>
                  </div>

                  {/* 🆕 権限に応じてアクションボタンを制御 */}
                  <div className="flex flex-wrap gap-3">
                    {allocation.status === 'draft' && permissions.canEdit && (
                      <button
                        onClick={() => setIsAdjustmentModalOpen(true)}
                        className="bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 flex items-center space-x-2"
                      >
                        <HiAdjustments className="h-5 w-5" />
                        <span>配分調整申請</span>
                      </button>
                    )}

                    {adminAccess?.isSuperAdmin &&
                      allocation.status === 'draft' &&
                      data.canFinalize &&
                      permissions.canEdit && (
                        <button
                          onClick={handleFinalize}
                          disabled={actionLoading}
                          className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2"
                        >
                          {actionLoading ? (
                            <Spinner size="sm" />
                          ) : (
                            <HiCheckCircle className="h-5 w-5" />
                          )}
                          <span>精算確定</span>
                        </button>
                      )}

                    {adminAccess?.isSuperAdmin &&
                      allocation.status === 'finalized' &&
                      data.canMarkPaid &&
                      permissions.canEdit && (
                        <button
                          onClick={handleMarkPaid}
                          disabled={actionLoading}
                          className="bg-green-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 flex items-center space-x-2"
                        >
                          {actionLoading ? <Spinner size="sm" /> : <HiCheck className="h-5 w-5" />}
                          <span>支払い完了</span>
                        </button>
                      )}
                  </div>
                </div>

                {/* 警告メッセージ */}
                {data.pendingAdjustments > 0 && (
                  <div className="mt-4 p-4 bg-amber-100 border border-amber-300 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <HiExclamationCircle className="h-5 w-5 text-amber-600" />
                      <p className="text-amber-800 font-medium">
                        未処理の配分調整申請が{data.pendingAdjustments}
                        件あります。精算確定前に処理してください。
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 財務サマリー（契約書準拠） */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-600">総売上</span>
                  <HiTrendingUp className="h-6 w-6 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(allocation.totalRevenue)}
                </div>
                <div className="text-xs text-gray-500 mt-1">手数料差引前</div>
              </div>

              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-600">純利益</span>
                  <HiChartBar className="h-6 w-6 text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(allocation.netProfit)}
                </div>
                <div className="text-xs text-gray-500 mt-1">配分の基準額</div>
              </div>

              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-600">受託者配分</span>
                  <HiUsers className="h-6 w-6 text-purple-500" />
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(allocation.totalContractorShare)}
                </div>
                <div className="text-xs text-gray-500 mt-1">利益の60%（義経30% + 健世30%）</div>
              </div>

              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-600">委託者配分</span>
                  <HiCurrencyDollar className="h-6 w-6 text-orange-500" />
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(allocation.companyShare)}
                </div>
                <div className="text-xs text-gray-500 mt-1">利益の40%</div>
              </div>
            </div>

            {/* 受託者別配分詳細（契約書第3条準拠） */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {Object.values(allocation.contractors).map((contractor, index) => (
                <div
                  key={contractor.contractorId}
                  className="bg-white rounded-xl border shadow-sm overflow-hidden"
                >
                  <div className={`p-6 ${index === 0 ? 'bg-blue-50' : 'bg-purple-50'} border-b`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{contractor.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{contractor.email}</p>
                      </div>
                      <div
                        className={`px-4 py-2 rounded-full text-sm font-bold ${
                          index === 0
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {formatPercent(contractor.adjustedPercent)}
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">基本配分率</span>
                        <span className="font-medium">
                          {formatPercent(contractor.originalPercent)}
                        </span>
                      </div>

                      {contractor.adjustmentReason && (
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <HiAdjustments className="h-4 w-4 text-amber-600" />
                            <span className="text-sm font-medium text-amber-800">配分調整あり</span>
                          </div>
                          <p className="text-sm text-amber-700">{contractor.adjustmentReason}</p>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">利益配分額</span>
                        <span
                          className={`font-bold text-lg ${
                            index === 0 ? 'text-blue-600' : 'text-purple-600'
                          }`}
                        >
                          {formatCurrency(contractor.allocationAmount)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">立替経費精算</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(contractor.expenseReimbursement)}
                        </span>
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-gray-900">総支払額</span>
                          <span
                            className={`text-2xl font-bold ${
                              index === 0 ? 'text-blue-600' : 'text-purple-600'
                            }`}
                          >
                            {formatCurrency(contractor.totalPayment)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">配分 + 立替経費精算</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 配分調整履歴 */}
            {allocation.hasAdjustments && (
              <div className="bg-white rounded-xl border shadow-sm">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-bold text-gray-900">配分調整履歴</h3>
                  <p className="text-sm text-gray-600 mt-1">契約書第3条第4項に基づく配分調整</p>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {allocation.adjustments.map((adjustment: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {adjustment.targetPerson === 'yoshitsune' ? '小河原義経' : '福島健世'}
                            の配分調整
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {formatPercent(adjustment.originalPercent)} →{' '}
                            {formatPercent(adjustment.adjustedPercent)}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">{adjustment.reason}</p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            adjustment.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : adjustment.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {adjustment.status === 'approved'
                            ? '承認済み'
                            : adjustment.status === 'pending'
                              ? '承認待ち'
                              : '否認'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <HiInformationCircle className="h-20 w-20 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">データが見つかりません</h3>
            <p className="text-gray-600 mb-6">
              {currentYear}年{currentMonth}月の精算データが存在しません
            </p>
            <button
              onClick={loadSettlementData}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
            >
              再読み込み
            </button>
          </div>
        )}

        {/* 🆕 権限に応じて配分調整申請モーダルを表示 */}
        {isAdjustmentModalOpen && permissions.canEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">配分調整申請</h3>
                <button
                  onClick={() => setIsAdjustmentModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <HiX className="h-6 w-6" />
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
                <p className="text-sm text-blue-800">
                  <strong>契約書第3条第4項:</strong>{' '}
                  受託者の貢献度に応じて配分率を調整することができます
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">調整タイプ</label>
                  <select
                    value={adjustmentForm.adjustmentType}
                    onChange={(e) =>
                      setAdjustmentForm((prev) => ({
                        ...prev,
                        adjustmentType: e.target.value as any,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="admin_proposal">委託者からの調整提案</option>
                    <option value="peer_proposal">受託者間の相互調整提案</option>
                    <option value="self_reduction">受託者本人からの自己申告減額</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">対象者</label>
                  <select
                    value={adjustmentForm.targetPerson}
                    onChange={(e) =>
                      setAdjustmentForm((prev) => ({
                        ...prev,
                        targetPerson: e.target.value as 'yoshitsune' | 'kensei',
                      }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="yoshitsune">小河原義経</option>
                    <option value="kensei">福島健世</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    調整後配分率 (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    step="0.1"
                    value={adjustmentForm.adjustedPercent}
                    onChange={(e) =>
                      setAdjustmentForm((prev) => ({
                        ...prev,
                        adjustedPercent: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    基本配分率: 30% | 調整可能範囲: 0% - 30%
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    調整理由 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={adjustmentForm.reason}
                    onChange={(e) =>
                      setAdjustmentForm((prev) => ({
                        ...prev,
                        reason: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="配分調整の具体的な理由を詳しく記入してください&#10;例：プロジェクトの貢献度、責任範囲の変更、パフォーマンス評価など"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    調整理由は承認審査の重要な判断材料となります
                  </p>
                </div>
              </div>

              <div className="flex space-x-4 mt-8">
                <button
                  onClick={() => setIsAdjustmentModalOpen(false)}
                  className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 font-medium"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleAdjustmentSubmit}
                  disabled={actionLoading || !adjustmentForm.reason.trim()}
                  className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2"
                >
                  {actionLoading && <Spinner size="sm" />}
                  <span>申請提出</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}