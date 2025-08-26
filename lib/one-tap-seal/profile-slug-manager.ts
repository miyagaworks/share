// lib/one-tap-seal/profile-slug-manager.ts
import type { ProfileSlugInfo } from '@/types/one-tap-seal'; // インポート追加

/**
 * プロフィールスラッグの形式をチェックする
 */
export function isValidProfileSlug(slug: string): boolean {
  return /^[a-z0-9-]{3,20}$/.test(slug);
}

/**
 * NFCタグ書き込み用URLを生成する
 */
export function generateNfcTagUrl(profileSlug: string): string {
  return `https://app.sns-share.com/${profileSlug}`;
}

/**
 * プロフィールスラッグから完全なURL情報を生成
 */
export function generateProfileSlugInfo(slug: string): ProfileSlugInfo {
  return {
    slug,
    isExisting: false,
    isAvailable: false,
    profileUrl: generateNfcTagUrl(slug),
  };
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