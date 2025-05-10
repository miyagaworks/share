// components/subscription/SubscriptionStatus.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { HiCheck, HiRefresh, HiXCircle, HiExclamation, HiClock } from 'react-icons/hi';

interface SubscriptionData {
  id: string;
  status: string;
  plan: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEnd?: string | null;
  isMockData?: boolean;
}

interface SubscriptionStatusProps {
  onReloadSubscription?: () => void;
}

export default function SubscriptionStatus({ onReloadSubscription }: SubscriptionStatusProps) {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reactivating, setReactivating] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // 日付のフォーマット関数
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      console.error('日付フォーマットエラー:', e);
      return dateString;
    }
  };

  // ご利用プラン情報を取得
  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/subscription');

      if (!response.ok) {
        throw new Error('プラン情報の取得に失敗しました');
      }

      const data = await response.json();
      console.log('取得したプランデータ:', data);

      if (data.subscription) {
        setSubscription(data.subscription);
      }

      setError(null);
    } catch (err) {
      console.error('プラン取得エラー:', err);
      setError('プラン情報を読み込めませんでした');
      toast.error('プラン情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 初回読み込み
  useEffect(() => {
    fetchSubscription();
  }, []);

  // ご利用プランステータスに基づいた表示情報を取得
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'trialing':
        return {
          text: '無料トライアル中',
          className: 'bg-blue-100 text-blue-800',
        };
      case 'active':
        return {
          text: 'アクティブ',
          className: 'bg-green-100 text-green-800',
        };
      case 'past_due':
        return {
          text: '支払い遅延中',
          className: 'bg-yellow-100 text-yellow-800',
        };
      case 'canceled':
        return {
          text: 'キャンセル済み',
          className: 'bg-red-100 text-red-800',
        };
      default:
        return {
          text: '不明',
          className: 'bg-gray-100 text-gray-800',
        };
    }
  };

  // ご利用プランを再アクティブ化
  const handleReactivate = async () => {
    if (!subscription) return;

    try {
      setReactivating(true);
      const response = await fetch('/api/subscription/reactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'プランの再アクティブ化に失敗しました');
      }

      const data = await response.json();
      console.log('再アクティブ化レスポンス:', data);

      // 結果を反映
      setSubscription(data.subscription);
      toast.success('プランを再アクティブ化しました');

      // 親コンポーネントに通知
      if (onReloadSubscription) {
        onReloadSubscription();
      }
    } catch (err) {
      console.error('再アクティブ化エラー:', err);
      toast.error(err instanceof Error ? err.message : 'プランの再アクティブ化に失敗しました');
    } finally {
      setReactivating(false);
    }
  };

  // ご利用プランをキャンセル
  const handleCancel = async () => {
    if (!subscription) return;

    if (
      !window.confirm(
        'このプランをキャンセルしてもよろしいですか？\n\n現在の期間が終了するまではご利用いただけます。',
      )
    ) {
      return;
    }

    try {
      setCancelling(true);

      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: 'User requested cancellation',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ご利用プランのキャンセルに失敗しました');
      }

      const data = await response.json();
      console.log('キャンセルレスポンス:', data);

      // 結果を反映
      setSubscription(data.subscription);
      toast.success('ご利用のプランをキャンセルしました');

      // 親コンポーネントに通知
      if (onReloadSubscription) {
        onReloadSubscription();
      }
    } catch (err) {
      console.error('キャンセルエラー:', err);
      toast.error(err instanceof Error ? err.message : 'ご利用プランのキャンセルに失敗しました');
    } finally {
      setCancelling(false);
    }
  };

  // 読み込み中
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <Spinner size="lg" className="mb-3" />
          <p className="text-sm text-gray-500">プラン情報を読み込んでいます...</p>
        </div>
      </div>
    );
  }

  // エラー発生時
  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 shadow-sm p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0 text-red-500 mr-3">
            <HiExclamation className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-red-800">エラーが発生しました</h3>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <Button variant="outline" className="mt-4" onClick={fetchSubscription}>
              <HiRefresh className="mr-2 h-4 w-4" />
              再読み込み
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ご利用プランなし（無料トライアル中または未登録）
  if (!subscription) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0 text-blue-500 mr-3">
            <HiClock className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-medium">無料トライアル中</h3>
            <p className="mt-2 text-sm text-gray-500">
              現在、無料トライアル期間をご利用中です。有料プランにアップグレードすると、すべての機能を継続してご利用いただけます。
            </p>
            <div className="mt-4">
              <Button className="mr-3">プランを選択</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ステータス表示情報を取得
  const statusDisplay = getStatusDisplay(subscription.status);

  // アクティブなご利用プラン
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      {/* モックデータの警告表示 */}
      {subscription && 'isMockData' in subscription && subscription.isMockData && (
        <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
          開発用のデモデータが表示されています。実際のプランデータではありません。
        </div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-3">
            {subscription.status === 'active' ? (
              <div className="bg-green-100 p-2 rounded-full">
                <HiCheck className="h-5 w-5 text-green-600" />
              </div>
            ) : subscription.status === 'trialing' ? (
              <div className="bg-blue-100 p-2 rounded-full">
                <HiClock className="h-5 w-5 text-blue-600" />
              </div>
            ) : (
              <div className="bg-red-100 p-2 rounded-full">
                <HiXCircle className="h-5 w-5 text-red-600" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
              <h3 className="text-lg font-medium mb-2 sm:mb-0">現在のプラン</h3>
              <span
                className={`text-sm font-medium px-2 py-1 rounded-full ${statusDisplay.className} inline-block`}
              >
                {statusDisplay.text}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">次回更新日</span>
                <span className="text-sm font-medium">
                  {formatDate(subscription.currentPeriodEnd)}
                </span>
              </div>

              {subscription.status === 'trialing' && (
                <div className="bg-blue-50 border border-blue-100 rounded-md p-3 mt-4">
                  <p className="text-sm text-blue-800 text-justify">
                    無料トライアル期間中です。
                    <strong>
                      {formatDate(subscription.trialEnd || subscription.currentPeriodEnd)}
                    </strong>
                    まで
                    {subscription.plan === 'monthly'
                      ? '月額'
                      : subscription.plan === 'yearly'
                        ? '年額'
                        : ''}
                    プランをお試しいただけます。
                  </p>
                </div>
              )}

              {subscription.cancelAtPeriodEnd && (
                <div className="bg-amber-50 border border-amber-100 rounded-md p-3 mt-4">
                  <p className="text-sm text-amber-800">
                    このプランは
                    <strong>{formatDate(subscription.currentPeriodEnd)}</strong>
                    にキャンセルされる予定です。それまではすべての機能をご利用いただけます。
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={handleReactivate}
                    disabled={reactivating}
                  >
                    {reactivating ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        処理中...
                      </>
                    ) : (
                      <>
                        <HiRefresh className="mr-2 h-4 w-4" />
                        プランを継続する
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {!subscription.cancelAtPeriodEnd &&
              (subscription.status === 'active' || subscription.status === 'trialing') && (
                <div className="mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-gray-700"
                    onClick={handleCancel}
                    disabled={cancelling}
                  >
                    {cancelling ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        処理中...
                      </>
                    ) : (
                      <>
                        <HiXCircle className="mr-2 h-4 w-4 text-gray-500" />
                        このプランを解約
                      </>
                    )}
                  </Button>
                </div>
              )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}