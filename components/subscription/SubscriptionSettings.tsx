// components/subscription/SubscriptionSettings.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import PaymentMethodForm from '@/components/subscription/PaymentMethodForm';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { HiCheck } from 'react-icons/hi';

// サブスクリプションプランの型定義
type SubscriptionPlan = 'monthly' | 'yearly' | 'business';

// 各プランのプレースホルダーpriceIdを設定
// 注: 環境変数が設定されていない場合にはデフォルト値を使用
const PLAN_PRICE_IDS = {
    monthly: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID || 'price_monthly_placeholder',
    yearly: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID || 'price_yearly_placeholder',
    business: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID || 'price_business_placeholder',
};

export default function SubscriptionSettings() {
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('monthly');
    const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    // サブスクリプション作成処理
    const handleSubscribe = async () => {
        if (!paymentMethodId) {
            toast.error('支払い方法を入力してください');
            return;
        }

        try {
            setProcessing(true);

            // 選択されたプランに対応するpriceIdを取得
            const priceId = PLAN_PRICE_IDS[selectedPlan];

            console.log('送信するデータ:', {
                plan: selectedPlan,
                priceId,
                paymentMethodId,
            });

            // サブスクリプション作成APIを呼び出す
            const response = await fetch('/api/subscription/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan: selectedPlan,
                    priceId: priceId,
                    paymentMethodId: paymentMethodId,
                }),
            });

            // レスポンスの処理
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'サブスクリプションの作成に失敗しました');
            }

            const data = await response.json();
            console.log('API response:', data);

            // 成功メッセージを表示
            toast.success('サブスクリプションが正常に作成されました');

            // 画面をリロード
            setTimeout(() => {
                window.location.reload();
            }, 1500);

        } catch (error: unknown) {
            console.error('サブスクリプション作成エラー:', error);
            const errorMessage = error instanceof Error ? error.message : 'エラーが発生しました';
            toast.error(errorMessage);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div id="subscription-plans" className="space-y-6">
            <div className="space-y-6">

                {/* プラン選択 */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                    <h2 className="text-xl font-semibold mb-4">プランを選択</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {/* 月額プラン */}
                        <motion.div
                            className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedPlan === 'monthly' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                }`}
                            onClick={() => setSelectedPlan('monthly')}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold">月額プラン</h3>
                                    <p className="text-2xl font-bold mt-2">¥500 <span className="text-sm font-normal text-gray-500">/月</span></p>
                                    <ul className="mt-4 space-y-2 text-sm">
                                        <li className="flex items-center">
                                            <HiCheck className="h-4 w-4 text-green-500 mr-2" />
                                            全機能利用可能
                                        </li>
                                        <li className="flex items-center">
                                            <HiCheck className="h-4 w-4 text-green-500 mr-2" />
                                            いつでもキャンセル可能
                                        </li>
                                        <li className="flex items-center">
                                            <HiCheck className="h-4 w-4 text-green-500 mr-2" />
                                            月単位の更新
                                        </li>
                                    </ul>
                                </div>
                                {selectedPlan === 'monthly' && (
                                    <div className="bg-blue-500 rounded-full p-1">
                                        <HiCheck className="h-4 w-4 text-white" />
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* 年額プラン */}
                        <motion.div
                            className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedPlan === 'yearly' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                }`}
                            onClick={() => setSelectedPlan('yearly')}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center">
                                        <h3 className="font-semibold">年額プラン</h3>
                                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">お得</span>
                                    </div>
                                    <p className="text-2xl font-bold mt-2">¥5,000 <span className="text-sm font-normal text-gray-500">/年</span></p>
                                    <p className="text-xs text-green-600">2ヶ月分お得</p>
                                    <ul className="mt-4 space-y-2 text-sm">
                                        <li className="flex items-center">
                                            <HiCheck className="h-4 w-4 text-green-500 mr-2" />
                                            全機能利用可能
                                        </li>
                                        <li className="flex items-center">
                                            <HiCheck className="h-4 w-4 text-green-500 mr-2" />
                                            お得な年間料金
                                        </li>
                                        <li className="flex items-center">
                                            <HiCheck className="h-4 w-4 text-green-500 mr-2" />
                                            年に一度の更新
                                        </li>
                                    </ul>
                                </div>
                                {selectedPlan === 'yearly' && (
                                    <div className="bg-blue-500 rounded-full p-1">
                                        <HiCheck className="h-4 w-4 text-white" />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* 支払い方法入力 */}
                    <h3 className="font-semibold mb-3">お支払い方法</h3>
                    <PaymentMethodForm onPaymentMethodChange={setPaymentMethodId} />

                    {/* 登録/変更ボタン */}
                    <div className="mt-6 flex justify-end">
                        <Button
                            onClick={handleSubscribe}
                            disabled={!paymentMethodId || processing}
                            className="px-8"
                        >
                            {processing ? (
                                <>
                                    <Spinner size="sm" className="mr-2" />
                                    処理中...
                                </>
                            ) : '仮登録する（デモ用）'}
                        </Button>
                    </div>
                </div>

                {/* 近日公開バナー */}
                <div className="bg-blue-50 text-blue-800 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-semibold">開発中の機能</h3>
                    <p className="text-sm mt-1 text-justify">法人プランは現在開発中です。近日中に公開予定です。</p>
                </div>
            </div>
        </div>
    );
}