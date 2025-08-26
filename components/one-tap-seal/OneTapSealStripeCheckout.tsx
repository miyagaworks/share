// components/one-tap-seal/OneTapSealStripeCheckout.tsx
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import { CreditCard, Lock, AlertCircle, Loader2 } from 'lucide-react';

interface OneTapSealStripeCheckoutProps {
  orderId: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function OneTapSealStripeCheckout({
  orderId,
  amount,
  onSuccess,
  onCancel,
}: OneTapSealStripeCheckoutProps) {
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stripe Checkout Session作成と決済開始
  const handlePayment = async () => {
    setIsCreatingSession(true);
    setError(null);

    try {
      // Checkout Session作成
      const response = await fetch('/api/one-tap-seal/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'セッション作成に失敗しました');
      }

      const { checkoutUrl } = await response.json();

      // Stripe Checkoutに移動
      window.location.href = checkoutUrl;
    } catch (err) {
      console.error('Checkout Session作成エラー:', err);
      const message = err instanceof Error ? err.message : '決済の準備に失敗しました';
      setError(message);
      toast.error(message);
    } finally {
      setIsCreatingSession(false);
    }
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <Card className="p-6 max-w-md mx-auto">
        <div className="mb-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Lock className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm font-medium text-green-600">セキュア決済</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">ワンタップシール決済</h3>
          <p className="text-sm text-gray-600 mt-1">
            合計金額: <span className="font-medium">¥{amount.toLocaleString()}</span>
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-600 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Button onClick={handlePayment} disabled={isCreatingSession} className="w-full">
            {isCreatingSession ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                決済画面を準備中...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />¥{amount.toLocaleString()} を支払う
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isCreatingSession}
            className="w-full"
          >
            キャンセル
          </Button>
        </div>

        {/* 注意事項 */}
        <div className="mt-4 text-xs text-gray-500 space-y-1">
          <p>• Stripeセキュア決済を使用します</p>
          <p>• 決済完了後、注文のキャンセルはできません</p>
          <p>• 領収書はメールで送信されます</p>
          <p>• カード情報は保存されません</p>
        </div>
      </Card>
    </div>
  );
}