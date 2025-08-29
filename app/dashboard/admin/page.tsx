// app/dashboard/admin/page.tsx (財務管理者権限制御修正版)
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from 'react-hot-toast';
import {
  HiShieldCheck,
  HiUsers,
  HiCreditCard,
  HiExclamationCircle,
  HiDownload,
  HiEye,
  HiKey,
  HiBell,
  HiOutlineMail,
  HiCurrencyDollar,
  HiDocumentText,
  HiLightningBolt,
  HiUserGroup,
  HiCog,
  HiChartBar,
  HiCheck,
  HiX,
  HiInformationCircle,
} from 'react-icons/hi';

// 管理者アクセス権限の型定義
interface AdminAccess {
  isSuperAdmin: boolean;
  isFinancialAdmin: boolean;
  adminLevel: 'super' | 'financial' | 'none';
  permissions: {
    canManageUsers: boolean;
    canAccessFinancial: boolean;
    canManageSystem: boolean;
    canViewReports: boolean;
    canManageFinancialData: boolean;
  };
}

// システム情報の型定義
interface SystemInfo {
  totalUsers: number;
  activeSubscriptions: number;
  pendingRequests: number;
  lastUpdate: string;
}

// 承認待ち経費の型定義
interface PendingExpense {
  id: string;
  title: string;
  description?: string;
  amount: number;
  category: string;
  expenseDate: string;
  userType: string;
  createdBy: string;
}

// 🔧 修正: AdminMenuCard の統一されたインターフェース
interface AdminMenuCardProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  onClick: () => void;
  badge?: string;
  disabled?: boolean;
}

// 🔧 修正: AdminMenuCard コンポーネントの統一
const AdminMenuCard = ({
  title,
  icon,
  description,
  onClick,
  badge,
  disabled = false,
}: AdminMenuCardProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      w-full p-6 rounded-xl border-2 transition-all duration-200 text-left
      ${
        disabled
          ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
          : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer'
      }
    `}
  >
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 rounded-lg bg-gray-50 group-hover:bg-blue-50 transition-colors">
        {icon}
      </div>
      {badge && (
        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium">
          {badge}
        </span>
      )}
    </div>
    <h3
      className={`font-semibold text-lg mb-2 transition-colors ${
        disabled ? 'text-gray-400' : 'text-gray-900 group-hover:text-blue-600'
      }`}
    >
      {title}
    </h3>
    <p className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-600'}`}>{description}</p>
  </button>
);

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminAccess, setAdminAccess] = useState<AdminAccess | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [systemInfoLoading, setSystemInfoLoading] = useState(false);

  // 承認待ち経費の状態
  const [pendingExpenses, setPendingExpenses] = useState<PendingExpense[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [expensesLoading, setExpensesLoading] = useState(false);

  // 承認待ち経費を取得する関数
  const loadPendingExpenses = useCallback(async () => {
    if (!adminAccess?.permissions?.canManageFinancialData) return;

    setExpensesLoading(true);
    try {
      const response = await fetch('/api/admin/company-expenses?status=pending&limit=5');
      if (response.ok) {
        const data = await response.json();
        setPendingExpenses(data.expenses || []);
        setPendingCount(data.summary?.pendingAmount || 0);
      }
    } catch (error) {
      console.error('承認待ち経費取得エラー:', error);
    } finally {
      setExpensesLoading(false);
    }
  }, [adminAccess?.permissions?.canManageFinancialData]);

  // 承認・否認アクション（スーパー管理者のみ）
  const handleQuickApproval = async (expenseId: string, action: 'approve' | 'reject') => {
    if (!adminAccess?.isSuperAdmin) {
      toast.error('この操作にはスーパー管理者権限が必要です');
      return;
    }

    try {
      const response = await fetch('/api/admin/company-expenses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: expenseId,
          action,
          approvedBy: session?.user?.id,
        }),
      });

      if (response.ok) {
        toast.success(`経費を${action === 'approve' ? '承認' : '否認'}しました`);
        await loadPendingExpenses();
      } else {
        const result = await response.json();
        toast.error(result.error || '操作に失敗しました');
      }
    } catch (error) {
      console.error('承認操作エラー:', error);
      toast.error('操作に失敗しました');
    }
  };

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!session?.user?.id) {
        router.push('/auth/signin');
        return;
      }
      try {
        const response = await fetch('/api/admin/access');
        const data = await response.json();

        if (data.adminLevel !== 'none') {
          setAdminAccess(data);
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

  // 承認待ち経費を定期取得
  useEffect(() => {
    if (adminAccess && (adminAccess.isSuperAdmin || adminAccess.isFinancialAdmin)) {
      loadPendingExpenses();
      const interval = setInterval(loadPendingExpenses, 30000);
      return () => clearInterval(interval);
    }
  }, [adminAccess, loadPendingExpenses]);

  const fetchSystemInfo = async () => {
    if (!adminAccess?.isSuperAdmin) {
      toast.error('システム情報の取得にはスーパー管理者権限が必要です');
      return;
    }

    setSystemInfoLoading(true);
    try {
      const response = await fetch('/api/admin/system-info');
      const data = await response.json();
      setSystemInfo(data);
    } catch (error) {
      console.error('システム情報の取得に失敗しました:', error);
    } finally {
      setSystemInfoLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!adminAccess) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">アクセス権限がありません</h3>
          <p className="text-sm text-gray-500">管理者権限が必要です。</p>
        </div>
      </div>
    );
  }

  const { isSuperAdmin, isFinancialAdmin, permissions } = adminAccess;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ヘッダー */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">管理者ダッシュボード</h1>
        <div className="flex items-center space-x-4">
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            権限レベル: {isSuperAdmin ? 'スーパー管理者' : '財務管理者'}
          </div>
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            アクセス権限: {permissions.canManageUsers ? 'フル権限' : '財務限定'}
          </div>
        </div>
      </div>

      {/* 財務管理者向け説明メッセージ */}
      {isFinancialAdmin && !isSuperAdmin && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-start">
            <HiInformationCircle className="h-6 w-6 text-blue-500 mt-1 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                💼 財務管理者としてログイン中
              </h3>
              <p className="text-blue-700 text-sm mb-2">
                あなたには財務関連機能へのアクセス権限があります。
              </p>
              <div className="text-blue-600 text-sm">
                <strong>利用可能な機能:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>財務ダッシュボードの閲覧</li>
                  <li>経費データの閲覧・管理</li>
                  <li>売上管理</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 承認待ち経費アラート */}
      {(isSuperAdmin || isFinancialAdmin) && pendingExpenses.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
          <div className="flex items-start">
            <HiExclamationCircle className="h-6 w-6 text-amber-500 mt-1 mr-3" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-amber-800 mb-2">
                ⚠️ 承認待ちの経費があります（{pendingExpenses.length}件）
              </h3>

              {isFinancialAdmin && !isSuperAdmin ? (
                <p className="text-amber-700 text-sm mb-4">
                  受託者から経費の承認申請があります。詳細は経費管理画面でご確認ください。
                  <br />
                  <span className="text-amber-600 font-medium">
                    ※ 承認・否認操作は経費管理画面で行えます
                  </span>
                </p>
              ) : (
                <p className="text-amber-700 text-sm mb-4">
                  受託者から経費の承認申請があります。確認をお願いします。
                </p>
              )}

              {/* 承認待ち経費一覧 */}
              <div className="space-y-3">
                {pendingExpenses.slice(0, 3).map((expense) => (
                  <div key={expense.id} className="bg-white rounded-lg p-4 border border-amber-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="font-semibold text-gray-900 mr-3">{expense.title}</span>
                          <span className="text-lg font-bold text-red-600">
                            ¥{expense.amount.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {expense.userType} | {expense.category} |{' '}
                          {new Date(expense.expenseDate).toLocaleDateString('ja-JP')}
                        </div>
                        {expense.description && (
                          <div className="text-sm text-gray-500 mt-1">{expense.description}</div>
                        )}
                      </div>

                      {isSuperAdmin && (
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => handleQuickApproval(expense.id, 'approve')}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-green-700 transition-colors flex items-center"
                          >
                            <HiCheck className="h-4 w-4 mr-1" />
                            承認
                          </button>
                          <button
                            onClick={() => handleQuickApproval(expense.id, 'reject')}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-red-700 transition-colors flex items-center"
                          >
                            <HiX className="h-4 w-4 mr-1" />
                            否認
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {pendingExpenses.length > 3 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => router.push('/dashboard/admin/company-expenses?status=pending')}
                    className="text-amber-600 hover:text-amber-800 font-medium text-sm"
                  >
                    さらに{pendingExpenses.length - 3}件の承認待ち経費を確認 →
                  </button>
                </div>
              )}

              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-amber-600">
                  承認待ち金額合計: <strong>¥{pendingCount.toLocaleString()}</strong>
                </div>
                <button
                  onClick={() => router.push('/dashboard/admin/company-expenses')}
                  className="bg-amber-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-700 transition-colors text-sm"
                >
                  経費管理画面で確認
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 財務管理セクション */}
      {(isSuperAdmin || isFinancialAdmin) && (
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <HiCurrencyDollar className="h-6 w-6 text-green-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">財務管理</h2>
          </div>
          <div className="h-px bg-gradient-to-r from-green-200 via-green-300 to-transparent mb-6"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AdminMenuCard
              title="財務ダッシュボード"
              icon={<HiChartBar className="h-8 w-8 text-green-600" />}
              description="売上・経費・利益の総合分析"
              onClick={() => router.push('/dashboard/admin/financial')}
            />

            <AdminMenuCard
              title="経費管理"
              icon={<HiDocumentText className="h-8 w-8 text-green-600" />}
              description="委託者・受託者経費の登録と承認管理"
              onClick={() => router.push('/dashboard/admin/company-expenses')}
            />

            <AdminMenuCard
              title="売上管理"
              icon={<HiLightningBolt className="h-8 w-8 text-green-600" />}
              description="売上データの取得・分析・同期設定"
              onClick={() => router.push('/dashboard/admin/stripe/revenue')}
            />

            <AdminMenuCard
              title="受託者支払い管理"
              icon={<HiUsers className="h-8 w-8 text-green-600" />}
              description={
                isSuperAdmin
                  ? '月次利益配分と受託者支払い管理'
                  : '月次利益配分と受託者支払い管理（閲覧のみ）'
              }
              onClick={() => router.push('/dashboard/admin/contractor-payments')}
              badge={!isSuperAdmin ? '閲覧のみ' : undefined}
            />

            <AdminMenuCard
              title="財務管理者管理"
              icon={<HiUserGroup className="h-8 w-8 text-green-600" />}
              description={
                isSuperAdmin
                  ? '財務管理者の追加・削除・権限管理'
                  : '財務管理者の一覧・権限確認（閲覧のみ）'
              }
              onClick={() => router.push('/dashboard/admin/financial-admins')}
              badge={!isSuperAdmin ? '閲覧のみ' : undefined}
            />
          </div>
        </div>
      )}

      {/* システム管理セクション */}
      {(isSuperAdmin || isFinancialAdmin) && (
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <HiShieldCheck className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">
              システム管理
              {!isSuperAdmin && (
                <span className="ml-3 text-sm bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                  閲覧のみ
                </span>
              )}
            </h2>
          </div>
          <div className="h-px bg-gradient-to-r from-blue-200 via-blue-300 to-transparent mb-6"></div>

          {isFinancialAdmin && !isSuperAdmin && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <HiInformationCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-3" />
                <div>
                  <h3 className="font-semibold text-amber-800 mb-1">システム管理について</h3>
                  <p className="text-amber-700 text-sm">
                    財務管理者として、システム管理画面は閲覧のみ可能です。データの編集・削除・操作はスーパー管理者のみ実行できます。
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AdminMenuCard
              title="ユーザー管理"
              icon={<HiUsers className="h-8 w-8 text-blue-600" />}
              description={
                isSuperAdmin
                  ? 'すべてのユーザーの一覧・検索・管理'
                  : 'すべてのユーザーの一覧・検索（閲覧のみ）'
              }
              onClick={() => router.push('/dashboard/admin/users')}
              badge={!isSuperAdmin ? '閲覧のみ' : undefined}
            />

            <AdminMenuCard
              title="サブスクリプション管理"
              icon={<HiCreditCard className="h-8 w-8 text-blue-600" />}
              description={
                isSuperAdmin
                  ? 'ユーザーのサブスクリプション状態の管理'
                  : 'ユーザーのサブスクリプション状態の確認（閲覧のみ）'
              }
              onClick={() => router.push('/dashboard/admin/subscriptions')}
              badge={!isSuperAdmin ? '閲覧のみ' : undefined}
            />

            <AdminMenuCard
              title="ワンタップシール管理"
              icon={<HiLightningBolt className="h-8 w-8 text-blue-600" />}
              description={
                isSuperAdmin
                  ? 'ワンタップシール注文の管理・発送処理'
                  : 'ワンタップシール注文の確認（閲覧のみ）'
              }
              onClick={() => router.push('/dashboard/admin/one-tap-seal-orders')}
              badge={!isSuperAdmin ? '閲覧のみ' : undefined}
            />

            <AdminMenuCard
              title="解約申請管理"
              icon={<HiExclamationCircle className="h-8 w-8 text-red-600" />}
              description={
                isSuperAdmin
                  ? 'ユーザーからの解約申請を確認・処理'
                  : 'ユーザーからの解約申請を確認（閲覧のみ）'
              }
              onClick={() => router.push('/dashboard/admin/cancel-requests')}
              badge={!isSuperAdmin ? '閲覧のみ' : undefined}
            />

            <AdminMenuCard
              title="データエクスポート管理"
              icon={<HiDownload className="h-8 w-8 text-blue-600" />}
              description={
                isSuperAdmin
                  ? 'ユーザーデータの一括エクスポート'
                  : 'ユーザーデータの確認（閲覧のみ）'
              }
              onClick={() => router.push('/dashboard/admin/users/export')}
              badge={!isSuperAdmin ? '閲覧のみ' : undefined}
            />

            <AdminMenuCard
              title="プロフィール・QR管理"
              icon={<HiEye className="h-8 w-8 text-blue-600" />}
              description={
                isSuperAdmin
                  ? 'ユーザープロフィールとQRコードの管理'
                  : 'ユーザープロフィールとQRコードの確認（閲覧のみ）'
              }
              onClick={() => router.push('/dashboard/admin/profiles')}
              badge={!isSuperAdmin ? '閲覧のみ' : undefined}
            />

            <AdminMenuCard
              title="永久利用権管理"
              icon={<HiKey className="h-8 w-8 text-blue-600" />}
              description={isSuperAdmin ? '永久利用権の付与・管理' : '永久利用権の確認（閲覧のみ）'}
              onClick={() => router.push('/dashboard/admin/permissions')}
              badge={!isSuperAdmin ? '閲覧のみ' : undefined}
            />

            <AdminMenuCard
              title="お知らせ管理"
              icon={<HiBell className="h-8 w-8 text-blue-600" />}
              description={
                isSuperAdmin
                  ? 'システムお知らせの作成・配信管理'
                  : 'システムお知らせの確認（閲覧のみ）'
              }
              onClick={() => router.push('/dashboard/admin/notifications')}
              badge={!isSuperAdmin ? '閲覧のみ' : undefined}
            />

            <AdminMenuCard
              title="メール配信管理"
              icon={<HiOutlineMail className="h-8 w-8 text-blue-600" />}
              description={
                isSuperAdmin ? 'ユーザー向けメール配信の管理' : 'メール配信履歴の確認（閲覧のみ）'
              }
              onClick={() => router.push('/dashboard/admin/email')}
              badge={!isSuperAdmin ? '閲覧のみ' : undefined}
            />
          </div>
        </div>
      )}

      {/* システム情報セクション（スーパー管理者のみ） */}
      {isSuperAdmin && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">システム情報</h3>
            <button
              onClick={fetchSystemInfo}
              disabled={systemInfoLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {systemInfoLoading ? '取得中...' : '情報を取得'}
            </button>
          </div>

          {systemInfo ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{systemInfo.totalUsers}</div>
                <div className="text-sm text-gray-600">総ユーザー数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {systemInfo.activeSubscriptions}
                </div>
                <div className="text-sm text-gray-600">アクティブ契約</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {systemInfo.pendingRequests}
                </div>
                <div className="text-sm text-gray-600">未処理申請</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">最終更新</div>
                <div className="text-sm font-medium">{systemInfo.lastUpdate}</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">
                システム情報を取得するには上のボタンをクリックしてください
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}