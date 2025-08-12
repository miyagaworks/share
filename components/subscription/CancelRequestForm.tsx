// components/subscription/CancelRequestForm.tsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { HiExclamationCircle, HiInformationCircle, HiX } from 'react-icons/hi';

interface CancelRequestFormProps {
  subscription: {
    plan: string;
    interval?: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function CancelRequestForm({
  subscription,
  onClose,
  onSuccess,
}: CancelRequestFormProps) {
  const [cancelDate, setCancelDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [refundInfo, setRefundInfo] = useState<{
    paidAmount: number;
    refundAmount: number;
    usedMonths: number;
  } | null>(null);

  // プラン情報の整理
  const isYearly = subscription.interval === 'year';
  const isMonthly = subscription.interval === 'month';
  const isIndividual = subscription.plan === 'monthly' || subscription.plan === 'yearly';

  // プラン表示名
  const getPlanDisplayName = () => {
    const intervalText = isYearly ? '年額' : '月額';

    if (isIndividual) {
      return `個人プラン（${intervalText}）`;
    }
    if (subscription.plan.includes('starter')) {
      return `法人スタータープラン（${intervalText}）`;
    }
    if (subscription.plan.includes('business')) {
      return `法人ビジネスプラン（${intervalText}）`;
    }
    if (subscription.plan.includes('enterprise')) {
      return `法人エンタープライズプラン（${intervalText}）`;
    }
    return `${subscription.plan}（${intervalText}）`;
  };

  // 返金計算（useCallbackで依存関係を修正）
  const calculateRefund = useCallback(
    (selectedDate: string) => {
      if (!selectedDate) return null;

      const startDate = new Date(subscription.currentPeriodStart);
      const requestDate = new Date(selectedDate);
      const usedMonths = Math.ceil(
        (requestDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30),
      );

      // 支払い済み金額
      let paidAmount = 0;
      if (subscription.plan === 'monthly') paidAmount = 550;
      else if (subscription.plan === 'yearly') paidAmount = 5;
      else if (subscription.plan.includes('starter')) {
        paidAmount = isYearly ? 33000 : 3300;
      } else if (subscription.plan.includes('business')) {
        paidAmount = isYearly ? 66000 : 6600;
      } else if (subscription.plan.includes('enterprise')) {
        paidAmount = isYearly ? 99000 : 9900;
      }

      // 返金額計算
      let refundAmount = 0;
      if (isYearly) {
        let monthlyRate = 0;
        if (isIndividual) monthlyRate = 550;
        else if (subscription.plan.includes('starter')) monthlyRate = 3300;
        else if (subscription.plan.includes('business')) monthlyRate = 6600;
        else if (subscription.plan.includes('enterprise')) monthlyRate = 9900;

        const usedAmount = usedMonths * monthlyRate;
        refundAmount = Math.max(0, paidAmount - usedAmount);
      }

      return { paidAmount, refundAmount, usedMonths };
    },
    [subscription.currentPeriodStart, subscription.plan, isYearly, isIndividual],
  );

  // 解約日変更時の処理
  useEffect(() => {
    if (cancelDate) {
      const info = calculateRefund(cancelDate);
      setRefundInfo(info);
    }
  }, [cancelDate, calculateRefund]);

  // 今日以降の日付のみ選択可能
  const today = new Date().toISOString().split('T')[0];

  // 現在の契約期間終了日
  const periodEndDate = new Date(subscription.currentPeriodEnd).toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cancelDate) {
      toast.error('解約日を選択してください');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/subscription/cancel-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cancelDate,
          reason: reason.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '解約申請に失敗しました');
      }

      toast.success('解約申請を受け付けました');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '解約申請に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">プラン解約申請</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <HiX className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 現在のプラン情報 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">現在のご契約</h3>
            <p className="text-blue-800">{getPlanDisplayName()}</p>
            <p className="text-sm text-blue-600 mt-1">
              契約期間: {new Date(subscription.currentPeriodStart).toLocaleDateString('ja-JP')} 〜{' '}
              {new Date(subscription.currentPeriodEnd).toLocaleDateString('ja-JP')}
            </p>
          </div>

          {/* 解約ルールの説明 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <HiInformationCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-yellow-900 mb-2">解約・返金ルール</h4>
                <div className="text-sm text-yellow-800 space-y-1">
                  {isMonthly ? (
                    <p>• 月額プランのため、返金はございません</p>
                  ) : (
                    <>
                      <p>• 年額プランの場合、利用月数に応じて返金いたします</p>
                      <p>• 利用した月を月額料金で計算し、年額から差し引いた金額を返金</p>
                    </>
                  )}
                  <p>• 解約処理完了まで、サービスは引き続きご利用いただけます</p>
                  <p>• 解約の反映・返金には最大10営業日程度お時間をいただきます</p>
                </div>
              </div>
            </div>
          </div>

          {/* 解約日選択 */}
          <div>
            <label htmlFor="cancelDate" className="block text-sm font-medium text-gray-700 mb-2">
              解約希望日 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="cancelDate"
              value={cancelDate}
              onChange={(e) => setCancelDate(e.target.value)}
              min={today}
              max={periodEndDate}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              現在の契約期間内（
              {new Date(subscription.currentPeriodEnd).toLocaleDateString('ja-JP')}
              まで）で選択してください
            </p>
          </div>

          {/* 返金情報表示 */}
          {refundInfo && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">返金計算結果</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">支払い済み金額:</span>
                  <span className="font-medium">¥{refundInfo.paidAmount.toLocaleString()}</span>
                </div>
                {isYearly && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">利用予定月数:</span>
                      <span className="font-medium">{refundInfo.usedMonths}ヶ月</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">利用料金:</span>
                      <span className="font-medium">
                        ¥{(refundInfo.paidAmount - refundInfo.refundAmount).toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between border-t border-gray-300 pt-2">
                  <span className="text-gray-900 font-semibold">返金予定額:</span>
                  <span className="text-green-600 font-bold">
                    ¥{refundInfo.refundAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 解約理由 */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              解約理由（任意）
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="差し支えなければ、解約理由をお聞かせください（サービス改善の参考にさせていただきます）"
            />
          </div>

          {/* 注意事項 */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <HiExclamationCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-red-900 mb-2">ご注意</h4>
                <div className="text-sm text-red-800 space-y-1">
                  <p>• 解約申請は取り消すことができません</p>
                  <p>• 管理者による承認後、解約処理が実行されます</p>
                  <p>• 解約処理完了後は、アカウントとデータが削除されます</p>
                </div>
              </div>
            </div>
          </div>

          {/* ボタン */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading || !cancelDate}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '申請中...' : '解約申請を提出'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}