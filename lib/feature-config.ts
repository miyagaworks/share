// lib/feature-config.ts
// 機能の切り替えを管理する設定ファイル

export const FEATURE_FLAGS = {
  // ワンタップシール機能の有効/無効
  USE_ONE_TAP_SEAL: process.env.NEXT_PUBLIC_USE_ONE_TAP_SEAL === 'true',

  // 並行運用期間中の設定
  ALLOW_BOTH_FEATURES: process.env.NEXT_PUBLIC_ALLOW_BOTH_FEATURES === 'true',

  // 管理者のみ新機能を利用可能
  ADMIN_ONLY_ONE_TAP_SEAL: process.env.NEXT_PUBLIC_ADMIN_ONLY_ONE_TAP_SEAL === 'true',
} as const;

// 表示名の取得（機能に応じて切り替え）
export function getSealFeatureName(): string {
  return FEATURE_FLAGS.USE_ONE_TAP_SEAL ? 'ワンタップシール' : 'タッチシール';
}

// ユーザーが新機能を利用可能かチェック
export function canUseOneTapSeal(userRole?: string, isAdmin?: boolean): boolean {
  if (!FEATURE_FLAGS.USE_ONE_TAP_SEAL) {
    return false;
  }

  if (FEATURE_FLAGS.ADMIN_ONLY_ONE_TAP_SEAL) {
    return isAdmin || userRole === 'super-admin' || userRole === 'financial-admin';
  }

  return true;
}

// API エンドポイントの取得
export function getSealApiEndpoint(): string {
  return '/api/one-tap-seal';
}

// コンポーネントパスの取得
export function getSealComponentPath(): string {
  return 'one-tap-seal';
}