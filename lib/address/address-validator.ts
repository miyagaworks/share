// lib/address/address-validator.ts
/**
 * 郵便番号の形式をチェックする
 */
export function validatePostalCode(postalCode: string): boolean {
  return /^\d{3}-?\d{4}$/.test(postalCode);
}

/**
 * 郵便番号を正規化する（ハイフン付きに統一）
 */
export function normalizePostalCode(postalCode: string): string {
  const cleaned = postalCode.replace(/-/g, '');
  if (cleaned.length === 7) {
    return `${cleaned.substring(0, 3)}-${cleaned.substring(3)}`;
  }
  return postalCode;
}