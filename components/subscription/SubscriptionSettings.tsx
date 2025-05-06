// components/subscription/SubscriptionSettings.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import PaymentMethodForm from '@/components/subscription/PaymentMethodForm';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { getPlanNameInJapanese } from '@/lib/utils';
import { HiCheck, HiOutlineOfficeBuilding } from 'react-icons/hi';
import { FiUsers } from 'react-icons/fi';
import { HiUser, HiOfficeBuilding } from 'react-icons/hi';

// ご利用プラン種類の型定義
type SubscriptionPlan = 'monthly' | 'yearly' | 'business' | 'business_plus';

interface SubscriptionData {
  id: string;
  subscriptionId?: string;
  tenantId?: string;
}

interface SubscriptionResponse {
  success: boolean;
  subscription: {
    id: string;
    status: string;
    plan: string;
    // その他のプロパティを適切に定義
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
    trialEnd?: string | null;
  };
  tenant?: {
    id: string;
    name: string;
    logoUrl?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
    // 必要に応じて他のプロパティも定義
  };
  clientSecret?: string;
  message: string;
  redirectUrl?: string;
}

// 各プランのプレースホルダーpriceIdを設定
const PLAN_PRICE_IDS = {
  monthly: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID || 'price_monthly_placeholder',
  yearly: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID || 'price_yearly_placeholder',
  business: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID || 'price_business_placeholder',
  business_plus: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PLUS_PRICE_ID || 'price_business_plus_placeholder',
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

  // 法人プラン申し込み完了状態の管理
  const [corporateSubscribed, setCorporateSubscribed] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);

  useEffect(() => {
    if (subscriptionData && corporateSubscribed) {
      console.log('サブスクリプション登録完了:', subscriptionData);
      // リダイレクトURLにテナントIDを含める
      const redirectPath = `/dashboard/corporate/onboarding?tenant=${subscriptionData.tenantId}`;
      setTimeout(() => {
        window.location.href = redirectPath;
      }, 2000);
    }
  }, [subscriptionData, corporateSubscribed]);

  // 個人プラン作成処理
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

  // 法人プラン申し込み処理
  const handleCorporateSubscribe = async () => {
    if (!paymentMethodId) {
      toast.error('支払い方法を入力してください');
      return;
    }

    try {
      setProcessing(true);

      // 選択されたプランに対応するpriceIdを取得
      const priceId = PLAN_PRICE_IDS[selectedPlan];

      console.log('法人プラン申し込みデータ:', {
        plan: selectedPlan,
        priceId,
        paymentMethodId,
        isCorporate: true,
      });

      // 法人プラン登録APIを呼び出す
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          priceId: priceId,
          paymentMethodId: paymentMethodId,
          isCorporate: true,
        }),
      });

      // レスポンスの処理
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'プランの作成に失敗しました');
      }

      const data: SubscriptionResponse = await response.json();
      console.log('法人プラン登録レスポンス:', data);

      // 成功メッセージを表示
      toast.success('法人プランの登録が完了しました！');

      // 型定義に合わせてデータを保存
      if (data.subscription && data.tenant) {
        setSubscriptionData({
          id: data.subscription.id,
          subscriptionId: data.subscription.id,
          tenantId: data.tenant.id,
        });
      }

      // 法人プラン申し込み完了フラグをセット
      setCorporateSubscribed(true);

      // リダイレクトURLがあればそこに遷移
      if (data.redirectUrl) {
        setTimeout(() => {
          window.location.href = data.redirectUrl as string;
        }, 2000);
      } else {
        // 通常のダッシュボードへ
        setTimeout(() => {
          window.location.href = '/dashboard/corporate/onboarding';
        }, 2000);
      }
    } catch (error) {
      console.error('法人プラン登録エラー:', error);
      const errorMessage = error instanceof Error ? error.message : 'エラーが発生しました';
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  // 法人プラン申し込み完了後のリダイレクト中画面
  if (corporateSubscribed) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 my-6 text-center">
        <div className="flex flex-col items-center">
          <Spinner size="lg" className="mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {getPlanNameInJapanese(selectedPlan)}の設定を完了しています
          </h2>
          <p className="text-gray-600 mb-4">
            まもなく初期設定ページに移動します。しばらくお待ちください...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="subscription-plans" className="space-y-6">
      <div className="space-y-6">
        {/* タブスタイルの切り替え */}
        <div className="mb-6">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex">
            <Button
              className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                !showCorporatePlans
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-blue-600 hover:bg-blue-600 hover:text-white'
              }`}
              onClick={() => setShowCorporatePlans(false)}
            >
              <HiUser className="h-5 w-5" />
              個人プラン
            </Button>
            <Button
              className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                showCorporatePlans
                  ? 'bg-[#1E3A8A] text-white'
                  : 'bg-white text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white'
              }`}
              onClick={() => setShowCorporatePlans(true)}
            >
              <HiOfficeBuilding className="h-5 w-5" />
              法人プラン
            </Button>
          </div>
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
                  selectedPlan === 'business'
                    ? 'border-[#1E3A8A] bg-[#1E3A8A]/5'
                    : 'border-gray-200'
                }`}
                onClick={() => setSelectedPlan('business')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <HiOutlineOfficeBuilding className="h-5 w-5 text-[#1E3A8A] mr-2" />
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

                    {/* 登録ボタン */}
                    <div className="mt-4">
                      <Button
                        onClick={handleCorporateSubscribe}
                        disabled={!paymentMethodId || processing || selectedPlan !== 'business'}
                        className="w-full bg-[#1E3A8A] hover:bg-[#122153]"
                        size="sm"
                      >
                        {processing && selectedPlan === 'business' ? (
                          <>
                            <Spinner size="sm" className="mr-2" />
                            処理中...
                          </>
                        ) : (
                          '選択して申し込む'
                        )}
                      </Button>
                    </div>
                  </div>
                  {selectedPlan === 'business' && (
                    <div className="bg-[#1E3A8A] rounded-full p-1">
                      <HiCheck className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              </motion.div>

              {/* ビジネスプラン */}
              <motion.div
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedPlan === 'business_plus' 
                    ? 'border-[#1E3A8A] bg-[#1E3A8A]/5' 
                    : 'border-gray-200'
                }`}
                onClick={() => setSelectedPlan('business_plus')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <HiOutlineOfficeBuilding className="h-5 w-5 text-[#1E3A8A] mr-2" />
                      <h3 className="font-semibold">ビジネスプラン</h3>
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
                    <ul className="mt-4 space-y-2 text-sm">
                      {BUSINESS_PLUS_FEATURES.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <HiCheck className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* ビジネスプラン選択ボタン - 有効化 */}
                    <div className="mt-4">
                      <Button
                        onClick={handleCorporateSubscribe}
                        disabled={!paymentMethodId || processing || selectedPlan !== 'business_plus'}
                        className="w-full bg-[#1E3A8A] hover:bg-[#122153]"
                        size="sm"
                      >
                        {processing && selectedPlan === 'business_plus' ? (
                          <>
                            <Spinner size="sm" className="mr-2" />
                            処理中...
                          </>
                        ) : (
                          '選択して申し込む'
                        )}
                      </Button>
                    </div>
                  </div>
                  {selectedPlan === 'business_plus' && (
                    <div className="bg-[#1E3A8A] rounded-full p-1">
                      <HiCheck className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* 追加オプションの情報 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">追加オプション</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-[#1E3A8A] mr-2">•</span>
                  <span>
                    <strong>追加ユーザー</strong>: スタータープラン 300円/ユーザー/月
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#1E3A8A] mr-2">•</span>
                  <span>
                    <strong>カスタムQRコードデザイン</strong>: 10,000円（一括）
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#1E3A8A] mr-2">•</span>
                  <span>
                    <strong>NFCタグ作成</strong>: 1,500円/枚（10枚以上で割引）
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#1E3A8A] mr-2">•</span>
                  <span>
                    <strong>オンサイトトレーニング</strong>: 50,000円/回
                  </span>
                </li>
              </ul>
            </div>

            {/* 支払い方法入力 */}
            <h3 className="font-semibold mb-3">お支払い方法</h3>
            <PaymentMethodForm onPaymentMethodChange={setPaymentMethodId} />

            {/* 登録/変更ボタン */}
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleCorporateSubscribe}
                disabled={!paymentMethodId || processing}
                className="px-8 bg-[#1E3A8A] hover:bg-[#122153]"
              >
                {processing ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    処理中...
                  </>
                ) : (
                  '申し込む'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}