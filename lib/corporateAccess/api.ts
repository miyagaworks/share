// lib/corporateAccess/api.ts
import { corporateAccessState, updateState, logDebug, isClient } from './state';
import { saveToStorage, StorageKey, StorageType } from './storage';
export interface ApiResult {
  hasCorporateAccess: boolean;
  isAdmin: boolean;
  isSuperAdmin?: boolean;
  tenant?: {
    id: string;
    accountStatus: string;
  } | null;
  subscription?: {
    plan: string;
    status: string;
  } | null;
  userRole?: string | null;
  error?: string | null;
}
interface CheckCorporateAccessOptions {
  force?: boolean;
  userId?: string;
}
/**
 * 法人アクセス権をチェックする（クライアントサイド専用）
 * サーバーサイドのAPIを呼び出してデータを取得
 */
export async function checkCorporateAccess(
  options: CheckCorporateAccessOptions = {},
): Promise<ApiResult> {
  const { force = false } = options;
  // サーバーサイドでは実行しない
  if (!isClient()) {
    return {
      hasCorporateAccess: false,
      isAdmin: false,
      error: 'サーバーサイドでは実行できません',
    };
  }
  logDebug('法人アクセス権チェック開始', options);
  // キャッシュ確認（強制でない場合）
  if (!force && corporateAccessState.lastChecked > 0) {
    const cacheExpiry = 5 * 60 * 1000; // 5分
    const timeSinceLastCheck = Date.now() - corporateAccessState.lastChecked;
    if (timeSinceLastCheck < cacheExpiry && corporateAccessState.hasAccess !== null) {
      logDebug('キャッシュから法人アクセス権を返却', corporateAccessState);
      return {
        hasCorporateAccess: corporateAccessState.hasAccess,
        isAdmin: corporateAccessState.isAdmin,
        isSuperAdmin: corporateAccessState.isSuperAdmin,
        tenant: corporateAccessState.tenantId
          ? { id: corporateAccessState.tenantId, accountStatus: 'active' }
          : null,
        userRole: corporateAccessState.userRole,
        error: corporateAccessState.error,
      };
    }
  }
  try {
    // APIエンドポイントを呼び出し
    const response = await fetch('/api/corporate/access', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`API呼び出しエラー: ${response.status}`);
    }
    const result: ApiResult = await response.json();
    // 状態を更新
    updateState({
      hasAccess: result.hasCorporateAccess,
      isAdmin: result.isAdmin,
      isSuperAdmin: result.isSuperAdmin || false,
      tenantId: result.tenant?.id || null,
      userRole: result.userRole || null,
      lastChecked: Date.now(),
      error: result.error || null,
    });
    // ストレージにも保存
    if (result.hasCorporateAccess) {
      saveToStorage(
        StorageKey.CORPORATE_ACCESS,
        {
          hasAccess: true,
          isAdmin: result.isAdmin,
          tenantId: result.tenant?.id,
          timestamp: Date.now(),
        },
        StorageType.LOCAL,
      );
    }
    logDebug('法人アクセス権チェック完了', result);
    return result;
  } catch (error) {
    logDebug('法人アクセス権チェックエラー', error);
    const errorMessage = error instanceof Error ? error.message : '不明なエラー';
    // エラー状態を更新
    updateState({
      hasAccess: false,
      isAdmin: false,
      isSuperAdmin: false,
      tenantId: null,
      userRole: null,
      lastChecked: Date.now(),
      error: errorMessage,
    });
    return {
      hasCorporateAccess: false,
      isAdmin: false,
      isSuperAdmin: false,
      error: errorMessage,
    };
  }
}
/**
 * ユーザーが法人管理者かどうかを判定（クライアントサイド専用）
 */
export async function isUserCorporateAdmin(): Promise<boolean> {
  try {
    const result = await checkCorporateAccess();
    return result.isAdmin && result.hasCorporateAccess;
  } catch (error) {
    logDebug('法人管理者判定エラー', error);
    return false;
  }
}