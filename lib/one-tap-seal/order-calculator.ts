// lib/one-tap-seal/order-calculator.ts
import { ONE_TAP_SEAL_CONFIG } from '@/types/one-tap-seal';
import type {
  ValidationOneTapSealItem,
  OrderCalculation,
  ValidationResult,
  OneTapSealSelection,
} from '@/types/one-tap-seal';

/**
 * 注文金額を計算する（税込価格）
 */
export function calculateOrderAmount(items: ValidationOneTapSealItem[]): OrderCalculation {
  const sealTotal = items.reduce(
    (sum, item) => sum + item.quantity * ONE_TAP_SEAL_CONFIG.UNIT_PRICE,
    0,
  );
  const shippingFee = ONE_TAP_SEAL_CONFIG.SHIPPING_FEE;
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
export function validateOneTapSealOrder(items: ValidationOneTapSealItem[]): ValidationResult {
  const errors: string[] = [];

  if (!items || items.length === 0) {
    errors.push('注文アイテムが選択されていません');
    return { isValid: false, errors };
  }

  let totalQuantity = 0;
  const colorQuantities: Record<string, number> = {};

  for (const item of items) {
    // profileSlug のバリデーション
    if (!item.profileSlug || item.profileSlug.length < 3) {
      errors.push(`${item.color}のプロフィールスラッグが無効です`);
    }

    if (item.quantity <= 0) {
      errors.push(`${item.color}の数量が無効です`);
    }

    if (item.quantity > ONE_TAP_SEAL_CONFIG.MAX_QUANTITY_PER_COLOR) {
      errors.push(`${item.color}の数量は${ONE_TAP_SEAL_CONFIG.MAX_QUANTITY_PER_COLOR}個までです`);
    }

    totalQuantity += item.quantity;
    colorQuantities[item.color] = (colorQuantities[item.color] || 0) + item.quantity;
  }

  if (totalQuantity > ONE_TAP_SEAL_CONFIG.MAX_TOTAL_QUANTITY) {
    errors.push(`合計数量は${ONE_TAP_SEAL_CONFIG.MAX_TOTAL_QUANTITY}個までです`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 選択状態から金額計算
 */
export function calculateSelectionAmount(selection: OneTapSealSelection): number {
  const totalQuantity = Object.values(selection).reduce((sum, qty) => sum + qty, 0);
  
  if (totalQuantity === 0) {
    return 0;
  }

  const itemTotal = totalQuantity * ONE_TAP_SEAL_CONFIG.UNIT_PRICE;
  return itemTotal + ONE_TAP_SEAL_CONFIG.SHIPPING_FEE;
}