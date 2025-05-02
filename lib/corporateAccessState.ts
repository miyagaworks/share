// lib/corporateAccessState.ts
declare global {
  interface Window {
    _corporateAccessState?: CorporateAccessState;
    _corporateAccessDebug?: {
      logs: Array<{
        timestamp: number;
        action: string;
        data: unknown; // anyではなくunknown型を使用
      }>;
      version: string;
    };
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
  // anyではなくunknown型を使用
  if (typeof window !== 'undefined') {
    // デバッグ構造がなければ初期化
    if (!window._corporateAccessDebug) {
      window._corporateAccessDebug = {
        logs: [],
        version: '1.0.0',
      };
    }

    // ログを追加（最大100件まで）
    window._corporateAccessDebug.logs.unshift({
      timestamp: Date.now(),
      action,
      data: JSON.parse(JSON.stringify(data)), // ディープコピーして保存
    });

    // 最大100件を超えたら古いものを削除
    if (window._corporateAccessDebug.logs.length > 100) {
      window._corporateAccessDebug.logs = window._corporateAccessDebug.logs.slice(0, 100);
    }
  }

  // コンソールにも出力
  console.log(`[corporateAccessState:${action}]`, data);
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
      window.dispatchEvent(
        new CustomEvent('corporateAccessChanged', {
          detail: { ...corporateAccessState }, // オブジェクトをコピーして渡す
        }),
      );
      logDebug('イベントディスパッチ', {
        type: 'corporateAccessChanged',
        detail: { ...corporateAccessState },
      });
    } catch (e) {
      logDebug('イベントディスパッチエラー', e);
    }
  }
}

// APIチェック関数
export const checkCorporateAccess = async (force = false) => {
  // キャッシュ時間を1分に延長
  const CACHE_DURATION = 60 * 1000; // 60秒

  const now = Date.now();
  if (
    !force &&
    corporateAccessState.lastChecked &&
    now - corporateAccessState.lastChecked < CACHE_DURATION
  ) {
    logDebug('キャッシュ使用', {
      age: now - corporateAccessState.lastChecked,
      state: { ...corporateAccessState },
    });
    return corporateAccessState;
  }

  try {
    logDebug('APIリクエスト開始', { timestamp: now });
    // キャッシュバスティングのためのタイムスタンプを追加
    const response = await fetch('/api/corporate/access?t=' + now);
    logDebug('APIレスポンス受信', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
    });

    // 403は個人プランユーザーとして正常に処理
    if (response.status === 403) {
      logDebug('個人プランユーザー検出', { status: 403 });
      // 個人プランユーザーと判定
      updateCorporateAccessState({
        hasAccess: false,
        isAdmin: false,
        tenantId: null,
        lastChecked: now,
        error: null,
      });
    } else if (response.ok) {
      const data = await response.json();
      logDebug('法人プランユーザー検出', data);
      // 法人プランユーザーと判定
      updateCorporateAccessState({
        hasAccess: true,
        isAdmin: data.isAdmin || false,
        tenantId: data.tenantId || null,
        userRole: data.role || null,
        lastChecked: now,
        error: null,
      });
    } else {
      // その他のエラー（例: 500内部サーバーエラーなど）
      logDebug('予期しないAPIエラー', {
        status: response.status,
        statusText: response.statusText,
      });

      // 一時的なエラーとして処理し、既存の状態を保持
      updateCorporateAccessState({
        lastChecked: now,
        error: `APIエラー: ${response.status} ${response.statusText}`,
      });
    }

    return corporateAccessState;
  } catch (error) {
    // ネットワークエラーなどの例外処理
    logDebug('APIリクエスト例外', error);

    // エラーが発生した場合も状態を更新
    updateCorporateAccessState({
      error: error instanceof Error ? error.message : 'APIリクエスト中にエラーが発生しました',
      lastChecked: now,
    });

    // エラー情報をコンソールに出力するが、例外は再スローしない
    console.error('法人アクセス権確認エラー:', error);

    return corporateAccessState;
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

// デバッグログを取得する関数
export function getCorporateAccessDebugLogs(): Array<{
  timestamp: number;
  action: string;
  data: unknown;
}> {
  if (typeof window !== 'undefined' && window._corporateAccessDebug) {
    return window._corporateAccessDebug.logs;
  }
  return [];
}

// デバッグ用の強制アクセス許可機能
export function enableDebugMode(durationMinutes = 30): boolean {
  logDebug('デバッグモード有効化', { durationMinutes });

  updateCorporateAccessState({
    hasAccess: true,
    isAdmin: true,
    tenantId: 'debug-tenant-id',
    userRole: 'admin',
    lastChecked: Date.now(),
    error: null,
  });

  // 指定時間後に自動リセット
  const timeoutMs = durationMinutes * 60 * 1000;
  setTimeout(() => {
    logDebug('デバッグモード有効期限切れ', { durationMinutes });
    resetCorporateAccessState();
  }, timeoutMs);

  return true;
}