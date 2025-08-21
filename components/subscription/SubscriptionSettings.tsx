// components/subscription/SubscriptionSettings.tsx (フォーム保存機能付き)
'use client';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FiUsers } from 'react-icons/fi';
import {
  HiCheck,
  HiOutlineOfficeBuilding,
  HiExclamationCircle,
  HiUser,
  HiOfficeBuilding,
  HiPlus,
  HiMinus,
  HiSparkles,
} from 'react-icons/hi';
import { useDashboardInfo } from '@/hooks/useDashboardInfo';
import { FEATURE_FLAGS } from '@/lib/feature-config';
import {
  ONE_TAP_SEAL_COLORS,
  ONE_TAP_SEAL_CONFIG,
  type OneTapSealColor,
  type OneTapSealSelection,
  type EnhancedShippingAddress,
} from '@/types/one-tap-seal';
import { calculateSelectionAmount } from '@/lib/one-tap-seal/order-calculator';
import { ShippingAddressForm } from '@/components/one-tap-seal/ShippingAddressForm';

// 型定義
type SubscriptionPlan = 'monthly' | 'yearly' | 'starter' | 'business' | 'enterprise';
type SubscriptionInterval = 'month' | 'year';

// 🔧 フォームデータ保存・復元用のヘルパー関数
const STORAGE_KEY = 'subscription_form_data';

interface FormData {
  selectedPlan?: SubscriptionPlan;
  selectedInterval?: SubscriptionInterval;
  showCorporatePlans?: boolean;
  addOneTapSeal?: boolean;
  sealSelection?: OneTapSealSelection;
  shippingAddress?: EnhancedShippingAddress;
  timestamp: number;
}

const saveFormData = (data: Partial<FormData>) => {
  try {
    const currentData = loadFormData();
    const newData: FormData = {
      ...currentData,
      ...data,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  } catch (error) {
    console.warn('フォームデータの保存に失敗:', error);
  }
};

const loadFormData = (): Partial<FormData> => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return {};

    const data = JSON.parse(stored);
    if (data.timestamp && Date.now() - data.timestamp > 60 * 60 * 1000) {
      clearFormData();
      return {};
    }
    return data;
  } catch (error) {
    console.warn('フォームデータの読み込みに失敗:', error);
    return {};
  }
};

const clearFormData = () => {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('フォームデータの削除に失敗:', error);
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

  // 決済処理状態
  const [isProcessing, setIsProcessing] = useState(false);

  // ワンタップシール同時注文の状態
  const [addOneTapSeal, setAddOneTapSeal] = useState(false);
  const [sealSelection, setSealSelection] = useState<OneTapSealSelection>({
    black: 0,
    gray: 0,
    white: 0,
  });
  const [userQrSlug, setUserQrSlug] = useState<string>('');
  const [shippingAddress, setShippingAddress] = useState<EnhancedShippingAddress>({
    postalCode: '',
    address: '',
    building: '',
    companyName: '',
    recipientName: '',
  });

  // 法人契約中ユーザーの状態管理
  const { data: dashboardInfo } = useDashboardInfo();
  const [isCorporateUser, setIsCorporateUser] = useState(false);
  const [showIndividualWarning, setShowIndividualWarning] = useState(false);

  // 法人プラン切り替え警告の状態管理
  const [showCorporateWarning, setShowCorporateWarning] = useState(false);
  const [hasIndividualData, setHasIndividualData] = useState(false);

  // 🔧 データ復元状態の管理
  const [isDataRestored, setIsDataRestored] = useState(false);

  // 🔧 保存データの復元
  useEffect(() => {
    const savedData = loadFormData();

    if (savedData.selectedPlan) setSelectedPlan(savedData.selectedPlan);
    if (savedData.selectedInterval) setSelectedInterval(savedData.selectedInterval);
    if (savedData.showCorporatePlans !== undefined)
      setShowCorporatePlans(savedData.showCorporatePlans);
    if (savedData.addOneTapSeal !== undefined) setAddOneTapSeal(savedData.addOneTapSeal);
    if (savedData.sealSelection) setSealSelection(savedData.sealSelection);
    if (savedData.shippingAddress) setShippingAddress(savedData.shippingAddress);

    // 復元完了フラグを設定
    setIsDataRestored(true);
  }, []);

  // 🔧 フォーム変更時の自動保存（復元完了後のみ）
  useEffect(() => {
    if (isDataRestored) {
      saveFormData({
        selectedPlan,
        selectedInterval,
        showCorporatePlans,
        addOneTapSeal,
        sealSelection,
        shippingAddress,
      });
    }
  }, [
    selectedPlan,
    selectedInterval,
    showCorporatePlans,
    addOneTapSeal,
    sealSelection,
    shippingAddress,
    isDataRestored,
  ]);

  // 🔧 決済成功時のデータクリア
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      clearFormData();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // ユーザーのQRスラッグを取得
  useEffect(() => {
    const fetchUserQrSlug = async () => {
      try {
        const response = await fetch('/api/qrcode');
        if (response.ok) {
          const data = await response.json();
          if (data.qrCodes && data.qrCodes.length > 0) {
            setUserQrSlug(data.qrCodes[0].slug);
          }
        }
      } catch (error) {
        console.error('QRスラッグ取得エラー:', error);
      }
    };

    fetchUserQrSlug();
  }, []);

  // 法人契約中ユーザーの判定とタブ初期設定
  useEffect(() => {
    if (dashboardInfo?.permissions) {
      const isCorpUser =
        dashboardInfo.permissions.userType === 'corporate' ||
        dashboardInfo.permissions.userType === 'invited-member' ||
        dashboardInfo.permissions.hasCorpAccess;
      setIsCorporateUser(isCorpUser);

      // 🔧 修正: 保存データを優先し、保存データがない場合のみデフォルト設定
      const savedData = loadFormData();
      if (savedData.showCorporatePlans === undefined) {
        // 保存データがない場合のみ法人ユーザーのデフォルト設定を適用
        if (isCorpUser) {
          setShowCorporatePlans(true);
        }
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

  // ワンタップシール数量変更
  const handleSealQuantityChange = (color: OneTapSealColor, delta: number) => {
    const currentQuantity = sealSelection[color];
    const newQuantity = Math.max(
      0,
      Math.min(ONE_TAP_SEAL_CONFIG.MAX_QUANTITY_PER_COLOR, currentQuantity + delta),
    );

    const currentTotal = Object.values(sealSelection).reduce((sum, qty) => sum + qty, 0);
    const newTotal = currentTotal - currentQuantity + newQuantity;

    if (newTotal <= ONE_TAP_SEAL_CONFIG.MAX_TOTAL_QUANTITY) {
      setSealSelection((prev) => ({ ...prev, [color]: newQuantity }));
    }
  };

  // ワンタップシール料金計算
  const sealAmount = calculateSelectionAmount(sealSelection);
  const totalSealQuantity = Object.values(sealSelection).reduce((sum, qty) => sum + qty, 0);

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

  // 🔧 統合された申し込み処理（ワンタップシール有無を統一処理）
  const handleSubscribeWithSeal = async (plan: string, interval: string) => {
    if (isProcessing) return;

    setIsProcessing(true);

    try {
      // 🔧 決済前に現在の状態を保存
      saveFormData({
        selectedPlan: plan as SubscriptionPlan,
        selectedInterval: interval as SubscriptionInterval,
        showCorporatePlans,
        addOneTapSeal,
        sealSelection,
        shippingAddress,
      });

      // ワンタップシールなしの場合は個人プラン処理に委譲
      if (!addOneTapSeal || totalSealQuantity === 0) {
        await handleIndividualSubscribe(plan, interval);
        return;
      }

      // バリデーション
      if (!userQrSlug) {
        toast.error('QRスラッグが設定されていません');
        return;
      }

      if (
        !shippingAddress.postalCode ||
        !shippingAddress.address ||
        !shippingAddress.recipientName
      ) {
        toast.error('配送先情報を入力してください');
        return;
      }

      // 注文アイテムを構築
      const orderItems = ONE_TAP_SEAL_COLORS.filter((color) => sealSelection[color] > 0).map(
        (color) => ({
          color,
          quantity: sealSelection[color],
          qrSlug: userQrSlug,
        }),
      );

      toast.loading('決済の準備中...', { id: 'checkout-loading' });

      // プラン + ワンタップシールの同時注文
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          interval,
          isCorporate: false,
          // ワンタップシール追加情報
          oneTapSeal: {
            items: orderItems,
            shippingAddress,
            amount: sealAmount,
          },
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.dismiss('checkout-loading');
        toast.success('決済画面に移動します...');

        // Checkout URLにリダイレクト
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          throw new Error('決済URLが取得できませんでした');
        }
      } else {
        throw new Error(data.error || '処理に失敗しました');
      }
    } catch (error) {
      console.error('同時注文エラー:', error);
      toast.dismiss('checkout-loading');
      toast.error(error instanceof Error ? error.message : '注文に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  // 🆕 個人プラン申し込み処理（修正版：常にCheckout Sessionを使用）
  const handleIndividualSubscribe = async (plan: string, interval: string) => {
    if (isProcessing) return;

    setIsProcessing(true);

    try {
      // 🔧 決済前に現在の状態を保存
      saveFormData({
        selectedPlan: plan as SubscriptionPlan,
        selectedInterval: interval as SubscriptionInterval,
        showCorporatePlans,
        addOneTapSeal,
        sealSelection,
        shippingAddress,
      });

      toast.loading('決済の準備中...', { id: 'checkout-loading' });

      // 個人プラン（ワンタップシールなし）のCheckout Session作成
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          interval,
          isCorporate: false,
          // ワンタップシールなし
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.dismiss('checkout-loading');
        toast.success('決済画面に移動します...');

        // Checkout URLにリダイレクト
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          throw new Error('決済URLが取得できませんでした');
        }
      } else {
        throw new Error(data.error || '処理に失敗しました');
      }
    } catch (error) {
      console.error('個人プラン申し込みエラー:', error);
      toast.dismiss('checkout-loading');
      toast.error(error instanceof Error ? error.message : '申し込みに失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  // 🆕 法人プラン申し込み処理（Checkout Session使用）
  const handleCorporateSubscribe = async (
    plan: SubscriptionPlan,
    interval: SubscriptionInterval,
  ) => {
    if (isProcessing) return;

    setIsProcessing(true);

    try {
      // 🔧 決済前に現在の状態を保存
      saveFormData({
        selectedPlan: plan,
        selectedInterval: interval,
        showCorporatePlans,
        addOneTapSeal,
        sealSelection,
        shippingAddress,
      });

      toast.loading('法人プランの準備中...', { id: 'corporate-loading' });

      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          interval,
          isCorporate: true,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.dismiss('corporate-loading');
        toast.success('法人プラン決済画面に移動します...');

        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          throw new Error('決済URLが取得できませんでした');
        }
      } else {
        throw new Error(data.error || '法人プランの処理に失敗しました');
      }
    } catch (error) {
      console.error('法人プランエラー:', error);
      toast.dismiss('corporate-loading');
      toast.error(error instanceof Error ? error.message : '法人プランの申し込みに失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  // 色のスタイル取得
  const getColorStyle = (color: OneTapSealColor) => {
    switch (color) {
      case 'black':
        return 'bg-black border-gray-300';
      case 'gray':
        return 'bg-gray-400 border-gray-300';
      case 'white':
        return 'bg-white border-gray-300 border-2';
      default:
        return 'bg-gray-200 border-gray-300';
    }
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
            <h2 className="text-2xl font-bold mb-4">プランを選択</h2>

            {/* ワンタップシール同時注文オプション */}
            {FEATURE_FLAGS.USE_ONE_TAP_SEAL && userQrSlug && (
              <div className="mb-6 p-6 bg-gradient-to-r from-blue-600 to-purple-600 border-2 border-blue-500 rounded-xl shadow-lg">
                <div className="flex items-center mb-4">
                  <div
                    className="flex items-center bg-white p-3 rounded-lg shadow-md border-2 border-blue-200 hover:border-blue-400 transition-all cursor-pointer"
                    onClick={() => setAddOneTapSeal(!addOneTapSeal)}
                  >
                    <input
                      type="checkbox"
                      id="add-one-tap-seal"
                      checked={addOneTapSeal}
                      onChange={(e) => setAddOneTapSeal(e.target.checked)}
                      className="h-5 w-5 text-blue-600 rounded border-2 border-blue-300 focus:ring-2 focus:ring-blue-500"
                      disabled={isProcessing}
                    />
                    <label
                      htmlFor="add-one-tap-seal"
                      className="ml-3 text-lg font-bold text-gray-800 cursor-pointer"
                    >
                      <span className="flex items-center">
                        <HiSparkles className="h-6 w-6 text-yellow-500 mr-2" />
                        ワンタップシールを同時注文する
                        <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                          お得！
                        </span>
                      </span>
                    </label>
                  </div>
                </div>

                {/* 説明文も改善 */}
                <div className="text-white text-sm bg-white/20 p-3 rounded-lg">
                  <p className="font-medium">💡 プランと一緒に注文すると配送料がお得になります！</p>
                </div>

                {addOneTapSeal && (
                  <div className="space-y-4">
                    {/* 色・数量選択 */}
                    <div>
                      <h4 className="text-lg font-bold text-white mb-4 mt-2">シール選択</h4>
                      <div className="space-y-2">
                        {ONE_TAP_SEAL_COLORS.map((color) => (
                          <div
                            key={color}
                            className="flex items-center justify-between p-2 bg-white rounded border"
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-4 h-4 rounded-full border ${getColorStyle(color)}`}
                              />
                              <span className="text-sm font-medium capitalize">{color}</span>
                              <span className="text-xs text-gray-500">¥550/枚</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => handleSealQuantityChange(color, -1)}
                                disabled={sealSelection[color] === 0 || isProcessing}
                                className="w-6 h-6 rounded border flex items-center justify-center disabled:opacity-50"
                              >
                                <HiMinus className="h-3 w-3" />
                              </button>
                              <span className="w-8 text-center text-sm">
                                {sealSelection[color]}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleSealQuantityChange(color, 1)}
                                disabled={
                                  sealSelection[color] >=
                                    ONE_TAP_SEAL_CONFIG.MAX_QUANTITY_PER_COLOR || isProcessing
                                }
                                className="w-6 h-6 rounded border flex items-center justify-center disabled:opacity-50"
                              >
                                <HiPlus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {totalSealQuantity > 0 && (
                        <div className="mt-2 text-sm text-blue-700">
                          合計: {totalSealQuantity}枚 - ¥{sealAmount.toLocaleString()}（配送料込み）
                        </div>
                      )}
                    </div>

                    {/* 配送先入力 */}
                    {totalSealQuantity > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">配送先情報</h4>
                        <ShippingAddressForm
                          address={shippingAddress}
                          onAddressChange={setShippingAddress}
                          disabled={isProcessing}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

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
                      ¥550 <span className="text-sm font-normal text-gray-500">/月</span>
                    </p>
                    {addOneTapSeal && totalSealQuantity > 0 && (
                      <p className="text-sm text-blue-600 mt-1">
                        + ワンタップシール ¥{sealAmount.toLocaleString()}
                      </p>
                    )}
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
                        onClick={() => handleSubscribeWithSeal('monthly', 'month')}
                        disabled={selectedPlan !== 'monthly' || isProcessing}
                        className="w-full h-[52px] px-4 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 text-sm flex items-center justify-center text-center leading-tight"
                      >
                        {isProcessing ? (
                          '処理中...'
                        ) : (
                          <>
                            月額プランに申し込む
                            {addOneTapSeal && totalSealQuantity > 0 && (
                              <span className="ml-1">（シール同時注文）</span>
                            )}
                          </>
                        )}
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
                      ¥5,500 <span className="text-sm font-normal text-gray-500">/年</span>
                    </p>
                    <p className="text-xs text-green-600">2ヶ月分お得</p>
                    {addOneTapSeal && totalSealQuantity > 0 && (
                      <p className="text-sm text-blue-600 mt-1">
                        + ワンタップシール ¥{sealAmount.toLocaleString()}
                      </p>
                    )}
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
                        onClick={() => handleSubscribeWithSeal('yearly', 'year')}
                        disabled={selectedPlan !== 'yearly' || isProcessing}
                        className="w-full h-[52px] px-4 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 text-sm flex items-center justify-center text-center leading-tight"
                      >
                        {isProcessing ? (
                          '処理中...'
                        ) : (
                          <>
                            年額プランに申し込む
                            {addOneTapSeal && totalSealQuantity > 0 && (
                              <span className="ml-1">（シール同時注文）</span>
                            )}
                          </>
                        )}
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
            <h2 className="text-2xl font-bold mb-4">法人プランを選択</h2>
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
                      ¥{selectedInterval === 'month' ? '3,300' : '33,000'}
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
                        disabled={isProcessing}
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
                        disabled={isProcessing}
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
                        disabled={selectedPlan !== 'starter' || isProcessing}
                        className="w-full h-[52px] px-3 bg-blue-900 text-white rounded-md font-medium hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 text-sm flex items-center justify-center text-center leading-tight"
                      >
                        {isProcessing ? '処理中...' : 'スタータープランに申し込む'}
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
                      ¥{selectedInterval === 'month' ? '6,600' : '66,000'}
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
                        disabled={isProcessing}
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
                        disabled={isProcessing}
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
                        disabled={selectedPlan !== 'business' || isProcessing}
                        className="w-full h-[52px] px-3 bg-blue-900 text-white rounded-md font-medium hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 text-sm flex items-center justify-center text-center leading-tight"
                      >
                        {isProcessing ? '処理中...' : 'ビジネスプランに申し込む'}
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
                      ¥{selectedInterval === 'month' ? '9,900' : '99,000'}
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
                        disabled={isProcessing}
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
                        disabled={isProcessing}
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
                        disabled={selectedPlan !== 'enterprise' || isProcessing}
                        className="w-full h-[52px] px-2 bg-blue-900 text-white rounded-md font-medium hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 text-sm flex items-center justify-center text-center leading-tight"
                      >
                        {isProcessing ? '処理中...' : 'エンタープライズプランに申し込む'}
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