// app/dashboard/subscription/success/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { CheckCircle, XCircle, AlertCircle, Package, CreditCard } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PaymentResult {
  success: boolean;
  subscription?: {
    id: string;
    plan: string;
    status: string;
  };
  oneTapSealOrder?: {
    id: string;
    status: string;
    totalAmount: number;
    itemCount: number;
  };
  message?: string;
  error?: string;
}

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // URLパラメータから状態を取得
  const sessionId = searchParams.get('session_id');
  const success = searchParams.get('success') === 'true';
  const canceled = searchParams.get('canceled') === 'true';

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        if (canceled) {
          setPaymentResult({
            success: false,
            error: '決済がキャンセルされました',
          });
          setIsLoading(false);
          return;
        }

        if (!sessionId) {
          setPaymentResult({
            success: false,
            error: 'セッション情報が見つかりません',
          });
          setIsLoading(false);
          return;
        }

        // Stripe Checkout Sessionの状態確認
        const response = await fetch('/api/subscription/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });

        const data = await response.json();

        if (response.ok) {
          setPaymentResult(data);

          // 成功時のトースト表示
          if (data.success) {
            if (data.oneTapSealOrder) {
              toast.success('プラン契約とワンタップシール注文が完了しました！');
            } else {
              toast.success('プラン契約が完了しました！');
            }
          }
        } else {
          throw new Error(data.error || '決済状況の確認に失敗しました');
        }
      } catch (error) {
        console.error('決済確認エラー:', error);
        setPaymentResult({
          success: false,
          error: error instanceof Error ? error.message : '決済状況の確認に失敗しました',
        });
      } finally {
        setIsLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId, success, canceled]);

  // ローディング中
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md w-full text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">決済状況を確認中...</h2>
          <p className="text-gray-600">しばらくお待ちください</p>
        </Card>
      </div>
    );
  }

  // エラーまたはキャンセル
  if (!paymentResult?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-900 mb-2">
            {canceled ? '決済キャンセル' : '決済エラー'}
          </h2>
          <p className="text-gray-600 mb-6">
            {paymentResult?.error || '決済処理中に問題が発生しました'}
          </p>

          <div className="space-y-3">
            <Button onClick={() => router.push('/dashboard/subscription')} className="w-full">
              プラン選択に戻る
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard')} className="w-full">
              ダッシュボードに戻る
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 決済成功
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-green-900 mb-2">決済が完了しました！</h1>
          <p className="text-gray-600">
            {paymentResult.message || 'プランの契約が正常に完了しました'}
          </p>
        </div>

        {/* サブスクリプション情報 */}
        {paymentResult.subscription && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center mb-3">
              <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="font-semibold text-blue-900">契約プラン</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">プラン:</span>
                <span className="font-medium">{paymentResult.subscription.plan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ステータス:</span>
                <span className="font-medium text-green-600">
                  {paymentResult.subscription.status === 'active'
                    ? 'アクティブ'
                    : paymentResult.subscription.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">契約ID:</span>
                <span className="font-mono text-xs">
                  #{paymentResult.subscription.id.slice(-8)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ワンタップシール注文情報 */}
        {paymentResult.oneTapSealOrder && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <div className="flex items-center mb-3">
              <Package className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="font-semibold text-green-900">ワンタップシール注文</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">注文数量:</span>
                <span className="font-medium">{paymentResult.oneTapSealOrder.itemCount}枚</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">注文金額:</span>
                <span className="font-medium">
                  ¥{paymentResult.oneTapSealOrder.totalAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">注文ID:</span>
                <span className="font-mono text-xs">
                  #{paymentResult.oneTapSealOrder.id.slice(-8)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ステータス:</span>
                <span className="font-medium text-green-600">
                  {paymentResult.oneTapSealOrder.status === 'paid'
                    ? '決済完了'
                    : paymentResult.oneTapSealOrder.status}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 次のステップ案内 */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">次のステップ</h3>
              <div className="text-sm text-yellow-700 mt-1 space-y-1">
                <p>• 契約確認メールをお送りしました</p>
                {paymentResult.oneTapSealOrder && (
                  <>
                    <p>• ワンタップシールは1-3営業日以内に発送いたします</p>
                    <p>• 発送時に追跡番号をメールでお知らせします</p>
                  </>
                )}
                <p>• ダッシュボードで詳細をご確認いただけます</p>
              </div>
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={() => router.push('/dashboard')} className="flex-1">
            ダッシュボードに移動
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/subscription')}
            className="flex-1"
          >
            プラン詳細を確認
          </Button>
          {paymentResult.oneTapSealOrder && (
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/subscription#one-tap-seal-orders')}
              className="flex-1"
            >
              注文履歴を確認
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}