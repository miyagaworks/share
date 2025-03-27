'use client';

// components/subscription/PaymentMethodForm.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { loadStripe } from '@stripe/stripe-js';
import {
    CardElement,
    Elements,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import type { StripeCardElementChangeEvent } from '@stripe/stripe-js';

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
    const [complete, setComplete] = useState(false);

    // カード要素のスタイル
    const cardStyle = {
        style: {
            base: {
                fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                    color: '#aab7c4',
                },
            },
            invalid: {
                color: '#9e2146',
                iconColor: '#9e2146',
            },
        },
    };

    // カード入力状態変更のハンドラー
    const handleCardChange = (event: StripeCardElementChangeEvent) => {
        setError(event.error ? event.error.message : '');
        setComplete(event.complete);
    };

    // 現在の支払い方法の取得・保存
    const handleSaveCard = async () => {
        if (!stripe || !elements) {
            setError('Stripeの読み込みに失敗しました。もう一度お試しください。');
            return;
        }

        setProcessing(true);
        setError(null);

        try {
            const cardElement = elements.getElement(CardElement);

            if (!cardElement) {
                throw new Error('カード情報の取得に失敗しました');
            }

            const { error, paymentMethod } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardElement,
            });

            if (error) {
                throw new Error(error.message);
            }

            if (paymentMethod) {
                onPaymentMethodChange(paymentMethod.id);
                setComplete(true);
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
        <div className="space-y-4">
            <div className="bg-white rounded-md border border-gray-200 p-4">
                <CardElement
                    options={cardStyle}
                    onChange={handleCardChange}
                    className="py-2"
                />
            </div>

            {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                    {error}
                </div>
            )}

            <div className="flex justify-end">
                <Button
                    type="button"
                    onClick={handleSaveCard}
                    disabled={!stripe || processing || !complete}
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