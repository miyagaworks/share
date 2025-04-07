// components/subscription/SubscriptionSettings.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import PaymentMethodForm from '@/components/subscription/PaymentMethodForm';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { HiCheck, HiOutlineOfficeBuilding } from 'react-icons/hi';
import { FiUsers } from 'react-icons/fi';

// ご利用プランプランの型定義
type SubscriptionPlan = 'monthly' | 'yearly' | 'business';

// 各プランのプレースホルダーpriceIdを設定
// 注: 環境変数が設定されていない場合にはデフォルト値を使用
const PLAN_PRICE_IDS = {
  monthly: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID || 'price_monthly_placeholder',
  yearly: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID || 'price_yearly_placeholder',
  business: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID || 'price_business_placeholder',
};

// 法人プランの特徴リスト
const BUSINESS_FEATURES = [
  '最大10名のユーザー管理',
  '共通カラーテーマ設定',
  '会社ロゴ表示',
  'メールサポート',
];

const BUSINESS_PLUS_FEATURES = [
  '最大50名のユーザー管理',
  '部署/チーム分け機能',
  '高度なユーザー権限設定',
  '優先サポート（営業時間内）',
];

export default function SubscriptionSettings() {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('monthly');
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showCorporatePlans, setShowCorporatePlans] = useState(false);

  // ご利用プラン作成処理
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

      // ご利用プラン作成APIを呼び出す
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
        throw new Error(errorData.error || 'プランの作成に失敗しました');
      }

      const data = await response.json();
      console.log('API response:', data);

      // 成功メッセージを表示
      toast.success('プランが正常に作成されました');

      // 画面をリロード
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: unknown) {
      console.error('ご利用プラン作成エラー:', error);
      const errorMessage = error instanceof Error ? error.message : 'エラーが発生しました';
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  // 法人プラン申し込み処理（問い合わせフォームへ）
  const handleCorporateInquiry = () => {
    // 法人プランはお問い合わせフォームから申し込み
    window.location.href = '/support/contact?subject=法人プラン申し込み&plan=' + selectedPlan;
  };

  return (
    <div id="subscription-plans" className="space-y-6">
      <div className="space-y-6">
        {/* タブスタイルの切り替え */}
        <div className="bg-white rounded-lg border border-gray-200 p-1 flex">
          <button
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${!showCorporatePlans ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
            onClick={() => setShowCorporatePlans(false)}
          >
            個人プラン
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${showCorporatePlans ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
            onClick={() => setShowCorporatePlans(true)}
          >
            法人プラン
          </button>
        </div>

        {/* 個人プラン */}
        {!showCorporatePlans && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">プランを選択</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* 月額プラン */}
              <motion.div
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedPlan === 'monthly' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setSelectedPlan('monthly')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">月額プラン</h3>
                    <p className="text-2xl font-bold mt-2">
                      ¥500 <span className="text-sm font-normal text-gray-500">/月</span>
                    </p>
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
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedPlan === 'yearly' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setSelectedPlan('yearly')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <h3 className="font-semibold">年額プラン</h3>
                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        お得
                      </span>
                    </div>
                    <p className="text-2xl font-bold mt-2">
                      ¥5,000 <span className="text-sm font-normal text-gray-500">/年</span>
                    </p>
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
                ) : (
                  '登録する'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* 法人プラン */}
        {showCorporatePlans && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">法人プランを選択</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* スタータープラン */}
              <motion.div
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedPlan === 'business' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setSelectedPlan('business')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <HiOutlineOfficeBuilding className="h-5 w-5 text-blue-600 mr-2" />
                      <h3 className="font-semibold">スタータープラン</h3>
                    </div>
                    <p className="text-2xl font-bold mt-2">
                      ¥3,000 <span className="text-sm font-normal text-gray-500">/月</span>
                    </p>
                    <p className="text-sm text-gray-500">年間契約: ¥30,000/年</p>
                    <div className="mt-3 mb-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <FiUsers className="mr-1" /> 最大10名
                      </span>
                    </div>
                    <ul className="mt-4 space-y-2 text-sm">
                      {BUSINESS_FEATURES.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <HiCheck className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {selectedPlan === 'business' && (
                    <div className="bg-blue-500 rounded-full p-1">
                      <HiCheck className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              </motion.div>

              {/* ビジネスプラン */}
              <div className="border rounded-lg p-4 border-gray-200 bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <HiOutlineOfficeBuilding className="h-5 w-5 text-blue-600 mr-2" />
                      <h3 className="font-semibold">ビジネスプラン</h3>
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        近日公開
                      </span>
                    </div>
                    <p className="text-2xl font-bold mt-2">
                      ¥12,000 <span className="text-sm font-normal text-gray-500">/月</span>
                    </p>
                    <p className="text-sm text-gray-500">年間契約: ¥120,000/年</p>
                    <div className="mt-3 mb-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <FiUsers className="mr-1" /> 最大50名
                      </span>
                    </div>
                    <ul className="mt-4 space-y-2 text-sm text-gray-500">
                      {BUSINESS_PLUS_FEATURES.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <HiCheck className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 追加オプションの情報 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">追加オプション</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>
                    <strong>追加ユーザー</strong>: スタータープラン 300円/ユーザー/月
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>
                    <strong>カスタムQRコードデザイン</strong>: 20,000円（一括）
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>
                    <strong>NFCカード作成</strong>: 1,500円/枚（10枚以上で割引）
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>
                    <strong>オンサイトトレーニング</strong>: 50,000円/回
                  </span>
                </li>
              </ul>
            </div>

            {/* 法人プラン用ご案内 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-800">法人プランのお申し込み方法</h3>
              <p className="text-sm text-blue-700 mt-1">
                法人プランをご希望の場合は、以下の「お問い合わせ」ボタンからお申し込みください。担当者より詳細をご案内いたします。
              </p>
            </div>

            {/* 登録/変更ボタン */}
            <div className="mt-6 flex justify-end">
              <Button onClick={handleCorporateInquiry} className="px-8">
                お問い合わせ
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}