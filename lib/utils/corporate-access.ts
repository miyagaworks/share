// lib/utils/corporate-access.ts
// ⚠️ 警告: このファイルはクライアントサイドでは使用できません
// サーバーサイドでの使用は lib/utils/corporate-access-server.ts を推奨

/**
 * クライアントサイドでの使用を防ぐガード関数
 */
function ensureServerSide(functionName: string) {
  if (typeof window !== 'undefined') {
    throw new Error(
      `❌ ${functionName} はクライアントサイドでは実行できません。\n` +
        `✅ API Routes でサーバー専用版を使用してください:\n` +
        `   import { checkCorporateAccess } from '@/lib/utils/corporate-access-server';`,
    );
  }
}

/**
 * 法人アクセス権チェック（サーバーサイド専用）
 *
 * ⚠️ 重要: この関数はサーバーサイドでのみ使用可能です
 * クライアントサイドで法人アクセス権をチェックする場合は、
 * 以下のAPIエンドポイントを呼び出してください:
 *
 * ```typescript
 * const response = await fetch('/api/corporate/access');
 * const { hasCorporateAccess } = await response.json();
 * ```
 *
 * または、クライアント専用ライブラリを使用:
 * ```typescript
 * import { checkCorporateAccess } from '@/lib/corporateAccess';
 * ```
 */
export async function checkCorporateAccess(userId: string) {
  ensureServerSide('checkCorporateAccess');

  // サーバー専用版にリダイレクト
  const { checkCorporateAccess: serverCheckCorporateAccess } = await import(
    './corporate-access-server'
  );
  return serverCheckCorporateAccess(userId);
}

/**
 * @deprecated このファイルは非推奨です
 *
 * 新しい使用方法:
 * - サーバーサイド: import from '@/lib/utils/corporate-access-server'
 * - クライアントサイド: import from '@/lib/corporateAccess'
 */
const corporateAccessUtils = {
  checkCorporateAccess,
};

export default corporateAccessUtils;