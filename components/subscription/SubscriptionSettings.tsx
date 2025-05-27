// components/subscription/SubscriptionSettings.tsx
'use client';

import { useState, useEffect } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import PaymentMethodForm from '@/components/subscription/PaymentMethodForm';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { getPlanNameInJapanese } from '@/lib/utils';
import { HiCheck, HiOutlineOfficeBuilding } from 'react-icons/hi';
import { FiUsers } from 'react-icons/fi';
import { HiUser, HiOfficeBuilding } from 'react-icons/hi';

// ご利用プラン種類の型定義
type SubscriptionPlan = 'monthly' | 'yearly' | 'starter' | 'business' | 'enterprise';
type SubscriptionInterval = 'month' | 'year';
type PlanPriceIdKey = keyof typeof PLAN_PRICE_IDS;

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
  // 個人プラン
  monthly: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID || 'price_monthly_placeholder',
  yearly: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID || 'price_yearly_placeholder',

  // 法人プラン
  starter: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || 'price_starter_placeholder',
  business: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID || 'price_business_placeholder',
  enterprise: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_placeholder',
};

// 年間プランのpriceIdを取得する関数
const getYearlyPriceId = (plan: SubscriptionPlan): string => {
  switch (plan) {
    case 'starter':
      return (
        process.env.NEXT_PUBLIC_STRIPE_STARTER_YEARLY_PRICE_ID || 'price_starter_yearly_placeholder'
      );
    case 'business':
      return (
        process.env.NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PRICE_ID ||
        'price_business_yearly_placeholder'
      );
    case 'enterprise':
      return (
        process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_YEARLY_PRICE_ID ||
        'price_enterprise_yearly_placeholder'
      );
    default:
      // 安全なキャスト
      return PLAN_PRICE_IDS[plan as PlanPriceIdKey];
  }
};

const renderFeatures = (plan: SubscriptionPlan) => {
  switch (plan) {
    case 'starter':
      return STARTER_FEATURES;
    case 'business':
      return BUSINESS_FEATURES;
    case 'enterprise':
      return ENTERPRISE_FEATURES;
    default:
      return [];
  }
};

// 法人プランの特徴リストを更新
const STARTER_FEATURES = [
  '最大10名のユーザー管理',
  '共通カラーテーマ設定',
  '会社ロゴ表示',
  'メールサポート',
];

const BUSINESS_FEATURES = [
  '最大30名のユーザー管理',
  '部署/チーム分け機能',
  '高度なカスタマイズ',
  '優先サポート（営業時間内）',
];

const ENTERPRISE_FEATURES = [
  '最大50名のユーザー管理',
  '高度なユーザー権限設定',
  'カスタムドメイン設定',
  '専任サポート担当者',
];

export default function SubscriptionSettings() {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('monthly');
  const [selectedInterval, setSelectedInterval] = useState<SubscriptionInterval>('month');
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
      const data = await response.json();

      if (!response.ok) {
        // エラーのハンドリングを改善
        const errorCode = data.code || '';
        const declineCode = data.decline_code || '';

        let errorMessage = data.error || 'プランの作成に失敗しました';

        // より具体的なエラーメッセージの設定
        if (errorCode === 'card_declined') {
          if (declineCode === 'insufficient_funds') {
            errorMessage = 'カードの残高が不足しています。別のカードでお試しください。';
          } else if (declineCode === 'expired_card') {
            errorMessage = 'カードの有効期限が切れています。別のカードでお試しください。';
          } else if (declineCode === 'incorrect_cvc') {
            errorMessage = 'カードのセキュリティコードが正しくありません。確認してお試しください。';
          } else {
            errorMessage = 'カードが拒否されました。別のカードでお試しください。';
          }
        }

        throw new Error(errorMessage);
      }

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

      // 選択されたプランと契約期間に応じたpriceIdを取得
      const priceId =
        selectedInterval === 'year'
          ? getYearlyPriceId(selectedPlan)
          : PLAN_PRICE_IDS[selectedPlan as keyof typeof PLAN_PRICE_IDS];

      console.log('法人プラン申し込みデータ:', {
        plan: selectedPlan,
        interval: selectedInterval,
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
          interval: selectedInterval,
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
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex shadow-sm">
            <button
              data-plan-type="individual"
              className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-all duration-300 transform ${
                !showCorporatePlans
                  ? 'bg-blue-600 text-white shadow-md scale-105 active'
                  : 'bg-white text-blue-600 hover:bg-blue-700 hover:text-white hover:shadow-md hover:scale-105'
              }`}
              onClick={() => setShowCorporatePlans(false)}
            >
              <HiUser className="h-5 w-5" />
              個人プラン
            </button>
            <button
              data-plan-type="corporate"
              className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-all duration-300 transform ${
                showCorporatePlans
                  ? 'bg-blue-900 text-white shadow-md scale-105 active'
                  : 'bg-white text-blue-900 hover:bg-blue-800 hover:text-white hover:shadow-md hover:scale-105'
              }`}
              onClick={() => setShowCorporatePlans(true)}
            >
              <HiOfficeBuilding className="h-5 w-5" />
              法人プラン
            </button>
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
              <button
                onClick={handleSubscribe}
                disabled={!paymentMethodId || processing}
                className="px-8 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 hover:text-white disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200"
              >
                {processing ? (
                  <div className="flex items-center">
                    <Spinner size="sm" className="mr-2" />
                    処理中...
                  </div>
                ) : (
                  '登録する'
                )}
              </button>
            </div>
          </div>
        )}

        {/* 法人プラン */}
        {showCorporatePlans && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">法人プランを選択</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* スタータープラン */}
              <motion.div
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedPlan === 'starter' ? 'border-[#1E3A8A] bg-[#1E3A8A]/5' : 'border-gray-200'
                }`}
                onClick={() => setSelectedPlan('starter')}
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
                      ¥{selectedInterval === 'month' ? '3,000' : '30,000'}
                      <span className="text-sm font-normal text-gray-500">
                        /{selectedInterval === 'month' ? '月' : '年'}
                      </span>
                    </p>

                    {/* 月額/年額切り替えボタン */}
                    <div className="flex space-x-2 mt-3 mb-3">
                      <button
                        type="button"
                        className={`text-xs px-2 py-1 rounded-full transition-colors ${
                          selectedInterval === 'month'
                            ? 'bg-[#1E3A8A] text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation(); // 親要素のクリックイベントを防止
                          setSelectedInterval('month');
                        }}
                      >
                        月額
                      </button>
                      <button
                        type="button"
                        className={`text-xs px-2 py-1 rounded-full transition-colors ${
                          selectedInterval === 'year'
                            ? 'bg-[#1E3A8A] text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation(); // 親要素のクリックイベントを防止
                          setSelectedInterval('year');
                        }}
                      >
                        年額（16%お得）
                      </button>
                    </div>

                    <div className="mt-3 mb-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <FiUsers className="mr-1" /> 最大10名
                      </span>
                    </div>
                    <ul className="mt-4 space-y-2 text-sm">
                      {renderFeatures('starter').map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <HiCheck className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* 登録ボタン */}
                    <div className="mt-4">
                      <button
                        onClick={handleCorporateSubscribe}
                        disabled={!paymentMethodId || processing || selectedPlan !== 'starter'}
                        className="w-full bg-blue-900 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-800 hover:text-white disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        {processing && selectedPlan === 'starter' ? (
                          <div className="flex items-center justify-center">
                            <Spinner size="sm" className="mr-2" />
                            処理中...
                          </div>
                        ) : (
                          '選択して申し込む'
                        )}
                      </button>
                    </div>
                  </div>
                  {selectedPlan === 'starter' && (
                    <div className="bg-[#1E3A8A] rounded-full p-1">
                      <HiCheck className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              </motion.div>

              {/* ビジネスプラン */}
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
                      <h3 className="font-semibold">ビジネスプラン</h3>
                    </div>
                    <p className="text-2xl font-bold mt-2">
                      ¥{selectedInterval === 'month' ? '6,000' : '60,000'}
                      <span className="text-sm font-normal text-gray-500">
                        /{selectedInterval === 'month' ? '月' : '年'}
                      </span>
                    </p>

                    {/* 月額/年額切り替えボタン */}
                    <div className="flex space-x-2 mt-3 mb-3">
                      <button
                        type="button"
                        className={`text-xs px-2 py-1 rounded-full transition-colors ${
                          selectedInterval === 'month'
                            ? 'bg-[#1E3A8A] text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation(); // 親要素のクリックイベントを防止
                          setSelectedInterval('month');
                        }}
                      >
                        月額
                      </button>
                      <button
                        type="button"
                        className={`text-xs px-2 py-1 rounded-full transition-colors ${
                          selectedInterval === 'year'
                            ? 'bg-[#1E3A8A] text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation(); // 親要素のクリックイベントを防止
                          setSelectedInterval('year');
                        }}
                      >
                        年額（16%お得）
                      </button>
                    </div>

                    <div className="mt-3 mb-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <FiUsers className="mr-1" /> 最大30名
                      </span>
                    </div>
                    <ul className="mt-4 space-y-2 text-sm">
                      {renderFeatures('business').map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <HiCheck className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* 登録ボタン */}
                    <div className="mt-4">
                      <button
                        onClick={handleCorporateSubscribe}
                        disabled={!paymentMethodId || processing || selectedPlan !== 'starter'}
                        className="w-full bg-blue-900 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-800 hover:text-white disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        {processing && selectedPlan === 'starter' ? (
                          <div className="flex items-center justify-center">
                            <Spinner size="sm" className="mr-2" />
                            処理中...
                          </div>
                        ) : (
                          '選択して申し込む'
                        )}
                      </button>
                    </div>
                  </div>
                  {selectedPlan === 'business' && (
                    <div className="bg-[#1E3A8A] rounded-full p-1">
                      <HiCheck className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              </motion.div>

              {/* エンタープライズプラン */}
              <motion.div
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedPlan === 'enterprise'
                    ? 'border-[#1E3A8A] bg-[#1E3A8A]/5'
                    : 'border-gray-200'
                }`}
                onClick={() => setSelectedPlan('enterprise')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <HiOutlineOfficeBuilding className="h-5 w-5 text-[#1E3A8A] mr-2" />
                      <h3 className="font-semibold">エンタープライズプラン</h3>
                    </div>
                    <p className="text-2xl font-bold mt-2">
                      ¥{selectedInterval === 'month' ? '9,000' : '90,000'}
                      <span className="text-sm font-normal text-gray-500">
                        /{selectedInterval === 'month' ? '月' : '年'}
                      </span>
                    </p>

                    {/* 月額/年額切り替えボタン */}
                    <div className="flex space-x-2 mt-3 mb-3">
                      <button
                        type="button"
                        className={`text-xs px-2 py-1 rounded-full transition-colors ${
                          selectedInterval === 'month'
                            ? 'bg-blue-900 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation(); // 親要素のクリックイベントを防止
                          setSelectedInterval('month');
                        }}
                      >
                        月額
                      </button>
                      <button
                        type="button"
                        className={`text-xs px-2 py-1 rounded-full transition-colors ${
                          selectedInterval === 'year'
                            ? 'bg-[#1E3A8A] text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation(); // 親要素のクリックイベントを防止
                          setSelectedInterval('year');
                        }}
                      >
                        年額（16%お得）
                      </button>
                    </div>

                    <div className="mt-3 mb-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <FiUsers className="mr-1" /> 最大50名
                      </span>
                    </div>
                    <ul className="mt-4 space-y-2 text-sm">
                      {renderFeatures('enterprise').map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <HiCheck className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* 登録ボタン */}
                    <div className="mt-4">
                      <button
                        onClick={handleCorporateSubscribe}
                        disabled={!paymentMethodId || processing || selectedPlan !== 'starter'}
                        className="w-full bg-blue-900 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-800 hover:text-white disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        {processing && selectedPlan === 'starter' ? (
                          <div className="flex items-center justify-center">
                            <Spinner size="sm" className="mr-2" />
                            処理中...
                          </div>
                        ) : (
                          '選択して申し込む'
                        )}
                      </button>
                    </div>
                  </div>
                  {selectedPlan === 'enterprise' && (
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
              <button
                onClick={handleCorporateSubscribe}
                disabled={!paymentMethodId || processing}
                className="px-8 py-2 bg-blue-900 text-white font-medium rounded-md hover:bg-blue-800 hover:text-white disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200"
              >
                {processing ? (
                  <div className="flex items-center">
                    <Spinner size="sm" className="mr-2" />
                    処理中...
                  </div>
                ) : (
                  '申し込む'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}