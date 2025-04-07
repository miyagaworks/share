// components/subscription/PaymentMethodForm.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { loadStripe } from '@stripe/stripe-js';
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  Elements,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import type { StripeElementChangeEvent } from '@stripe/stripe-js';

// Stripeの公開キーを設定
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

// 子コンポーネント: Stripe要素が必要なフォーム
function PaymentMethodFormContent({
  onPaymentMethodChange,
}: {
  onPaymentMethodChange: (paymentMethodId: string | null) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [complete, setComplete] = useState({
    cardNumber: false,
    cardExpiry: false,
    cardCvc: false,
  });

  // カード要素の共通スタイル
  const elementStyle = {
    style: {
      base: {
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
        padding: '10px 0',
      },
      invalid: {
        color: '#9e2146',
        iconColor: '#9e2146',
      },
    },
    hidePostalCode: true,
  };

  // カード入力状態変更のハンドラー
  const handleElementChange = (event: StripeElementChangeEvent, field: keyof typeof complete) => {
    setError(event.error ? event.error.message : '');
    setComplete((prev) => ({
      ...prev,
      [field]: event.complete,
    }));
  };

  // すべての入力が完了しているか確認
  const isFormComplete = complete.cardNumber && complete.cardExpiry && complete.cardCvc;

  // 現在の支払い方法の取得・保存
  const handleSaveCard = async () => {
    if (!stripe || !elements) {
      setError('Stripeの読み込みに失敗しました。もう一度お試しください。');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const cardNumberElement = elements.getElement(CardNumberElement);
      const cardExpiryElement = elements.getElement(CardExpiryElement);
      const cardCvcElement = elements.getElement(CardCvcElement);

      if (!cardNumberElement || !cardExpiryElement || !cardCvcElement) {
        throw new Error('カード情報の取得に失敗しました');
      }

      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardNumberElement,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (paymentMethod) {
        onPaymentMethodChange(paymentMethod.id);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'カード情報の処理に失敗しました';
      setError(errorMessage);
      onPaymentMethodChange(null);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-md border border-gray-200 p-6">
        <p className="text-sm text-gray-600 mb-4">以下にカード情報を入力してください</p>

        <div className="space-y-4">
          {/* カード番号 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">カード番号</label>
            <div className="border border-gray-300 rounded-md p-3 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
              <CardNumberElement
                options={elementStyle}
                onChange={(e) => handleElementChange(e, 'cardNumber')}
              />
            </div>
          </div>

          {/* 有効期限とCVC（横並び） */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">有効期限</label>
              <div className="border border-gray-300 rounded-md p-3 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
                <CardExpiryElement
                  options={elementStyle}
                  onChange={(e) => handleElementChange(e, 'cardExpiry')}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CVV（3桁）
              </label>
              <div className="border border-gray-300 rounded-md p-3 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
                <CardCvcElement
                  options={elementStyle}
                  onChange={(e) => handleElementChange(e, 'cardCvc')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 補足説明 */}
        <p className="text-xs text-gray-500 mt-3">
          お客様のカード情報は暗号化されて安全に処理されます
        </p>
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleSaveCard}
          disabled={!stripe || processing || !isFormComplete}
        >
          {processing ? '処理中...' : '支払い方法を保存'}
        </Button>
      </div>
    </div>
  );
}

// 親コンポーネント: Stripe Elements プロバイダーと統合
export default function PaymentMethodForm({
  onPaymentMethodChange,
}: {
  onPaymentMethodChange: (paymentMethodId: string | null) => void;
}) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentMethodFormContent onPaymentMethodChange={onPaymentMethodChange} />
    </Elements>
  );
}
