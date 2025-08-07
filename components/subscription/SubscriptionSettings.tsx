// components/subscription/SubscriptionSettings.tsx
'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { HiCheck, HiOutlineOfficeBuilding, HiExclamationCircle } from 'react-icons/hi';
import { FiUsers } from 'react-icons/fi';
import { HiUser, HiOfficeBuilding } from 'react-icons/hi';
import { useDashboardInfo } from '@/hooks/useDashboardInfo';
import { STRIPE_PAYMENT_LINKS } from '@/lib/stripeClient';

// 型定義
type SubscriptionPlan = 'monthly' | 'yearly' | 'starter' | 'business' | 'enterprise';
type SubscriptionInterval = 'month' | 'year';

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
  const [showCorporatePlans, setShowCorporatePlans] = useState(false);

  // 法人契約中ユーザーの状態管理
  const { data: dashboardInfo } = useDashboardInfo();
  const [isCorporateUser, setIsCorporateUser] = useState(false);
  const [showIndividualWarning, setShowIndividualWarning] = useState(false);

  // 法人プラン切り替え警告の状態管理
  const [showCorporateWarning, setShowCorporateWarning] = useState(false);
  const [hasIndividualData, setHasIndividualData] = useState(false);

  // 法人契約中ユーザーの判定とタブ初期設定
  useEffect(() => {
    if (dashboardInfo?.permissions) {
      const isCorpUser =
        dashboardInfo.permissions.userType === 'corporate' ||
        dashboardInfo.permissions.userType === 'invited-member' ||
        dashboardInfo.permissions.hasCorpAccess;
      setIsCorporateUser(isCorpUser);
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
      } catch {}
    };
    checkIndividualData();
  }, []);

  // 法人契約中ユーザーが個人プランタブをクリックした場合の処理
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
      setShowCorporatePlans(true);
    } else if (hasIndividualData) {
      setShowCorporateWarning(true);
    } else {
      setShowCorporatePlans(true);
    }
  };

  // 警告承諾後の処理
  const handleAcceptWarning = () => {
    setShowCorporateWarning(false);
    setShowCorporatePlans(true);
  };

  // 個人プラン申し込み処理（Stripe決済リンクへ遷移）
  const handleIndividualSubscribe = (plan: 'monthly' | 'yearly') => {
    const paymentLink =
      plan === 'monthly' ? STRIPE_PAYMENT_LINKS.MONTHLY : STRIPE_PAYMENT_LINKS.YEARLY;

    if (!paymentLink) {
      toast.error('決済リンクが見つかりません');
      return;
    }

    // 現在のURLをセッションストレージに保存（決済完了後の戻り先として）
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('payment_return_url', window.location.href);
    }

    // Stripe決済リンクに遷移
    window.location.href = paymentLink.url;
  };

  // 法人プラン申し込み処理（Stripe決済リンクへ遷移）
  const handleCorporateSubscribe = (plan: SubscriptionPlan, interval: SubscriptionInterval) => {
    let paymentLink;

    switch (plan) {
      case 'starter':
        paymentLink =
          interval === 'year'
            ? STRIPE_PAYMENT_LINKS.STARTER_YEARLY
            : STRIPE_PAYMENT_LINKS.STARTER_MONTHLY;
        break;
      case 'business':
        paymentLink =
          interval === 'year'
            ? STRIPE_PAYMENT_LINKS.BUSINESS_YEARLY
            : STRIPE_PAYMENT_LINKS.BUSINESS_MONTHLY;
        break;
      case 'enterprise':
        paymentLink =
          interval === 'year'
            ? STRIPE_PAYMENT_LINKS.ENTERPRISE_YEARLY
            : STRIPE_PAYMENT_LINKS.ENTERPRISE_MONTHLY;
        break;
      default:
        toast.error('無効なプランが選択されました');
        return;
    }

    if (!paymentLink) {
      toast.error('決済リンクが見つかりません');
      return;
    }

    // 現在のURLをセッションストレージに保存
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('payment_return_url', window.location.href);
      // 法人プランの場合、選択されたプラン情報も保存
      sessionStorage.setItem('selected_corporate_plan', JSON.stringify({ plan, interval }));
    }

    // Stripe決済リンクに遷移
    window.location.href = paymentLink.url;
  };

  // 法人→個人への移行不可警告モーダル
  if (showIndividualWarning) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <HiExclamationCircle className="h-8 w-8 text-blue-500 mr-3" />
              <h2 className="text-xl font-bold text-gray-900">個人プランへの移行について</h2>
            </div>
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
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.open('/auth/signup', '_blank')}
                className="w-full h-[48px] px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-base sm:text-sm flex items-center justify-center text-center leading-tight"
              >
                新しいアカウントで個人プラン登録
              </button>
              <button
                onClick={() => setShowIndividualWarning(false)}
                className="w-full h-[48px] px-4 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-base sm:text-sm flex items-center justify-center"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 法人プラン切り替え警告モーダル
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
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.open('/auth/signup', '_blank')}
                className="w-full h-[48px] px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-base sm:text-sm flex items-center justify-center text-center leading-tight"
              >
                新しいアカウントで法人プラン登録
              </button>
              <button
                onClick={handleAcceptWarning}
                className="w-full h-[48px] px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-base sm:text-sm flex items-center justify-center text-center leading-tight"
              >
                個人データを削除して法人プランに切り替える
              </button>
              <button
                onClick={() => setShowCorporateWarning(false)}
                className="w-full h-[48px] px-4 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-base sm:text-sm flex items-center justify-center"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="subscription-plans" className="space-y-6">
      <div className="space-y-6">
        {/* タブ切り替え */}
        <div className="mb-6">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex shadow-sm">
            <button
              data-plan-type="individual"
              className={`flex-1 h-[48px] px-4 flex items-center justify-center gap-2 text-base sm:text-sm font-medium transition-all duration-300 transform ${
                !showCorporatePlans
                  ? 'bg-blue-600 text-white shadow-md scale-105 active'
                  : 'bg-white text-blue-600 hover:bg-blue-700 hover:text-white hover:shadow-md hover:scale-105'
              }`}
              onClick={handleIndividualPlanClick}
            >
              <HiUser className="h-5 w-5" />
              個人プラン
            </button>
            <button
              data-plan-type="corporate"
              className={`flex-1 h-[48px] px-4 flex items-center justify-center gap-2 text-base sm:text-sm font-medium transition-all duration-300 transform ${
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

        {/* 法人契約中ユーザー向けの情報表示 */}
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
                    </ul>
                    <div className="mt-4">
                      <button
                        onClick={() => handleIndividualSubscribe('monthly')}
                        disabled={selectedPlan !== 'monthly'}
                        className="w-full h-[52px] px-4 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 text-sm flex items-center justify-center text-center leading-tight"
                      >
                        月額プランに申し込む
                      </button>
                    </div>
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
                    </ul>
                    <div className="mt-4">
                      <button
                        onClick={() => handleIndividualSubscribe('yearly')}
                        disabled={selectedPlan !== 'yearly'}
                        className="w-full h-[52px] px-4 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 text-sm flex items-center justify-center text-center leading-tight"
                      >
                        年額プランに申し込む
                      </button>
                    </div>
                  </div>
                  {selectedPlan === 'yearly' && (
                    <div className="bg-blue-500 rounded-full p-1">
                      <HiCheck className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* 法人プラン */}
        {showCorporatePlans && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">法人プランを選択</h2>
            {!isCorporateUser && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div className="flex">
                  <HiExclamationCircle className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">ご注意</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      法人プランに切り替えると、個人プランの機能は利用できなくなります。
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
                  <div className="w-full">
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

                    <div className="flex space-x-2 mt-3 mb-3">
                      <button
                        type="button"
                        className={`text-xs px-2 py-1 rounded-full transition-colors ${
                          selectedInterval === 'month'
                            ? 'bg-[#1E3A8A] text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
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
                          e.stopPropagation();
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

                    <div className="mt-4">
                      <button
                        onClick={() => handleCorporateSubscribe('starter', selectedInterval)}
                        disabled={selectedPlan !== 'starter'}
                        className="w-full h-[52px] px-3 bg-blue-900 text-white rounded-md font-medium hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 text-sm flex items-center justify-center text-center leading-tight"
                      >
                        スタータープランに申し込む
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
                  <div className="w-full">
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

                    <div className="flex space-x-2 mt-3 mb-3">
                      <button
                        type="button"
                        className={`text-xs px-2 py-1 rounded-full transition-colors ${
                          selectedInterval === 'month'
                            ? 'bg-[#1E3A8A] text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
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
                          e.stopPropagation();
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

                    <div className="mt-4">
                      <button
                        onClick={() => handleCorporateSubscribe('business', selectedInterval)}
                        disabled={selectedPlan !== 'business'}
                        className="w-full h-[52px] px-3 bg-blue-900 text-white rounded-md font-medium hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 text-sm flex items-center justify-center text-center leading-tight"
                      >
                        ビジネスプランに申し込む
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
                  <div className="w-full">
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

                    <div className="flex space-x-2 mt-3 mb-3">
                      <button
                        type="button"
                        className={`text-xs px-2 py-1 rounded-full transition-colors ${
                          selectedInterval === 'month'
                            ? 'bg-[#1E3A8A] text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
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
                          e.stopPropagation();
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

                    <div className="mt-4">
                      <button
                        onClick={() => handleCorporateSubscribe('enterprise', selectedInterval)}
                        disabled={selectedPlan !== 'enterprise'}
                        className="w-full h-[52px] px-2 bg-blue-900 text-white rounded-md font-medium hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 text-sm flex items-center justify-center text-center leading-tight"
                      >
                        エンタープライズプランに申し込む
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