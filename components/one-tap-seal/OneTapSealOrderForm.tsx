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
  userProfileSlug?: string; // userQrSlug → userProfileSlug に変更
  userName?: string;
}

// 📧 フォームデータ保存・復元用のヘルパー関数（SubscriptionSettings.tsxと完全に同じ）
const STORAGE_KEY = 'oneTapSealOrderForm';

interface FormData {
  items?: OneTapSealSelection;
  profileSlug?: string; // qrSlug → profileSlug に変更
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
  userProfileSlug, // userQrSlug → userProfileSlug に変更
  userName,
}: OneTapSealOrderFormProps) {
  // 注文データ
  const [items, setItems] = useState<OneTapSealSelection>({
    black: 0,
    gray: 0,
    white: 0,
  });
  const [profileSlug, setProfileSlug] = useState(userProfileSlug || ''); // qrSlug → profileSlug に変更
  const [shippingAddress, setShippingAddress] = useState<EnhancedShippingAddress>({
    postalCode: '',
    address: '',
    building: '',
    companyName: '',
    recipientName: '',
  });

  // UIステイト
  const [currentStep, setCurrentStep] = useState<OrderStep>('items');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 📧 データ復元状態の管理（SubscriptionSettings.tsxと同じ）
  const [isDataRestored, setIsDataRestored] = useState(false);

  // 📧 保存データの復元（SubscriptionSettings.tsxと完全に同じパターン）
  useEffect(() => {
    const savedData = loadFormData();

    if (savedData.items) {
      setItems(savedData.items);
    }
    if (savedData.profileSlug && !userProfileSlug) {
      // qrSlug → profileSlug に変更
      setProfileSlug(savedData.profileSlug); // userProfileSlugがない場合のみ復元
    }
    if (savedData.shippingAddress) {
      setShippingAddress(savedData.shippingAddress);
    }
    if (savedData.currentStep) {
      setCurrentStep(savedData.currentStep);
    }

    // 復元完了フラグを設定
    setIsDataRestored(true);
  }, [userProfileSlug]);

  // 📧 フォーム変更時の自動保存（復元完了後のみ）- SubscriptionSettings.tsxと完全に同じ
  useEffect(() => {
    if (isDataRestored) {
      saveFormData({
        items,
        profileSlug, // qrSlug → profileSlug に変更
        shippingAddress,
        currentStep,
      });
    }
  }, [items, profileSlug, shippingAddress, currentStep, isDataRestored]);

  // 📧 決済成功時のデータクリア（SubscriptionSettings.tsxと同じパターン）
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

  const handleProfileSlugChange = useCallback((slug: string) => {
    // handleQrSlugChange → handleProfileSlugChange に変更
    setProfileSlug(slug);
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
        // プロフィールスラグが3文字以上で、既存のユーザープロフィールスラグまたは有効な新規スラッグ
        return (
          profileSlug.length >= 3 && (profileSlug === userProfileSlug || profileSlug.length >= 3)
        );
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
    if (currentIndex < steps.length - 1) {
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

  // 注文送信
  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // 注文アイテム構築
      const orderItems: CreateOneTapSealItem[] = ONE_TAP_SEAL_COLORS.filter(
        (color) => items[color] > 0,
      ).map((color) => ({
        color,
        quantity: items[color],
        profileSlug,
      }));

      // バリデーション
      const validation = validateOneTapSealOrder(
        orderItems.map((item) => ({
          ...item,
          unitPrice: ONE_TAP_SEAL_CONFIG.UNIT_PRICE,
        })),
      );

      if (!validation.isValid) {
        validation.errors.forEach((error) => toast.error(error));
        return;
      }

      // 注文作成リクエスト
      const response = await fetch('/api/one-tap-seal/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderType: 'individual',
          items: orderItems,
          shippingAddress,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '注文の作成に失敗しました');
      }

      const orderData = await response.json();

      // 修正: 独自決済画面を表示する代わりに、直接Checkout Sessionを作成してリダイレクト
      toast.success('注文を作成しました。決済画面に移動します...');

      // Checkout Session作成とリダイレクト
      const checkoutResponse = await fetch('/api/one-tap-seal/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: orderData.orderId }),
      });

      if (!checkoutResponse.ok) {
        const errorData = await checkoutResponse.json();
        throw new Error(errorData.error || '決済セッションの作成に失敗しました');
      }

      const { checkoutUrl } = await checkoutResponse.json();

      // フォームデータはクリアしない（戻った時の復元用）
      // clearFormData(); // 決済完了時にのみクリアする

      // Stripe Checkoutにリダイレクト
      window.location.href = checkoutUrl;
    } catch (error: any) {
      console.error('注文作成エラー:', error);
      toast.error(error.message || 'ワンタップシール注文の作成に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 📧 キャンセル時にフォームデータをクリア
  const handleCancel = () => {
    clearFormData();
    onCancel?.();
  };

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
              profileSlug={profileSlug} // qrSlug → profileSlug に変更
              onProfileSlugChange={handleProfileSlugChange} // onQrSlugChange → onProfileSlugChange に変更
              userProfileSlug={userProfileSlug} // userQrSlug → userProfileSlug に変更
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
            profileSlug={profileSlug} // qrSlug → profileSlug に変更
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