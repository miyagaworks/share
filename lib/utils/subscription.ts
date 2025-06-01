// lib/utils/subscription.ts
import { logger } from "@/lib/utils/logger";
// ⚠️ 警告: このファイルはクライアントサイドでは使用できません
// サーバーサイドでの使用は lib/utils/subscription-server.ts を推奨
/**
 * クライアントサイドでの使用を防ぐガード関数
 */
function ensureServerSide(functionName: string) {
  if (typeof window !== 'undefined') {
    throw new Error(
      `❌ ${functionName} はクライアントサイドでは実行できません。\n` +
        `✅ API Routes でサーバー専用版を使用してください:\n` +
        `   import { ${functionName} } from '@/lib/utils/subscription-server';`,
    );
  }
}
/**
 * トライアル終了メール送信（サーバーサイド専用）
 *
 * ⚠️ 重要: この関数はサーバーサイドでのみ使用可能です
 * クライアントサイドでサブスクリプション情報を取得する場合は、
 * 以下のAPIエンドポイントを呼び出してください:
 *
 * ```typescript
 * const response = await fetch('/api/subscription');
 * const subscriptionData = await response.json();
 * ```
 */
export async function sendTrialEndingEmails() {
  ensureServerSide('sendTrialEndingEmails');
  // サーバー専用版にリダイレクト
  const { sendTrialEndingEmails: serverSendTrialEndingEmails } = await import(
    './subscription-server'
  );
  return serverSendTrialEndingEmails();
}
/**
 * 猶予期間チェック（サーバーサイド専用）
 *
 * ⚠️ 重要: この関数はサーバーサイドでのみ使用可能です
 */
export async function checkExpiredGracePeriods() {
  ensureServerSide('checkExpiredGracePeriods');
  // サーバー専用版にリダイレクト
  const { checkExpiredGracePeriods: serverCheckExpiredGracePeriods } = await import(
    './subscription-server'
  );
  return serverCheckExpiredGracePeriods();
}
/**
 * @deprecated このファイルは非推奨です
 *
 * 新しい使用方法:
 * - サーバーサイド: import from '@/lib/utils/subscription-server'
 * - クライアントサイド: APIエンドポイント経由でデータを取得
 */
const subscriptionUtils = {
  sendTrialEndingEmails,
  checkExpiredGracePeriods,
};
export default subscriptionUtils;