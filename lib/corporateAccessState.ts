// lib/corporateAccessState.ts
import { logger } from '@/lib/utils/logger';
declare global {
  interface Window {
    _corporateAccessState?: CorporateAccessState;
  }
}

// イベント型の拡張（TypeScriptのため）
declare global {
  interface WindowEventMap {
    corporateAccessChanged: CustomEvent<CorporateAccessState>;
  }
}

export interface CorporateAccessState {
  hasAccess: boolean | null;
  isAdmin: boolean;
  isSuperAdmin: boolean; // 追加: スーパー管理者フラグ
  tenantId?: string | null;
  lastChecked: number;
  userRole?: string | null;
  error?: string | null;
}

// デバッグログを記録する関数
function logDebug(action: string, data: unknown) {
  // 統合ロガーを使用
  logger.corporate(action, data);
}

// アプリ全体で共有される状態
export const corporateAccessState: CorporateAccessState = {
  hasAccess: null,
  isAdmin: false,
  isSuperAdmin: false, // 追加: スーパー管理者フラグ
  tenantId: null,
  lastChecked: 0,
  userRole: null,
  error: null,
};

// デバッグ用にグローバル変数名を明示
const STATE_VAR_NAME = '_corporateAccessState';

// クライアントサイドでのみ実行される関数 - 管理者状態をローカルストレージに保存
const persistAdminStatus = () => {
  if (typeof window === 'undefined') return;

  const adminStatus = corporateAccessState.isSuperAdmin;
  try {
    // ローカルストレージに保存
    localStorage.setItem('sns_share_admin_status', adminStatus ? 'true' : 'false');
    logDebug('管理者状態をローカルストレージに保存', { adminStatus });
  } catch (e) {
    logDebug('ローカルストレージ保存エラー', { error: e });
  }
};

// 状態を読み込む関数 - ローカルストレージから管理者状態を読み込む
const loadAdminStatus = () => {
  if (typeof window === 'undefined') return false;

  try {
    const savedStatus = localStorage.getItem('sns_share_admin_status');
    const isAdmin = savedStatus === 'true';
    logDebug('管理者状態をローカルストレージから読み込み', { isAdmin });
    return isAdmin;
  } catch (e) {
    logDebug('ローカルストレージ読み込みエラー', { error: e });
    return false;
  }
};

// windowオブジェクトにも同じ参照を保存（クライアントサイドのみ）
if (typeof window !== 'undefined') {
  if (!window[STATE_VAR_NAME]) {
    window[STATE_VAR_NAME] = corporateAccessState;
    logDebug('初期化', { ...corporateAccessState });

    // 初期化時にローカルストレージから管理者状態を読み込む
    corporateAccessState.isSuperAdmin = loadAdminStatus();
  } else {
    // 既に存在する場合は、その値をコピー
    Object.assign(corporateAccessState, window[STATE_VAR_NAME]);
    logDebug('状態復元', { ...corporateAccessState });
  }
}

// 状態を更新する関数 - 管理者状態の上書き防止機能を追加
export function updateCorporateAccessState(newState: Partial<CorporateAccessState>): void {
  // 変更前後の状態をより詳細にログ出力
  const prevState = { ...corporateAccessState };
  logDebug('状態更新前', prevState);

  // isSuperAdmin を明示的に false に設定しようとしている場合、
  // 既存の値が true の場合は上書きしないようにする
  if (newState.isSuperAdmin === false && corporateAccessState.isSuperAdmin === true) {
    delete newState.isSuperAdmin;
    logDebug('管理者状態の保持', { keepAdmin: true });
  }

  // ここに永久利用権ユーザーの処理を追加
  // 永久利用権ユーザーがisSuperAdminをtrueに設定しようとした場合を制限
  if (newState.isSuperAdmin === true) {
    // 永久利用権ユーザーかどうかをチェック
    const isPermanentUser = (() => {
      if (typeof window !== 'undefined') {
        try {
          const userDataStr = sessionStorage.getItem('userData');
          if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            return userData.subscriptionStatus === 'permanent';
          }
        } catch (e) {
          logDebug('永久利用権チェックエラー', e);
        }
      }
      return false;
    })();

    if (isPermanentUser) {
      // 永久利用権ユーザーがisSuperAdminをtrueに設定しようとしている場合は制限
      delete newState.isSuperAdmin;
      logDebug('永久利用権ユーザーは管理者状態にできません', { userId: 'unknown' });
    }
  }

  Object.assign(corporateAccessState, newState);

  // 管理者状態が変更された場合はローカルストレージに保存
  if (newState.isSuperAdmin !== undefined) {
    persistAdminStatus();
  }

  // windowオブジェクトも更新
  if (typeof window !== 'undefined' && window[STATE_VAR_NAME]) {
    Object.assign(window[STATE_VAR_NAME], newState);
  }

  logDebug('状態更新後', { ...corporateAccessState });

  // イベントをより確実にディスパッチ
  if (typeof window !== 'undefined') {
    try {
      // モバイル環境を考慮したタイムアウト処理を追加
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('corporateAccessChanged', {
            detail: { ...corporateAccessState }, // オブジェクトをコピーして渡す
          }),
        );
        logDebug('イベントディスパッチ', {
          type: 'corporateAccessChanged',
          detail: { ...corporateAccessState },
        });
      }, 0);
    } catch (e) {
      logDebug('イベントディスパッチエラー', e);
    }
  }
}

// 関数を外部からも呼び出せるようにエクスポート
export function checkPermanentAccess() {
  // ページロード時に sessionStorage から確認
  if (typeof window !== 'undefined') {
    try {
      // subscriptionStatus を sessionStorage から取得
      const userDataStr = sessionStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        const isPermanent = userData.subscriptionStatus === 'permanent';

        // もし永久利用権ユーザーなら、その状態をcorporateAccessStateに反映
        if (isPermanent && corporateAccessState.hasAccess !== true) {
          updateCorporateAccessState({
            hasAccess: true,
            isAdmin: true,
            isSuperAdmin: false, // 明示的にfalseを設定
            tenantId: `virtual-tenant-${userData.id || Date.now()}`,
            userRole: 'admin',
            error: null,
            lastChecked: Date.now(),
          });
        }

        return isPermanent;
      }
    } catch (e) {
      logDebug('永久利用権チェックエラー', e);
    }
  }
  return false;
}

// APIチェック関数 - 管理者状態を維持するように修正
export const checkCorporateAccess = async (force = false) => {
  const now = Date.now();

  // キャッシュ利用判定で、永久利用権も考慮
  const isPermanent = checkPermanentAccess();
  if (isPermanent) {
    // 永久利用権ユーザーの状態が既に設定されているはずなので、
    // 追加の更新は不要。ただし最終チェック時間は更新
    if (corporateAccessState.lastChecked < now - 60000) {
      // 1分以上経過している場合のみ更新
      updateCorporateAccessState({
        lastChecked: now,
      });
    }
    return { ...corporateAccessState };
  }

  // 既存の管理者状態を保存
  const currentIsSuperAdmin = corporateAccessState.isSuperAdmin;

  // モバイル環境検出（より確実に）
  const isMobile =
    typeof navigator !== 'undefined' &&
    (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
      (typeof window !== 'undefined' && window.innerWidth < 768));

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
    return { ...corporateAccessState }; // 必ず新しいオブジェクトを返す
  }

  // 一時的な状態として「チェック中」をマーク
  updateCorporateAccessState({
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
        // タイムアウト処理のため、自前で AbortController を使用
        signal: AbortSignal.timeout(10000), // 10秒タイムアウト
      },
    );

    logDebug('APIレスポンス受信', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
    });

    if (response.status === 403) {
      const errorData = await response.json().catch(() => ({}));

      logDebug('アクセス拒否', {
        status: 403,
        errorData,
      });

      updateCorporateAccessState({
        hasAccess: false,
        isAdmin: false,
        // 修正: 管理者状態を維持
        isSuperAdmin: currentIsSuperAdmin,
        tenantId: null,
        userRole: null,
        error: errorData.error || '法人プランへのアクセス権がありません',
        lastChecked: now,
      });
    } else if (response.ok) {
      const data = await response.json().catch(() => null);

      if (!data) {
        throw new Error('APIレスポンスの解析に失敗しました');
      }

      logDebug('APIレスポンス解析成功', data);

      // テナントID決定ロジックの堅牢化
      let finalTenantId = null;

      if (data.tenantId && typeof data.tenantId === 'string') {
        finalTenantId = data.tenantId;
      } else if (data.tenant && data.tenant.id) {
        finalTenantId = data.tenant.id;
      }

      // APIからのアクセス権情報が明示的にfalseの場合のみfalse
      const accessResult = data.hasAccess === false ? false : data.hasAccess === true ? true : null;

      // 修正: APIからスーパー管理者状態を取得するか、既存の状態を維持
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

      // 状態更新
      updateCorporateAccessState({
        hasAccess: accessResult,
        isAdmin: data.isAdmin === true,
        isSuperAdmin: isSuperAdmin, // 修正: スーパー管理者状態を維持
        tenantId: finalTenantId,
        userRole: data.userRole || data.role || null,
        error: null,
        lastChecked: now,
      });
    } else {
      // サーバーエラー
      logDebug('APIサーバーエラー', {
        status: response.status,
        statusText: response.statusText,
      });

      // エラー時もテナントIDをキープ（存在する場合）
      const keepTenantId = corporateAccessState.tenantId || null;

      updateCorporateAccessState({
        // hasAccessは変更しない（nullのまま）
        // ただしAPIエラーなので、信頼性が低い状態としてnullをセット
        hasAccess: null,
        // 修正: 管理者状態を維持
        isSuperAdmin: currentIsSuperAdmin,
        error: `サーバーエラー (${response.status}): APIからの応答に問題があります`,
        tenantId: keepTenantId,
        lastChecked: now,
      });
    }

    return { ...corporateAccessState };
  } catch (error) {
    logDebug('API例外発生', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // ネットワークエラーでも既存のテナントIDを保持
    const keepTenantId = corporateAccessState.tenantId || null;

    updateCorporateAccessState({
      // 接続エラーでも既存の状態をすぐには無効化しない
      hasAccess: null, // nullは「不明」を意味する
      // 修正: 管理者状態を維持
      isSuperAdmin: currentIsSuperAdmin,
      error: error instanceof Error ? error.message : 'APIリクエスト中にエラーが発生しました',
      tenantId: keepTenantId,
      lastChecked: now,
    });

    return { ...corporateAccessState };
  }
};

// ユーザーが法人管理者かどうかを確認
export function isUserCorporateAdmin(): boolean {
  const result = corporateAccessState.isAdmin === true && corporateAccessState.userRole === 'admin';
  logDebug('管理者チェック', { result, state: { ...corporateAccessState } });
  return result;
}

// スーパー管理者かどうかを確認する関数
export function isUserSuperAdmin(): boolean {
  return corporateAccessState.isSuperAdmin === true;
}

// 状態をリセットする関数
export function resetCorporateAccessState(): void {
  logDebug('状態リセット前', { ...corporateAccessState });

  // 管理者状態の保存
  const currentIsSuperAdmin = corporateAccessState.isSuperAdmin;

  updateCorporateAccessState({
    hasAccess: null,
    isAdmin: false,
    // 修正: 管理者状態を維持
    isSuperAdmin: currentIsSuperAdmin,
    tenantId: null,
    userRole: null,
    lastChecked: 0,
    error: null,
  });

  logDebug('状態リセット後', { ...corporateAccessState });
}

// クッキーを保存する際のオプション
export function setCorporateAccessCookies(hasAccess: boolean, role: string | null): void {
  // 環境判定
  const isProduction = process.env.NODE_ENV === 'production';

  // 開発環境では簡易な設定で
  if (!isProduction) {
    document.cookie = `corporateAccess=${hasAccess}; path=/;`;
    document.cookie = `corporateRole=${role || ''}; path=/;`;
  } else {
    // 本番環境ではセキュリティ強化
    document.cookie = `corporateAccess=${hasAccess}; path=/; secure; max-age=${24 * 60 * 60}; samesite=strict`;
    document.cookie = `corporateRole=${role || ''}; path=/; secure; max-age=${24 * 60 * 60}; samesite=strict`;
  }

  logDebug('クッキー設定', { hasAccess, role, isProduction });
}

// クッキー更新処理 - 修正前は関数内の別の場所にあったコード
if (typeof document !== 'undefined') {
  // クッキーを更新（userRoleがundefinedの場合はnullを使用）
  setCorporateAccessCookies(
    corporateAccessState.hasAccess === true,
    corporateAccessState.userRole !== undefined ? corporateAccessState.userRole : null,
  );
}