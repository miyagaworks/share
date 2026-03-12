// app/dashboard/partner/billing/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { HiCreditCard, HiExternalLink, HiClock, HiCheckCircle, HiXCircle } from 'react-icons/hi';

interface BillingData {
  partner: {
    id: string;
    name: string;
    plan: string;
    planDisplayName: string;
    planAmount: number;
    billingStatus: string;
    billingEmail: string | null;
    accountStatus: string;
    trialEndsAt: string | null;
    maxAccounts: number;
  };
  invoices: Array<{
    id: string;
    amount: number;
    status: string;
    date: string | null;
    pdfUrl: string | null;
    hostedUrl: string | null;
  }>;
  upcomingInvoice: {
    amount: number;
    date: string | null;
  } | null;
  billingPortalUrl: string | null;
  availablePlans: Array<{
    planId: string;
    displayName: string;
    amount: number;
    maxAccounts: number;
  }>;
}

export default function PartnerBillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchBilling = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/partner/billing');
      if (!res.ok) throw new Error('請求情報の取得に失敗しました');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBilling();
  }, []);

  const handleAction = async (action: string, plan?: string) => {
    if (!confirm(getConfirmMessage(action, plan))) return;

    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/partner/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, plan }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '操作に失敗しました');
      setActionMessage(json.message);
      await fetchBilling();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setActionLoading(false);
    }
  };

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

  const { partner, invoices, upcomingInvoice, billingPortalUrl, availablePlans } = data;
  const isTrialing = partner.accountStatus === 'trial';
  const trialDaysLeft = partner.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(partner.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">請求・プラン管理</h1>
        <p className="text-gray-500">{partner.name} の請求情報とプラン設定</p>
      </div>

      {/* トライアルバナー */}
      {isTrialing && partner.trialEndsAt && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <HiClock className="h-5 w-5 text-blue-600" />
            <p className="font-medium text-blue-800">
              トライアル期間中（残り{trialDaysLeft}日 - {new Date(partner.trialEndsAt).toLocaleDateString('ja-JP')}まで）
            </p>
          </div>
          <p className="text-sm text-blue-600 mt-1">
            トライアル期間中は無料でご利用いただけます。期間終了後に月額課金が開始されます。
          </p>
        </div>
      )}

      {/* 操作結果メッセージ */}
      {actionMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700">{actionMessage}</p>
        </div>
      )}

      {/* 現在のプラン */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">現在のプラン</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-gray-500">プラン</p>
            <p className="text-xl font-bold">{partner.planDisplayName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">月額料金</p>
            <p className="text-xl font-bold">&yen;{partner.planAmount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">課金ステータス</p>
            <div className="flex items-center gap-2 mt-1">
              <BillingStatusBadge status={partner.billingStatus} />
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-500">アカウント上限: {partner.maxAccounts}アカウント</p>
        </div>
      </div>

      {/* プラン変更 */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">プラン変更</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {availablePlans.map((plan) => (
            <div
              key={plan.planId}
              className={`rounded-lg border-2 p-4 ${
                plan.planId === partner.plan
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h3 className="font-semibold">{plan.displayName}</h3>
              <p className="text-2xl font-bold mt-2">
                &yen;{plan.amount.toLocaleString()}
                <span className="text-sm font-normal text-gray-500">/月</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                最大{plan.maxAccounts}アカウント
              </p>
              {plan.planId !== partner.plan && (
                <button
                  onClick={() => handleAction('change_plan', plan.planId)}
                  disabled={actionLoading}
                  className="mt-3 w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {actionLoading ? '処理中...' : 'このプランに変更'}
                </button>
              )}
              {plan.planId === partner.plan && (
                <p className="mt-3 text-center text-sm text-blue-600 font-medium">現在のプラン</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 次回請求 */}
      {upcomingInvoice && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">次回請求予定</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">&yen;{upcomingInvoice.amount.toLocaleString()}</p>
              {upcomingInvoice.date && (
                <p className="text-sm text-gray-500">
                  {new Date(upcomingInvoice.date).toLocaleDateString('ja-JP')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 請求履歴 */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">請求履歴</h2>
        {invoices.length === 0 ? (
          <p className="text-gray-500">請求履歴はまだありません</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">日付</th>
                  <th className="text-left py-2 px-3">金額</th>
                  <th className="text-left py-2 px-3">ステータス</th>
                  <th className="text-left py-2 px-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b last:border-b-0">
                    <td className="py-2 px-3">
                      {invoice.date
                        ? new Date(invoice.date).toLocaleDateString('ja-JP')
                        : '-'}
                    </td>
                    <td className="py-2 px-3">&yen;{invoice.amount.toLocaleString()}</td>
                    <td className="py-2 px-3">
                      <InvoiceStatusBadge status={invoice.status || 'unknown'} />
                    </td>
                    <td className="py-2 px-3">
                      {invoice.pdfUrl && (
                        <a
                          href={invoice.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs"
                        >
                          PDF
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stripe カスタマーポータル & 解約 */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">その他の操作</h2>
        <div className="flex flex-wrap gap-3">
          {billingPortalUrl && (
            <a
              href={billingPortalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
            >
              <HiCreditCard className="h-4 w-4" />
              支払い方法の管理
              <HiExternalLink className="h-3 w-3" />
            </a>
          )}
          {partner.billingStatus !== 'cancelled' && (
            <button
              onClick={() => handleAction('cancel')}
              disabled={actionLoading}
              className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium disabled:opacity-50"
            >
              サブスクリプションを解約
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function BillingStatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; className: string; icon: typeof HiCheckCircle }> = {
    active: { label: '有効', className: 'bg-green-100 text-green-800', icon: HiCheckCircle },
    suspended: { label: '停止中', className: 'bg-yellow-100 text-yellow-800', icon: HiClock },
    cancelled: { label: '解約済み', className: 'bg-red-100 text-red-800', icon: HiXCircle },
  };
  const config = configs[status] || { label: status, className: 'bg-gray-100 text-gray-800', icon: HiClock };
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const labels: Record<string, { label: string; className: string }> = {
    paid: { label: '支払済', className: 'bg-green-100 text-green-800' },
    open: { label: '未払い', className: 'bg-yellow-100 text-yellow-800' },
    void: { label: '無効', className: 'bg-gray-100 text-gray-800' },
    draft: { label: '下書き', className: 'bg-gray-100 text-gray-800' },
    uncollectible: { label: '回収不能', className: 'bg-red-100 text-red-800' },
  };
  const config = labels[status] || { label: status, className: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

function getConfirmMessage(action: string, plan?: string): string {
  switch (action) {
    case 'change_plan':
      return `プランを ${plan} に変更しますか？日割り計算が適用されます。`;
    case 'cancel':
      return 'サブスクリプションを解約しますか？現在の期間終了時に解約されます。';
    case 'create_subscription':
      return 'サブスクリプションを作成しますか？';
    default:
      return '実行しますか？';
  }
}
