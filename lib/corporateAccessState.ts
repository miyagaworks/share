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
  tenantId: null,
  lastChecked: 0,
  userRole: null,
  error: null,
};

// デバッグ用にグローバル変数名を明示
const STATE_VAR_NAME = '_corporateAccessState';

// windowオブジェクトにも同じ参照を保存（クライアントサイドのみ）
if (typeof window !== 'undefined') {
  if (!window[STATE_VAR_NAME]) {
    window[STATE_VAR_NAME] = corporateAccessState;
    logDebug('初期化', { ...corporateAccessState });
  } else {
    // 既に存在する場合は、その値をコピー
    Object.assign(corporateAccessState, window[STATE_VAR_NAME]);
    logDebug('状態復元', { ...corporateAccessState });
  }
}

// 状態を更新する関数
export function updateCorporateAccessState(newState: Partial<CorporateAccessState>): void {
  // 変更前後の状態をより詳細にログ出力
  const prevState = { ...corporateAccessState };
  logDebug('状態更新前', prevState);

  Object.assign(corporateAccessState, newState);

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

// APIチェック関数
export const checkCorporateAccess = async (force = false) => {
  const now = Date.now();
  
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
    lastChecked: now
  });
  
  try {
    logDebug('APIリクエスト開始', { timestamp: now, isMobile, force });
    
    // APIリクエストの堅牢化
    const response = await fetch(`/api/corporate/access?t=${now}&mobile=${isMobile ? 1 : 0}&force=${force ? 1 : 0}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
        'Accept': 'application/json'
      },
      credentials: 'include',
      // タイムアウト処理のため、自前で AbortController を使用
      signal: AbortSignal.timeout(10000) // 10秒タイムアウト
    });
    
    logDebug('APIレスポンス受信', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    });
    
    if (response.status === 403) {
      const errorData = await response.json().catch(() => ({}));
      
      logDebug('アクセス拒否', {
        status: 403,
        errorData
      });
      
      updateCorporateAccessState({
        hasAccess: false,
        isAdmin: false,
        tenantId: null,
        userRole: null,
        error: errorData.error || '法人プランへのアクセス権がありません',
        lastChecked: now
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
      const accessResult = data.hasAccess === false ? false : 
                          (data.hasAccess === true ? true : null);
      
      // テナントIDがない場合のフォールバック
      if (accessResult === true && (!finalTenantId || finalTenantId.length === 0)) {
        // フォールバックの強化
        finalTenantId = isMobile ? 'mobile-fallback-tenant-id' : 'fallback-tenant-id';
        logDebug('テナントID取得不可、フォールバック使用', { 
          originalData: data, 
          fallbackId: finalTenantId 
        });
      }
      
      // 状態更新
      updateCorporateAccessState({
        hasAccess: accessResult,
        isAdmin: data.isAdmin === true,
        tenantId: finalTenantId,
        userRole: data.userRole || data.role || null,
        error: null,
        lastChecked: now
      });
      
    } else {
      // サーバーエラー
      logDebug('APIサーバーエラー', {
        status: response.status,
        statusText: response.statusText
      });
      
      // エラー時もテナントIDをキープ（存在する場合）
      const keepTenantId = corporateAccessState.tenantId || null;
      
      updateCorporateAccessState({
        // hasAccessは変更しない（nullのまま）
        // ただしAPIエラーなので、信頼性が低い状態としてnullをセット
        hasAccess: null,
        error: `サーバーエラー (${response.status}): APIからの応答に問題があります`,
        tenantId: keepTenantId,
        lastChecked: now
      });
    }
    
    return { ...corporateAccessState };
    
  } catch (error) {
    logDebug('API例外発生', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // ネットワークエラーでも既存のテナントIDを保持
    const keepTenantId = corporateAccessState.tenantId || null;
    
    updateCorporateAccessState({
      // 接続エラーでも既存の状態をすぐには無効化しない
      hasAccess: null,  // nullは「不明」を意味する
      error: error instanceof Error ? error.message : 'APIリクエスト中にエラーが発生しました',
      tenantId: keepTenantId,
      lastChecked: now
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

// 状態をリセットする関数
export function resetCorporateAccessState(): void {
  logDebug('状態リセット前', { ...corporateAccessState });

  updateCorporateAccessState({
    hasAccess: null,
    isAdmin: false,
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

// checkCorporateAccess関数内の修正部分
// return corporateAccessState; の直前に以下を追加

if (typeof document !== 'undefined') {
  // クッキーを更新（userRoleがundefinedの場合はnullを使用）
  setCorporateAccessCookies(
    corporateAccessState.hasAccess === true,
    corporateAccessState.userRole !== undefined ? corporateAccessState.userRole : null,
  );
}