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
  // キャッシュ時間を調整（モバイル環境考慮）
  const CACHE_DURATION = 30 * 1000; // 30秒

  const now = Date.now();

  // モバイル環境検出
  const isMobile =
    typeof navigator !== 'undefined' &&
    (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
      (typeof window !== 'undefined' && window.innerWidth < 768));

  // キャッシュを使用するかチェック
  if (
    !force &&
    corporateAccessState.lastChecked > 0 &&
    corporateAccessState.hasAccess !== null &&
    corporateAccessState.tenantId &&
    now - corporateAccessState.lastChecked < CACHE_DURATION
  ) {
    logDebug('キャッシュ使用', {
      age: now - corporateAccessState.lastChecked,
      state: { ...corporateAccessState },
    });
    return corporateAccessState;
  }

  try {
    logDebug('APIリクエスト開始', { timestamp: now, isMobile });

    // リクエスト発行時刻とランダム値を含めてキャッシュを回避
    const cacheBuster = `${now}-${Math.random().toString(36).substring(2, 10)}`;

    // リクエスト
    const response = await fetch(
      `/api/corporate/access?t=${cacheBuster}&mobile=${isMobile ? 1 : 0}`,
      {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
        credentials: 'include', // 認証情報を含める
      },
    );

    // レスポンス詳細ログ
    logDebug('APIレスポンス詳細', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
      headers: {
        contentType: response.headers.get('content-type'),
        cacheControl: response.headers.get('cache-control'),
      },
    });

    // レスポンス処理
    try {
      const data = await response.json();

      logDebug('APIレスポンスボディ', data);

      if (response.status === 401) {
        // 認証エラー - 未ログイン
        updateCorporateAccessState({
          hasAccess: false,
          isAdmin: false,
          tenantId: null,
          lastChecked: now,
          error: '認証されていません。ログインしてください。',
        });

        // 認証ページにリダイレクト（オプション）
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth/')) {
          logDebug('未認証を検出 - ログインページへリダイレクト', {
            path: window.location.pathname,
          });
          window.location.href = '/auth/signin';
        }
      } else if (response.status === 403) {
        // アクセス拒否 - 権限なし
        updateCorporateAccessState({
          hasAccess: false,
          isAdmin: false,
          tenantId: null,
          lastChecked: now,
          error: data.error || '法人プランにアップグレードしてください。',
        });
      } else if (response.ok) {
        // 成功 - アクセス権あり
        const possibleTenantId = data.tenantId || (data.tenant && data.tenant.id) || null;

        updateCorporateAccessState({
          hasAccess: data.hasAccess === true,
          isAdmin: data.isAdmin || false,
          tenantId: possibleTenantId || 'fallback-tenant-id',
          userRole: data.userRole || data.role || null,
          lastChecked: now,
          error: null,
        });
      } else {
        // その他のエラー
        updateCorporateAccessState({
          hasAccess: false,
          lastChecked: now,
          error: `APIエラー: ${response.status} ${response.statusText}`,
        });
      }
    } catch (parseError) {
      logDebug('APIレスポンスのパースエラー', parseError);

      // JSONパースエラー
      updateCorporateAccessState({
        hasAccess: false,
        lastChecked: now,
        error: 'APIレスポンスの解析に失敗しました',
      });
    }

    // クッキーの更新
    if (typeof document !== 'undefined') {
      setCorporateAccessCookies(
        corporateAccessState.hasAccess === true,
        corporateAccessState.userRole || null,
      );
    }

    return corporateAccessState;
  } catch (error) {
    logDebug('APIリクエスト例外', error);

    // エラー発生時の状態更新
    updateCorporateAccessState({
      hasAccess: false,
      error: error instanceof Error ? error.message : 'APIリクエスト中にエラーが発生しました',
      lastChecked: now,
    });

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