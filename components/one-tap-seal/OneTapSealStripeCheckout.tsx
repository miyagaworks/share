// components/one-tap-seal/OneTapSealStripeCheckout.tsx
'use client';
import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import { CreditCard, Lock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

// Stripeの公開キーを設定
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface OneTapSealStripeCheckoutProps {
  orderId: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

// CardElementのスタイル設定
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
      padding: '12px',
    },
    invalid: {
      color: '#9e2146',
    },
  },
  hidePostalCode: true, // 郵便番号フィールドを非表示
};

// 決済フォームコンポーネント
function CheckoutForm({ orderId, amount, onSuccess, onCancel }: OneTapSealStripeCheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // PaymentIntent作成
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/one-tap-seal/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        });

        if (response.ok) {
          const data = await response.json();
          setClientSecret(data.clientSecret);
          setPaymentIntentId(data.paymentIntentId);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'PaymentIntentの作成に失敗しました');
        }
      } catch (err) {
        console.error('PaymentIntent作成エラー:', err);
        setError(err instanceof Error ? err.message : '決済の準備に失敗しました');
      }
    };

    createPaymentIntent();
  }, [orderId]);

  // 決済処理
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('カード情報の取得に失敗しました');
      setIsProcessing(false);
      return;
    }

    try {
      // 決済確認
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (confirmError) {
        throw new Error(confirmError.message || '決済に失敗しました');
      }

      if (paymentIntent.status === 'succeeded') {
        toast.success('決済が完了しました！');
        onSuccess();
      } else {
        throw new Error('決済が完了しませんでした');
      }
    } catch (err) {
      console.error('決済エラー:', err);
      setError(err instanceof Error ? err.message : '決済に失敗しました');
      toast.error(err instanceof Error ? err.message : '決済に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <CreditCard className="h-4 w-4 inline mr-1" />
            カード情報
          </label>
          <div className="border border-gray-300 rounded-md p-3 bg-white">
            <CardElement options={cardElementOptions} />
          </div>
        </div>

        <div className="space-y-2">
          <Button
            type="submit"
            disabled={!stripe || isProcessing || !clientSecret}
            className="w-full"
            loading={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                決済処理中...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />¥{amount.toLocaleString()} を支払う
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
            className="w-full"
          >
            キャンセル
          </Button>
        </div>
      </form>

      {/* 注意事項 */}
      <div className="mt-4 text-xs text-gray-500 space-y-1">
        <p>• 決済完了後、注文のキャンセルはできません</p>
        <p>• 領収書はメールで送信されます</p>
        <p>• カード情報は保存されません</p>
      </div>
    </Card>
  );
}

// メインコンポーネント
export function OneTapSealStripeCheckout(props: OneTapSealStripeCheckoutProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <Elements stripe={stripePromise}>
        <CheckoutForm {...props} />
      </Elements>
    </div>
  );
}

// 決済完了表示コンポーネント
interface PaymentSuccessProps {
  orderId: string;
  amount: number;
  onContinue: () => void;
}

export function OneTapSealPaymentSuccess({ orderId, amount, onContinue }: PaymentSuccessProps) {
  return (
    <Card className="p-6 max-w-md mx-auto text-center">
      <div className="mb-4">
        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
        <h3 className="text-lg font-semibold text-green-900">決済完了</h3>
      </div>

      <div className="space-y-2 mb-6">
        <p className="text-sm text-gray-600">お支払いが正常に完了しました</p>
        <p className="font-medium">注文番号: #{orderId.slice(-8)}</p>
        <p className="font-medium">決済金額: ¥{amount.toLocaleString()}</p>
      </div>

      <div className="p-3 bg-blue-50 rounded-lg mb-6">
        <p className="text-sm text-blue-800">
          注文確認メールを送信しました。
          <br />
          商品は1-3営業日以内に発送いたします。
        </p>
      </div>

      <Button onClick={onContinue} className="w-full">
        完了
      </Button>
    </Card>
  );
}