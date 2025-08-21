// lib/touch-seal/qr-slug-manager.ts

/**
 * QRスラッグを生成する
 */
export function generateQrSlug(baseName: string): string {
  // 名前をローマ字風に変換（簡易版）
  const romanized = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 10);

  // ランダム文字列を追加
  const random = Math.random().toString(36).substring(2, 6);

  return `${romanized}${random}`;
}

/**
 * QRスラッグの形式をチェックする
 */
export function isValidQrSlug(slug: string): boolean {
  return /^[a-z0-9-]{3,20}$/.test(slug);
}

/**
 * 郵便番号を正規化する（ハイフンを追加）
 */
export function normalizePostalCode(postalCode: string): string {
  // 数字のみ抽出
  const digitsOnly = postalCode.replace(/\D/g, '');

  // 7桁の場合、3-4形式にする
  if (digitsOnly.length === 7) {
    return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3)}`;
  }

  return postalCode;
}

/**
 * 郵便番号の形式をチェックする
 */
export function validatePostalCode(postalCode: string): boolean {
  // 数字のみ抽出
  const digitsOnly = postalCode.replace(/\D/g, '');

  // 7桁であることを確認
  if (digitsOnly.length !== 7) {
    return false;
  }

  // 基本的な形式チェック（123-4567 または 1234567）
  const patterns = [
    /^\d{3}-\d{4}$/, // 123-4567
    /^\d{7}$/, // 1234567
  ];

  return patterns.some((pattern) => pattern.test(postalCode));
}