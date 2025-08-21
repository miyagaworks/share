// components/one-tap-seal/OneTapSealOrderForm.tsx
'use client';
import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import { Package, Link, MapPin, CreditCard, ArrowRight, ArrowLeft, X } from 'lucide-react';
import {
  ONE_TAP_SEAL_COLORS,
  ONE_TAP_SEAL_CONFIG,
  type OneTapSealColor,
  type EnhancedShippingAddress,
  type OrderStep,
  type OneTapSealSelection,
  type CreateOneTapSealItem,
} from '@/types/one-tap-seal';
import { OneTapSealColorSelector } from './OneTapSealColorSelector';
import { OneTapSealUrlManager } from './OneTapSealUrlManager';
import { ShippingAddressForm } from './ShippingAddressForm';
import { OneTapSealOrderSummary } from './OneTapSealOrderSummary';
import { OneTapSealStripeCheckout } from './OneTapSealStripeCheckout';
import { validateOneTapSealOrder } from '@/lib/one-tap-seal/order-calculator';

interface OneTapSealOrderFormProps {
  onOrderComplete?: (orderId: string) => void;
  onCancel?: () => void;
  userQrSlug?: string;
  userName?: string;
}

// 🔧 フォームデータ保存・復元用のヘルパー関数（SubscriptionSettings.tsxと完全に同じ）
const STORAGE_KEY = 'oneTapSealOrderForm';

interface FormData {
  items?: OneTapSealSelection;
  qrSlug?: string;
  shippingAddress?: EnhancedShippingAddress;
  currentStep?: OrderStep;
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

export function OneTapSealOrderForm({
  onOrderComplete,
  onCancel,
  userQrSlug,
  userName,
}: OneTapSealOrderFormProps) {
  // 注文データ
  const [items, setItems] = useState<OneTapSealSelection>({
    black: 0,
    gray: 0,
    white: 0,
  });
  const [qrSlug, setQrSlug] = useState(userQrSlug || '');
  const [shippingAddress, setShippingAddress] = useState<EnhancedShippingAddress>({
    postalCode: '',
    address: '',
    building: '',
    companyName: '',
    recipientName: '',
  });

  // UI状態
  const [currentStep, setCurrentStep] = useState<OrderStep>('items');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 決済関連
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [orderAmount, setOrderAmount] = useState(0);

  // 🔧 データ復元状態の管理（SubscriptionSettings.tsxと同じ）
  const [isDataRestored, setIsDataRestored] = useState(false);

  // 🔧 保存データの復元（SubscriptionSettings.tsxと完全に同じパターン）
  useEffect(() => {
    const savedData = loadFormData();

    if (savedData.items) {
      setItems(savedData.items);
    }
    if (savedData.qrSlug && !userQrSlug) {
      setQrSlug(savedData.qrSlug); // userQrSlugがない場合のみ復元
    }
    if (savedData.shippingAddress) {
      setShippingAddress(savedData.shippingAddress);
    }
    if (savedData.currentStep) {
      setCurrentStep(savedData.currentStep);
    }

    // 復元完了フラグを設定
    setIsDataRestored(true);
  }, [userQrSlug]);

  // 🔧 フォーム変更時の自動保存（復元完了後のみ）- SubscriptionSettings.tsxと完全に同じ
  useEffect(() => {
    if (isDataRestored) {
      saveFormData({
        items,
        qrSlug,
        shippingAddress,
        currentStep,
      });
    }
  }, [items, qrSlug, shippingAddress, currentStep, isDataRestored]);

  // 🔧 決済成功時のデータクリア（SubscriptionSettings.tsxと同じパターン）
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      clearFormData();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // コールバック関数をuseCallbackで最適化
  const handleShippingAddressChange = useCallback((address: EnhancedShippingAddress) => {
    setShippingAddress(address);
  }, []);

  const handleQrSlugChange = useCallback((slug: string) => {
    setQrSlug(slug);
  }, []);

  const handleItemsChange = useCallback((newItems: OneTapSealSelection) => {
    setItems(newItems);
  }, []);

  // ステップバリデーション
  const isStepValid = (step: OrderStep): boolean => {
    switch (step) {
      case 'items':
        return Object.values(items).some((quantity) => quantity > 0);
      case 'url':
        // QRスラッグが3文字以上で、既存のユーザーQRスラッグまたは有効な新規スラッグ
        return qrSlug.length >= 3 && (qrSlug === userQrSlug || qrSlug.length >= 3);
      case 'address':
        return !!(
          shippingAddress.postalCode &&
          shippingAddress.address &&
          shippingAddress.recipientName
        );
      case 'confirm':
        return true;
      default:
        return false;
    }
  };

  // ステップナビゲーション
  const goToNextStep = () => {
    const steps: OrderStep[] = ['items', 'url', 'address', 'confirm'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1 && isStepValid(currentStep)) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const goToPreviousStep = () => {
    const steps: OrderStep[] = ['items', 'url', 'address', 'confirm'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  // 🔧 修正: Stripe Checkout Session使用版に置き換え
  const handleSubmit = async () => {
    if (!isStepValid('address') || !isStepValid('url') || !isStepValid('items')) {
      toast.error('すべての項目を正しく入力してください');
      return;
    }

    setIsSubmitting(true);
    try {
      // 🔧 決済前に現在の状態を保存（SubscriptionSettings.tsxと同じパターン）
      saveFormData({
        items,
        qrSlug,
        shippingAddress,
        currentStep,
      });

      // 注文アイテムを構築
      const orderItems: CreateOneTapSealItem[] = ONE_TAP_SEAL_COLORS.filter(
        (color) => items[color] > 0,
      ).map((color) => ({
        color,
        quantity: items[color],
        qrSlug,
      }));

      // バリデーション
      const validationItems = orderItems.map((item) => ({
        ...item,
        unitPrice: ONE_TAP_SEAL_CONFIG.UNIT_PRICE,
      }));

      const validation = validateOneTapSealOrder(validationItems);
      if (!validation.isValid) {
        toast.error(validation.errors[0]);
        return;
      }

      toast.loading('注文を準備中...', { id: 'order-loading' });

      // Step 1: 注文作成
      const orderResponse = await fetch('/api/one-tap-seal/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderType: 'individual',
          items: orderItems,
          shippingAddress: {
            postalCode: shippingAddress.postalCode,
            address: shippingAddress.address,
            building: shippingAddress.building,
            companyName: shippingAddress.companyName,
            recipientName: shippingAddress.recipientName,
          },
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(orderData.error || '注文の作成に失敗しました');
      }

      toast.dismiss('order-loading');
      toast.loading('決済画面を準備中...', { id: 'checkout-loading' });

      // Step 2: Stripe Checkout Session作成（ワンタップシール単独決済）
      const checkoutResponse = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: 'one_tap_seal_only',
          interval: 'month',
          isCorporate: false,
          oneTapSeal: {
            orderId: orderData.orderId,
            items: orderItems,
            shippingAddress,
          },
        }),
      });

      const checkoutData = await checkoutResponse.json();

      if (!checkoutResponse.ok) {
        throw new Error(checkoutData.error || '決済の準備に失敗しました');
      }

      toast.dismiss('checkout-loading');
      toast.success('決済画面に移動します...');

      // Step 3: Stripe Checkoutページにリダイレクト
      if (checkoutData.checkoutUrl) {
        window.location.href = checkoutData.checkoutUrl;
      } else {
        throw new Error('決済URLの取得に失敗しました');
      }
    } catch (error) {
      console.error('ワンタップシール注文エラー:', error);
      toast.dismiss();
      toast.error(
        error instanceof Error ? error.message : 'ワンタップシール注文の作成に失敗しました',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // 決済成功時の処理
  const handlePaymentSuccess = () => {
    if (createdOrderId) {
      // 🔧 決済成功時にフォームデータをクリア
      clearFormData();
      onOrderComplete?.(createdOrderId);
    }
  };

  // 🔧 キャンセル時にフォームデータをクリア
  const handleCancel = () => {
    clearFormData();
    onCancel?.();
  };

  // 決済画面の表示
  if (showPayment && createdOrderId) {
    return (
      <div className="w-full">
        <OneTapSealStripeCheckout
          orderId={createdOrderId}
          amount={orderAmount}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowPayment(false)}
        />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">ワンタップシール注文</h2>
        <Button variant="ghost" size="sm" onClick={handleCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* ステップインジケーター */}
      <div className="flex justify-center">
        {['商品選択', 'URL設定', '配送先', '確認'].map((stepName, index) => {
          const stepValue = ['items', 'url', 'address', 'confirm'][index];
          const isActive = currentStep === stepValue;
          const isCompleted = ['items', 'url', 'address', 'confirm'].indexOf(currentStep) > index;

          return (
            <div key={stepValue} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : isCompleted
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1}
              </div>
              {index < 3 && (
                <div
                  className={`w-8 sm:w-12 h-0.5 mx-1 sm:mx-2 transition-colors ${
                    isCompleted ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ステップコンテンツ */}
      <div className="w-full">
        {currentStep === 'items' && (
          <Card className="p-4 sm:p-6">
            <div className="flex items-center mb-4">
              <Package className="h-5 w-5 mr-2 text-blue-600" />
              <h3 className="text-lg font-semibold">商品選択</h3>
            </div>
            <OneTapSealColorSelector items={items} onItemsChange={handleItemsChange} />
          </Card>
        )}

        {currentStep === 'url' && (
          <Card className="p-4 sm:p-6">
            <div className="flex items-center mb-4">
              <Link className="h-5 w-5 mr-2 text-blue-600" />
              <h3 className="text-lg font-semibold">URL設定</h3>
            </div>
            <OneTapSealUrlManager
              qrSlug={qrSlug}
              onQrSlugChange={handleQrSlugChange}
              userQrSlug={userQrSlug}
              userName={userName}
            />
          </Card>
        )}

        {currentStep === 'address' && (
          <ShippingAddressForm
            address={shippingAddress}
            onAddressChange={handleShippingAddressChange}
          />
        )}

        {currentStep === 'confirm' && (
          <OneTapSealOrderSummary
            items={items}
            qrSlug={qrSlug}
            shippingAddress={shippingAddress}
            onConfirm={handleSubmit}
            onEdit={() => setCurrentStep('items')}
            isSubmitting={isSubmitting}
          />
        )}
      </div>

      {/* ナビゲーションボタン */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
        <Button
          onClick={currentStep === 'items' ? handleCancel : goToPreviousStep}
          variant="outline"
          className="w-full sm:w-auto"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {currentStep === 'items' ? 'キャンセル' : '戻る'}
        </Button>

        {currentStep !== 'confirm' && (
          <Button
            onClick={goToNextStep}
            disabled={!isStepValid(currentStep)}
            className="w-full sm:w-auto"
          >
            次へ
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}