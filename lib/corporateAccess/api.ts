// lib/corporateAccess/api.ts
import { corporateAccessState, isClient, logDebug, updateState } from './state';
import { checkPermanentAccess, PermanentPlanType } from './permanentAccess';
import { setCorporateAccessCookies } from './storage';

/**
 * API結果の型定義
 */
export interface ApiResult {
  hasAccess: boolean | null;
  isAdmin: boolean;
  tenantId: string | null;
  userRole: string | null;
  error?: string | null;
}

/**
 * 法人アクセス権をAPIで確認する
 *
 * @param options APIオプション
 * @returns 法人アクセス権情報
 */
export async function checkCorporateAccess(
  options: { force?: boolean; timeout?: number } = {},
): Promise<ApiResult> {
  const now = Date.now();
  const { force = false, timeout = 10000 } = options;

  // キャッシュ利用判定で、永久利用権も考慮
  const isPermanent = checkPermanentAccess();

  if (isPermanent) {
    // 永久利用権ユーザーの場合
    const userId = getUserIdFromSessionStorage() || 'unknown';

    // プラン種別を取得
    const planType =
      (corporateAccessState.permanentPlanType as PermanentPlanType) || PermanentPlanType.PERSONAL;

    // 個人プランの場合はアクセス権なし、それ以外はあり
    const hasAccess = planType !== PermanentPlanType.PERSONAL;

    // 永久利用権ユーザー用の結果を返す
    const permanentResult: ApiResult = {
      hasAccess: hasAccess,
      isAdmin: hasAccess,
      tenantId: hasAccess ? `virtual-tenant-${userId}` : null,
      userRole: hasAccess ? 'admin' : null,
    };

    // 状態を更新
    updateState({
      ...permanentResult,
      isPermanentUser: true,
      permanentPlanType: planType,
      lastChecked: now,
    });

    return permanentResult;
  }

  // モバイル環境検出
  const isMobile = detectMobileEnvironment();

  // キャッシュの最適化
  const CACHE_DURATION = isMobile ? 15 * 1000 : 30 * 1000; // モバイルはより短く

  // キャッシュ利用判定を厳格化
  if (
    !force &&
    corporateAccessState.lastChecked > 0 &&
    corporateAccessState.hasAccess !== null &&
    typeof corporateAccessState.tenantId === 'string' &&
    corporateAccessState.tenantId.length > 0 &&
    now - corporateAccessState.lastChecked < CACHE_DURATION
  ) {
    logDebug('キャッシュ使用', {
      age: now - corporateAccessState.lastChecked,
      state: { ...corporateAccessState },
    });

    return {
      hasAccess: corporateAccessState.hasAccess,
      isAdmin: corporateAccessState.isAdmin,
      tenantId: corporateAccessState.tenantId,
      userRole: corporateAccessState.userRole,
    };
  }

  // 一時的な状態として「チェック中」をマーク
  updateState({
    lastChecked: now,
  });

  try {
    logDebug('APIリクエスト開始', { timestamp: now, isMobile, force });

    // APIリクエストの堅牢化
    const response = await fetch(
      `/api/corporate/access?t=${now}&mobile=${isMobile ? 1 : 0}&force=${force ? 1 : 0}`,
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
          Accept: 'application/json',
        },
        credentials: 'include',
        // タイムアウト処理
        signal: AbortSignal.timeout(timeout),
      },
    );

    logDebug('APIレスポンス受信', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
    });

    // アクセス拒否の場合
    if (response.status === 403) {
      const errorData = await response.json().catch(() => ({}));

      logDebug('アクセス拒否', {
        status: 403,
        errorData,
      });

      // 既存の管理者状態を保存
      const currentIsSuperAdmin = corporateAccessState.isSuperAdmin;

      const result: ApiResult = {
        hasAccess: false,
        isAdmin: false,
        tenantId: null,
        userRole: null,
        error: errorData.error || '法人プランへのアクセス権がありません',
      };

      updateState({
        ...result,
        isSuperAdmin: currentIsSuperAdmin, // 管理者状態を維持
        isPermanentUser: false,
        lastChecked: now,
      });

      // クッキーを更新
      setCorporateAccessCookies(false, null);

      return result;
    }
    // 正常なレスポンスの場合
    else if (response.ok) {
      const data = await response.json().catch(() => null);

      if (!data) {
        throw new Error('APIレスポンスの解析に失敗しました');
      }

      logDebug('APIレスポンス解析成功', data);

      // テナントID決定ロジック
      let finalTenantId = null;

      if (data.tenantId && typeof data.tenantId === 'string') {
        finalTenantId = data.tenantId;
      } else if (data.tenant && data.tenant.id) {
        finalTenantId = data.tenant.id;
      }

      // APIからのアクセス権情報
      const accessResult = data.hasAccess === false ? false : data.hasAccess === true ? true : null;

      // 管理者状態の決定
      const currentIsSuperAdmin = corporateAccessState.isSuperAdmin;
      const isSuperAdmin = data.isSuperAdmin === true || currentIsSuperAdmin === true;

      // テナントIDがない場合のフォールバック
      if (accessResult === true && (!finalTenantId || finalTenantId.length === 0)) {
        // フォールバックの強化
        finalTenantId = isMobile ? 'mobile-fallback-tenant-id' : 'fallback-tenant-id';
        logDebug('テナントID取得不可、フォールバック使用', {
          originalData: data,
          fallbackId: finalTenantId,
        });
      }

      // ユーザーロールの決定
      const userRole = data.userRole || data.role || null;

      // ユーザーのアクセス権を判定
      // userRoleが'member'または'admin'であれば、明示的にhasAccessをtrueに設定
      let hasAccess = accessResult;
      if ((userRole === 'member' || userRole === 'admin') && hasAccess !== false) {
        hasAccess = true;
        logDebug('メンバーまたは管理者ロールを検出、法人アクセス権を付与', { userRole });
      }

      // 永久利用権ユーザーの場合は、永久利用権の状態を確認し反映
      const isPermanentUser = checkPermanentAccess();
      if (isPermanentUser) {
        const planType =
          (corporateAccessState.permanentPlanType as PermanentPlanType) ||
          PermanentPlanType.PERSONAL;
        hasAccess = planType !== PermanentPlanType.PERSONAL;
        logDebug('永久利用権ユーザーのアクセス状態を更新', {
          isPermanentUser,
          planType,
          hasAccess,
        });
      }

      const result: ApiResult = {
        hasAccess,
        isAdmin: data.isAdmin === true,
        tenantId: finalTenantId,
        userRole: userRole,
      };

      // 状態更新
      updateState({
        ...result,
        isSuperAdmin,
        isPermanentUser: isPermanentUser,
        lastChecked: now,
        error: null,
      });

      // クッキーを更新
      setCorporateAccessCookies(hasAccess === true, userRole);

      return result;
    }
    // サーバーエラーの場合
    else {
      // サーバーエラー
      logDebug('APIサーバーエラー', {
        status: response.status,
        statusText: response.statusText,
      });

      // エラー時もテナントIDをキープ（存在する場合）
      const keepTenantId = corporateAccessState.tenantId || null;

      const result: ApiResult = {
        hasAccess: null, // nullは「不明」を意味する
        isAdmin: corporateAccessState.isAdmin,
        tenantId: keepTenantId,
        userRole: corporateAccessState.userRole,
        error: `サーバーエラー (${response.status}): APIからの応答に問題があります`,
      };

      updateState({
        error: result.error,
        lastChecked: now,
      });

      return result;
    }
  } catch (error) {
    logDebug('API例外発生', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // ネットワークエラーでも既存のテナントIDを保持
    const keepTenantId = corporateAccessState.tenantId || null;

    const result: ApiResult = {
      hasAccess: null, // nullは「不明」を意味する
      isAdmin: corporateAccessState.isAdmin,
      tenantId: keepTenantId,
      userRole: corporateAccessState.userRole,
      error: error instanceof Error ? error.message : 'APIリクエスト中にエラーが発生しました',
    };

    updateState({
      error: result.error,
      lastChecked: now,
    });

    return result;
  }
}

/**
 * セッションストレージからユーザーIDを取得
 *
 * @returns ユーザーID、ない場合は空文字
 */
function getUserIdFromSessionStorage(): string {
  if (!isClient() || typeof sessionStorage === 'undefined') {
    return '';
  }

  try {
    const userDataStr = sessionStorage.getItem('userData');
    if (userDataStr) {
      const userData = JSON.parse(userDataStr);
      return userData.id || '';
    }
  } catch (e) {
    logDebug('ユーザーID取得エラー', e);
  }

  return '';
}

/**
 * モバイル環境を検出
 *
 * @returns モバイル環境の場合はtrue
 */
function detectMobileEnvironment(): boolean {
  if (!isClient()) return false;

  return (
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    (typeof window !== 'undefined' && window.innerWidth < 768)
  );
}

/**
 * ユーザーが法人管理者かどうかを確認
 *
 * @returns 法人管理者の場合はtrue
 */
export function isUserCorporateAdmin(): boolean {
  // 永久利用権ユーザーの場合は特別処理
  if (corporateAccessState.isPermanentUser) {
    const planType = corporateAccessState.permanentPlanType as PermanentPlanType;
    // 永久利用権が個人プラン以外の場合のみ管理者
    return planType !== PermanentPlanType.PERSONAL;
  }

  // 通常ユーザーの場合は標準ロジック
  const result = corporateAccessState.isAdmin === true && corporateAccessState.userRole === 'admin';
  logDebug('法人管理者チェック', { result, state: { ...corporateAccessState } });
  return result;
}