// components/touch-seal/TouchSealOrderForm.tsx
'use client';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import { Package, Link, MapPin, CreditCard, ArrowRight, ArrowLeft, X } from 'lucide-react';
import {
  TOUCH_SEAL_COLORS,
  TOUCH_SEAL_CONFIG,
  type TouchSealColor,
  type EnhancedShippingAddress,
  type OrderStep,
  type TouchSealSelection,
  type CreateTouchSealItem,
} from '@/types/touch-seal';
import { TouchSealColorSelector } from './TouchSealColorSelector';
import { TouchSealUrlManager } from './TouchSealUrlManager';
import { ShippingAddressForm } from './ShippingAddressForm';
import { TouchSealOrderSummary } from './TouchSealOrderSummary';
import { StripeCheckout } from './StripeCheckout';
import { validateTouchSealOrder } from '@/lib/touch-seal/order-calculator';

interface TouchSealOrderFormProps {
  onOrderComplete?: (orderId: string) => void;
  onCancel?: () => void;
  userQrSlug?: string;
  userName?: string;
}

export function TouchSealOrderForm({
  onOrderComplete,
  onCancel,
  userQrSlug,
  userName,
}: TouchSealOrderFormProps) {
  // 注文データ
  const [items, setItems] = useState<TouchSealSelection>({
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

  // コールバック関数をuseCallbackで最適化
  const handleShippingAddressChange = useCallback((address: EnhancedShippingAddress) => {
    setShippingAddress(address);
  }, []);

  const handleQrSlugChange = useCallback((slug: string) => {
    setQrSlug(slug);
  }, []);

  const handleItemsChange = useCallback((newItems: TouchSealSelection) => {
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

  // 注文送信
  const handleSubmit = async () => {
    if (!isStepValid('address') || !isStepValid('url') || !isStepValid('items')) {
      toast.error('すべての項目を正しく入力してください');
      return;
    }

    setIsSubmitting(true);
    try {
      // 注文アイテムを構築
      const orderItems: CreateTouchSealItem[] = TOUCH_SEAL_COLORS.filter(
        (color) => items[color] > 0,
      ).map((color) => ({
        color,
        quantity: items[color],
        qrSlug,
      }));

      // バリデーション
      const validationItems = orderItems.map((item) => ({
        ...item,
        unitPrice: TOUCH_SEAL_CONFIG.UNIT_PRICE,
      }));

      const validation = validateTouchSealOrder(validationItems);
      if (!validation.isValid) {
        toast.error(validation.errors[0]);
        return;
      }

      // 注文作成API呼び出し
      const response = await fetch('/api/touch-seal/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderType: 'individual',
          items: orderItems,
          shippingAddress,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCreatedOrderId(data.orderId);
        setOrderAmount(data.totalAmount);
        setShowPayment(true);
        toast.success('注文を作成しました。決済に進みます。');
      } else {
        throw new Error(data.error || '注文の作成に失敗しました');
      }
    } catch (error) {
      console.error('注文エラー:', error);
      toast.error(error instanceof Error ? error.message : '注文の作成に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 決済成功時の処理
  const handlePaymentSuccess = () => {
    if (createdOrderId) {
      onOrderComplete?.(createdOrderId);
    }
  };

  // 決済画面の表示
  if (showPayment && createdOrderId) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <StripeCheckout
          orderId={createdOrderId}
          amount={orderAmount}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowPayment(false)}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">タッチシール注文</h2>
        <Button variant="ghost" size="sm" onClick={onCancel}>
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
            <TouchSealColorSelector items={items} onItemsChange={handleItemsChange} />
          </Card>
        )}

        {currentStep === 'url' && (
          <Card className="p-4 sm:p-6">
            <div className="flex items-center mb-4">
              <Link className="h-5 w-5 mr-2 text-blue-600" />
              <h3 className="text-lg font-semibold">URL設定</h3>
            </div>
            <TouchSealUrlManager
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
          <TouchSealOrderSummary
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
          onClick={currentStep === 'items' ? onCancel : goToPreviousStep}
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