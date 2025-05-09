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
  // モバイル環境検出を強化
  const isMobile =
    typeof navigator !== 'undefined' &&
    (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
      (typeof window !== 'undefined' && window.innerWidth < 768)); // 画面サイズでも判定

  // すぐにログ出力
  if (isMobile) {
    logDebug('モバイル環境検出', {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      innerWidth: typeof window !== 'undefined' ? window.innerWidth : 'unknown',
    });

    // モバイルなら常に強制更新
    force = true;
  }

  // キャッシュの使用条件を改善
  if (
    !force &&
    corporateAccessState.lastChecked > 0 && // 少なくとも1回はチェック済み
    corporateAccessState.hasAccess !== null && // 明示的な値が設定されている
    corporateAccessState.tenantId && // テナントIDが設定されていて空文字列やnullではない
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
    // キャッシュバスティングのためのタイムスタンプとモバイルフラグを追加
    const response = await fetch(`/api/corporate/access?t=${now}&mobile=${isMobile ? 1 : 0}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
      // 明示的にcredentialsを指定
      credentials: 'include',
    });

    // APIレスポンスのログ出力を詳細化
    logDebug('APIレスポンス受信', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
    });

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

      // レスポンスからテナントID候補を取得する処理を強化
      const possibleTenantId = data.tenantId || (data.tenant && data.tenant.id) || null;

      logDebug('テナントID検証', {
        responseData: data,
        possibleTenantId,
        tenantId: data.tenantId,
        tenantObjId: data.tenant?.id,
        isNull: possibleTenantId === null,
        isDefined: typeof possibleTenantId !== 'undefined',
      });

      // テナントIDが取得できない場合でも、アクセス権があればモバイル環境用の対応を追加
      if (data.hasAccess === true && !possibleTenantId && isMobile) {
        // モバイル環境専用の対応：常にフォールバック
        logDebug('モバイル環境でテナントID取得不可、強制フォールバック', { responseData: data });
        updateCorporateAccessState({
          hasAccess: true,
          isAdmin: data.isAdmin || false,
          tenantId: 'mobile-fallback-tenant-id', // モバイル用フォールバック
          userRole: data.userRole || data.role || 'member',
          lastChecked: now,
          error: null,
        });

        // 成功として返す
        return corporateAccessState;
      }

      // テナントIDが取得できない場合でも、アクセス権があれば代替IDを設定
      if (data.hasAccess === true && !possibleTenantId) {
        logDebug('テナントID取得できずフォールバック使用', { originalData: data });

        // 開発環境・本番環境どちらでも使用できるフォールバック処理
        updateCorporateAccessState({
          hasAccess: true,
          isAdmin: data.isAdmin || false,
          tenantId: 'fallback-tenant-id', // フォールバックID
          userRole: data.userRole || data.role || null,
          lastChecked: now,
          error: null,
        });
      } else {
        // 通常の状態更新
        updateCorporateAccessState({
          hasAccess: data.hasAccess === true,
          isAdmin: data.isAdmin || false,
          tenantId: possibleTenantId,
          userRole: data.userRole || data.role || null,
          lastChecked: now,
          error: null,
        });
      }
    } else {
      // その他のエラー（例: 500内部サーバーエラーなど）
      logDebug('予期しないAPIエラー', {
        status: response.status,
        statusText: response.statusText,
      });

      // エラー時はアクセス権を明示的に拒否する
      updateCorporateAccessState({
        hasAccess: false,
        lastChecked: now,
        error: `APIエラー: ${response.status} ${response.statusText}`,
      });
    }

    return corporateAccessState;
  } catch (error) {
    // ネットワークエラーなどの例外処理
    logDebug('APIリクエスト例外', error);

    // エラーが発生した場合もアクセス権を明示的に拒否する
    updateCorporateAccessState({
      hasAccess: false,
      error: error instanceof Error ? error.message : 'APIリクエスト中にエラーが発生しました',
      lastChecked: now,
    });

    // エラー情報をコンソールに出力
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