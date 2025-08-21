// lib/touch-seal/order-calculator.ts
import { TOUCH_SEAL_CONFIG } from '@/types/touch-seal';
import type {
  ValidationTouchSealItem,
  OrderCalculation,
  ValidationResult,
} from '@/types/touch-seal';

/**
 * 注文金額を計算する（税込価格）
 */
export function calculateOrderAmount(items: ValidationTouchSealItem[]): OrderCalculation {
  const sealTotal = items.reduce(
    (sum, item) => sum + item.quantity * TOUCH_SEAL_CONFIG.UNIT_PRICE,
    0,
  );
  const shippingFee = TOUCH_SEAL_CONFIG.SHIPPING_FEE;
  const taxAmount = 0; // 税込価格のため消費税は0
  const totalAmount = sealTotal + shippingFee; // 税込価格なので税額は加算しない
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    sealTotal,
    shippingFee,
    taxAmount,
    totalAmount,
    itemCount,
  };
}

/**
 * 注文内容を検証する
 */
export function validateTouchSealOrder(items: ValidationTouchSealItem[]): ValidationResult {
  const errors: string[] = [];

  if (!items || items.length === 0) {
    errors.push('注文アイテムが選択されていません');
    return { isValid: false, errors };
  }

  let totalQuantity = 0;
  const colorQuantities: Record<string, number> = {};

  for (const item of items) {
    if (!item.qrSlug || item.qrSlug.length < 3) {
      errors.push(`${item.color}のQRスラッグが無効です`);
    }

    if (item.quantity <= 0) {
      errors.push(`${item.color}の数量が無効です`);
    }

    if (item.quantity > TOUCH_SEAL_CONFIG.MAX_QUANTITY_PER_COLOR) {
      errors.push(`${item.color}の数量は${TOUCH_SEAL_CONFIG.MAX_QUANTITY_PER_COLOR}個まです`);
    }

    totalQuantity += item.quantity;
    colorQuantities[item.color] = (colorQuantities[item.color] || 0) + item.quantity;
  }

  if (totalQuantity > TOUCH_SEAL_CONFIG.MAX_TOTAL_QUANTITY) {
    errors.push(`合計数量は${TOUCH_SEAL_CONFIG.MAX_TOTAL_QUANTITY}個までです`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}