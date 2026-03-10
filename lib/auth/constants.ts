// lib/auth/constants.ts
// admin判定に使用するメールアドレス・ドメインの共通定数
// 環境変数が未設定の場合はShare本体のデフォルト値を使用

export const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'admin@sns-share.com';
export const ADMIN_EMAIL_DOMAIN = process.env.ADMIN_EMAIL_DOMAIN || '@sns-share.com';

/**
 * スーパー管理者かどうかを判定する
 */
export function isSuperAdmin(email: string | null | undefined): boolean {
  if (!email || !SUPER_ADMIN_EMAIL) return false;
  return email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

/**
 * 財務管理者ドメインに属するかどうかを判定する
 * ※ 実際の財務管理者判定にはFinancialAdminレコードのチェックも必要
 */
export function isAdminEmailDomain(email: string | null | undefined): boolean {
  if (!email || !ADMIN_EMAIL_DOMAIN) return false;
  return email.toLowerCase().endsWith(ADMIN_EMAIL_DOMAIN.toLowerCase());
}
