// components/subscription/SubscriptionSettings.tsx (法人契約中ユーザー対応版)
'use client';
import { useState, useEffect } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import PaymentMethodForm from '@/components/subscription/PaymentMethodForm';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { getPlanNameInJapanese } from '@/lib/utils';
import { HiCheck, HiOutlineOfficeBuilding, HiExclamationCircle } from 'react-icons/hi';
import { FiUsers } from 'react-icons/fi';
import { HiUser, HiOfficeBuilding } from 'react-icons/hi';
// 🔥 新規追加: 法人契約中ユーザーの判定用Hook
import { useDashboardInfo } from '@/hooks/useDashboardInfo';
// 型定義
type SubscriptionPlan = 'monthly' | 'yearly' | 'starter' | 'business' | 'enterprise';
type SubscriptionInterval = 'month' | 'year';
type PlanPriceIdKey = keyof typeof PLAN_PRICE_IDS;
const PLAN_PRICE_IDS = {
  monthly: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID || 'price_monthly_placeholder',
  yearly: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID || 'price_yearly_placeholder',
  starter: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || 'price_starter_placeholder',
  business: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID || 'price_business_placeholder',
  enterprise: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_placeholder',
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
  // 🔥 新規追加: 法人契約中ユーザーの状態管理
  const { data: dashboardInfo } = useDashboardInfo();
  const [isCorporateUser, setIsCorporateUser] = useState(false);
  const [showIndividualWarning, setShowIndividualWarning] = useState(false);
  // 法人プラン切り替え警告の状態管理
  const [showCorporateWarning, setShowCorporateWarning] = useState(false);
  const [hasIndividualData, setHasIndividualData] = useState(false);
  // 🔥 削除: 未使用の状態変数を削除
  // 🔥 新規追加: 法人契約中ユーザーの判定とタブ初期設定
  useEffect(() => {
    if (dashboardInfo?.permissions) {
      const isCorpUser =
        dashboardInfo.permissions.userType === 'corporate' ||
        dashboardInfo.permissions.userType === 'invited-member' ||
        dashboardInfo.permissions.hasCorpAccess;
        userType: dashboardInfo.permissions.userType,
        hasCorpAccess: dashboardInfo.permissions.hasCorpAccess,
        isCorpUser,
      });
      setIsCorporateUser(isCorpUser);
      // 🔥 法人契約中ユーザーは法人プランタブをデフォルト表示
      if (isCorpUser) {
        setShowCorporatePlans(true);
      }
    }
  }, [dashboardInfo]);
  // 個人データの存在チェック
  useEffect(() => {
    const checkIndividualData = async () => {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          const hasData =
            data.user?.customLinks?.length > 0 ||
            data.user?.snsLinks?.length > 0 ||
            data.user?.displayName ||
            data.user?.bio;
          setHasIndividualData(hasData);
        }
      } catch (error) {
      }
    };
    checkIndividualData();
  }, []);
  // 🔥 新規追加: 法人契約中ユーザーが個人プランタブをクリックした場合の処理
  const handleIndividualPlanClick = () => {
    if (isCorporateUser) {
      setShowIndividualWarning(true);
    } else {
      setShowCorporatePlans(false);
    }
  };
  // 法人プラン切り替え時の警告表示
  const handleCorporatePlanSelection = () => {
    if (isCorporateUser) {
      // 既に法人契約中なら直接表示
      setShowCorporatePlans(true);
    } else if (hasIndividualData) {
      setShowCorporateWarning(true);
    } else {
      setShowCorporatePlans(true);
    }
  };
  // 警告承諦後の処理
  const handleAcceptWarning = () => {
    setShowCorporateWarning(false);
    setShowCorporatePlans(true);
  };
  // 🔥 新規追加: 法人プラン申し込み処理（簡略版）
  const handleCorporateSubscribe = async () => {
    if (!paymentMethodId) {
      toast.error('支払い方法を入力してください');
      return;
    }
    try {
      setProcessing(true);
      // 選択されたプランと契約期間に応じたpriceIdを取得
      const getYearlyPriceId = (plan: SubscriptionPlan): string => {
        switch (plan) {
          case 'starter':
            return (
              process.env.NEXT_PUBLIC_STRIPE_STARTER_YEARLY_PRICE_ID ||
              'price_starter_yearly_placeholder'
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
            return PLAN_PRICE_IDS[plan as PlanPriceIdKey];
        }
      };
      const priceId =
        selectedInterval === 'year'
          ? getYearlyPriceId(selectedPlan)
          : PLAN_PRICE_IDS[selectedPlan as keyof typeof PLAN_PRICE_IDS];
        plan: selectedPlan,
        interval: selectedInterval,
        priceId,
        paymentMethodId,
        isCorporate: true,
      });
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
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'プランの作成に失敗しました');
      }
      const data = await response.json();
      toast.success('法人プランの登録が完了しました！');
      // リダイレクト処理
      if (data.redirectUrl) {
        setTimeout(() => {
          window.location.href = data.redirectUrl;
        }, 2000);
      } else {
        setTimeout(() => {
          window.location.href = '/dashboard/corporate/onboarding';
        }, 2000);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'エラーが発生しました';
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };
  // 個人プラン作成処理
  const handleSubscribe = async () => {
    if (!paymentMethodId) {
      toast.error('支払い方法を入力してください');
      return;
    }
    try {
      setProcessing(true);
      const priceId = PLAN_PRICE_IDS[selectedPlan];
        plan: selectedPlan,
        priceId,
        paymentMethodId,
      });
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          priceId: priceId,
          paymentMethodId: paymentMethodId,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        const errorCode = data.code || '';
        const declineCode = data.decline_code || '';
        let errorMessage = data.error || 'プランの作成に失敗しました';
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
      toast.success('プランが正常に作成されました');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'エラーが発生しました';
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };
  // 🔥 新規追加: 法人→個人への移行不可警告モーダル
  if (showIndividualWarning) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* 警告ヘッダー */}
            <div className="flex items-center mb-4">
              <HiExclamationCircle className="h-8 w-8 text-blue-500 mr-3" />
              <h2 className="text-xl font-bold text-gray-900">個人プランへの移行について</h2>
            </div>
            {/* 警告メッセージ */}
            <div className="mb-6">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  法人プランから個人プランへの移行はできません
                </h3>
                <div className="text-blue-700 space-y-2">
                  <p>
                    現在、法人プランをご契約いただいているアカウントでは、
                    <span className="font-semibold text-blue-800">
                      個人プランへの切り替えはできません。
                    </span>
                  </p>
                  <p>
                    法人プランは企業向けの機能が含まれており、個人プランとは異なるサービス体系となっております。
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 border-l-4 border-gray-400 p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  個人プランをご希望の場合
                </h3>
                <div className="text-gray-700 space-y-2">
                  <p>
                    個人プランをご利用になりたい場合は、
                    <strong>新しいアカウント</strong>を作成して個人プランにご登録ください。
                  </p>
                  <p>
                    この方法により、法人用アカウントと個人用アカウントを分けて管理することができます。
                  </p>
                </div>
              </div>
            </div>
            {/* 選択肢 */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowIndividualWarning(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                閉じる
              </button>
              <button
                onClick={() => window.open('/auth/signup', '_blank')}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                新しいアカウントで個人プラン登録
              </button>
            </div>
            {/* 注意書き */}
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">
                <strong>ご注意:</strong>{' '}
                法人プランの解約については、アカウント設定ページまたはサポートまでお問い合わせください。
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // 既存の法人プラン切り替え警告モーダル...
  if (showCorporateWarning) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <HiExclamationCircle className="h-8 w-8 text-red-500 mr-3" />
              <h2 className="text-xl font-bold text-gray-900">重要なお知らせ</h2>
            </div>
            <div className="mb-6">
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  個人プランから法人プランへの切り替えについて
                </h3>
                <div className="text-red-700 space-y-2">
                  <p>
                    <strong>重要:</strong> 個人プランから法人プランに切り替えると、
                    <span className="font-semibold text-red-800">
                      現在の個人プランのデータは全て削除されます。
                    </span>
                  </p>
                  <p>削除される内容:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>個人プロフィール情報</li>
                    <li>SNSリンク設定</li>
                    <li>カスタムリンク</li>
                    <li>デザイン設定</li>
                    <li>共有設定</li>
                    <li>その他個人向け機能のデータ</li>
                  </ul>
                </div>
              </div>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  個人データを保持したい場合
                </h3>
                <div className="text-blue-700 space-y-2">
                  <p>
                    個人プランのデータを保持したまま法人プランもご利用になりたい場合は、
                    <strong>新しいアカウント</strong>を作成して法人プランにご登録ください。
                  </p>
                  <p>
                    この方法により、個人用アカウントと法人用アカウントを分けて管理することができます。
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowCorporateWarning(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => window.open('/auth/signup', '_blank')}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                新しいアカウントで法人プラン登録
              </button>
              <button
                onClick={handleAcceptWarning}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                個人データを削除して法人プランに切り替える
              </button>
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">
                <strong>ご注意:</strong> 一度削除された個人データの復旧はできません。
                法人プランに切り替える前に、必要なデータのバックアップを取ることをお勧めします。
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // 法人プラン申し込み完了後のリダイレクト中画面
  if (processing && showCorporatePlans) {
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
        {/* 🔥 修正: タブスタイルの切り替え */}
        <div className="mb-6">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex shadow-sm">
            <button
              data-plan-type="individual"
              className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-all duration-300 transform ${
                !showCorporatePlans
                  ? 'bg-blue-600 text-white shadow-md scale-105 active'
                  : 'bg-white text-blue-600 hover:bg-blue-700 hover:text-white hover:shadow-md hover:scale-105'
              }`}
              onClick={handleIndividualPlanClick} // 🔥 修正: 個人プランクリック処理を変更
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
              onClick={handleCorporatePlanSelection}
            >
              <HiOfficeBuilding className="h-5 w-5" />
              法人プラン
            </button>
          </div>
        </div>
        {/* 🔥 新規追加: 法人契約中ユーザー向けの情報表示 */}
        {isCorporateUser && !showCorporatePlans && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <div className="flex">
              <HiExclamationCircle className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-800">現在法人プランをご契約中です</h3>
                <p className="text-sm text-blue-700 mt-1">
                  法人プランから個人プランへの移行はできません。個人プランをご希望の場合は、新しいアカウントを作成してください。
                </p>
              </div>
            </div>
          </div>
        )}
        {/* 個人プラン */}
        {!showCorporatePlans && !isCorporateUser && (
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
            {/* 🔥 修正: 法人プラン注意事項（法人契約中ユーザーには表示しない） */}
            {!isCorporateUser && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div className="flex">
                  <HiExclamationCircle className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">ご注意</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      法人プランに切り替えると、個人プランの機能（個人ダッシュボード、個人プロフィール等）は利用できなくなります。
                      法人専用の機能のみご利用いただけます。
                    </p>
                  </div>
                </div>
              </div>
            )}
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
                      <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-base font-bold bg-blue-100 text-blue-800">
                        <FiUsers className="mr-2" /> 最大 10 名
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
                      <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-base font-bold bg-blue-100 text-blue-800">
                        <FiUsers className="mr-2" /> 最大 30 名
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
                      <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-base font-bold bg-blue-100 text-blue-800">
                        <FiUsers className="mr-2" /> 最大 50 名
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
            {!isCorporateUser && (
              <>
                <h3 className="font-semibold mb-3">お支払い方法</h3>
                <PaymentMethodForm onPaymentMethodChange={setPaymentMethodId} />
                {/* 登録/変更ボタン */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleCorporateSubscribe}
                    disabled={!paymentMethodId || processing}
                    className="px-8 py-2 bg-[#1E3A8A] text-white font-medium rounded-md hover:bg-[#122153] hover:text-white disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200"
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
              </>
            )}
            {/* 法人契約中ユーザー向けメッセージ */}
            {isCorporateUser && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4">
                <div className="flex">
                  <HiCheck className="h-5 w-5 text-green-400 mr-3 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-green-800">現在ご契約中です</h3>
                    <p className="text-sm text-green-700 mt-1">
                      法人プランをご契約いただき、ありがとうございます。プランの変更については、アカウント設定またはサポートまでお問い合わせください。
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}