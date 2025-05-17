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
  isPermanentUser?: boolean; // 永久利用権ユーザーフラグを追加
}

// サーバー/クライアント環境を判定する関数
function isClient(): boolean {
  return typeof window !== 'undefined';
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
  isPermanentUser: false, // 永久利用権フラグを初期化
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
    // まず永久利用権ユーザーかどうかを確認
    if (typeof sessionStorage !== 'undefined') {
      const userDataStr = sessionStorage.getItem('userData');
      if (userDataStr) {
        try {
          const userData = JSON.parse(userDataStr);
          if (userData?.subscriptionStatus === 'permanent') {
            // 永久利用権ユーザーは常に管理者権限なし
            logDebug('永久利用権ユーザーのため管理者権限なし', { userData });
            return false;
          }
        } catch (parseError) {
          // JSONパースエラーをログに記録
          logDebug('JSONパースエラー', { error: parseError });
        }
      }
    }

    // 通常の処理（永久利用権ユーザーでない場合）
    const savedStatus = localStorage.getItem('sns_share_admin_status');
    const isAdmin = savedStatus === 'true';
    logDebug('管理者状態をローカルストレージから読み込み', { isAdmin });
    return isAdmin;
  } catch (storageError) {
    // エラーをログに記録
    logDebug('ローカルストレージ読み込みエラー', { error: storageError });
    return false;
  }
};

// 永久利用権ユーザーかどうかを判定する関数（サーバサイドに対応）
export function isPermanentUser(): boolean {
  // サーバーサイドではfalseを返す
  if (typeof window === 'undefined') {
    return false;
  }

  // 状態から判定
  if (corporateAccessState.isPermanentUser === true) {
    return true;
  }

  // sessionStorageから判定
  try {
    if (typeof sessionStorage !== 'undefined') {
      const userDataStr = sessionStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        const isPermanent = userData.subscriptionStatus === 'permanent';

        // 状態を更新
        if (isPermanent) {
          corporateAccessState.isPermanentUser = true;
          corporateAccessState.isSuperAdmin = false; // 強制的にfalseに設定
          corporateAccessState.hasAccess = true; // 法人アクセス権を付与

          // 仮想テナントIDを設定
          if (!corporateAccessState.tenantId) {
            corporateAccessState.tenantId = `virtual-tenant-${userData.id}`;
            corporateAccessState.userRole = 'admin';

            // 仮想テナントデータを生成
            const virtualData = generateVirtualTenantData(userData.id, userData.name);
            if (isClient() && typeof localStorage !== 'undefined') {
              localStorage.setItem('virtualTenantData', JSON.stringify(virtualData));
            }
          }
        }

        return isPermanent;
      }
    }
  } catch (error) {
    logger.corporate('永久利用権チェックエラー', error);
  }

  return false;
}

// 遅延初期化処理 - クライアントサイドのみ
let initializePromise: Promise<void> | null = null;

export function initializeClientState(): Promise<void> {
  // すでに初期化中か初期化済みの場合は既存のPromiseを返す
  if (initializePromise) return initializePromise;

  // サーバーサイドでは空のPromiseを返す
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  // 初期化処理を実行
  initializePromise = new Promise<void>((resolve) => {
    try {
      // 既存の状態があれば復元
      if (window[STATE_VAR_NAME]) {
        Object.assign(corporateAccessState, window[STATE_VAR_NAME]);
        logDebug('状態復元', { ...corporateAccessState });
        resolve();
        return;
      }

      // 新規初期化
      window[STATE_VAR_NAME] = corporateAccessState;
      logDebug('初期化', { ...corporateAccessState });

      // 初期化時にローカルストレージから管理者状態を読み込む
      corporateAccessState.isSuperAdmin = loadAdminStatus();

      // 永久利用権ユーザーの確認 - 非同期操作になる可能性がある
      // ここでは同期的に判定するがPromiseとして処理
      const permanent = isPermanentUser();

      if (permanent) {
        corporateAccessState.isSuperAdmin = false;
        corporateAccessState.isPermanentUser = true;
        logDebug('永久利用権ユーザーのisSuperAdminをfalseに初期設定', { userId: 'unknown' });
      }

      resolve();
    } catch (error) {
      // エラーが発生しても初期化は完了させる
      logDebug('クライアント初期化エラー', error);
      resolve();
    }
  });

  return initializePromise;
}

// クライアントサイドでのみ自動初期化
if (typeof window !== 'undefined') {
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(() => {
      initializeClientState().catch(console.error);
    });
  } else {
    setTimeout(() => {
      initializeClientState().catch(console.error);
    }, 0);
  }
}

// 状態を更新する関数 - 管理者状態の上書き防止機能を追加
export function updateCorporateAccessState(newState: Partial<CorporateAccessState>): void {
  const prevState = { ...corporateAccessState };
  logger.corporate('状態更新前', prevState);

  // 永久利用権ユーザーの判定 - より確実に
  const permanent = isPermanentUser() || newState.isPermanentUser === true;

  // 永久利用権ユーザーの場合
  if (permanent) {
    // 管理者権限を絶対に付与しない
    newState.isSuperAdmin = false;
    newState.isPermanentUser = true;

    // グローバル変数も直接更新（確実に反映させるため）
    corporateAccessState.isSuperAdmin = false;
    corporateAccessState.isPermanentUser = true;

    logger.corporate('永久利用権ユーザー: 管理者権限を強制的に無効化', { permanent });
  }

  // 状態を更新
  Object.assign(corporateAccessState, newState);

  // 管理者状態がある場合はストレージに保存
  if (newState.isSuperAdmin !== undefined) {
    persistAdminStatus();
  }

  // 永久利用権ユーザーの場合は、管理者状態をfalseで強制保存
  if (permanent && typeof window !== 'undefined') {
    try {
      localStorage.setItem('sns_share_admin_status', 'false');
    } catch (error) {
      logger.corporate('ローカルストレージ保存エラー', { error });
    }
  }

  // windowオブジェクトも更新
  if (typeof window !== 'undefined' && window[STATE_VAR_NAME]) {
    Object.assign(window[STATE_VAR_NAME], newState);
  }

  logger.corporate('状態更新後', { ...corporateAccessState });

  // イベントをディスパッチ
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('corporateAccessChanged', {
          detail: { ...corporateAccessState },
        }),
      );
    } catch (error) {
      logger.corporate('イベントディスパッチエラー', error);
    }
  }
}

// 関数を外部からも呼び出せるようにエクスポート
export function checkPermanentAccess(): boolean {
  // クライアントサイドでのみ有効
  if (typeof window === 'undefined') {
    return false;
  }

  // 状態に永久利用権フラグが設定されていればそれを使う
  if (corporateAccessState.isPermanentUser !== undefined) {
    return corporateAccessState.isPermanentUser;
  }

  // 設定されていない場合は判定して状態を更新
  const permanent = isPermanentUser();

  // すでに永久利用権ユーザーとして設定済みの場合は何もせず返す
  if (permanent === corporateAccessState.isPermanentUser) {
    return permanent;
  }

  // もし永久利用権ユーザーなら、その状態をcorporateAccessStateに反映
  if (permanent && corporateAccessState.hasAccess !== true) {
    try {
      let userId = 'unknown';
      if (typeof sessionStorage !== 'undefined') {
        const userDataStr = sessionStorage.getItem('userData');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          userId = userData.id || Date.now().toString();
        }
      }

      updateCorporateAccessState({
        hasAccess: true,
        isAdmin: true,
        isSuperAdmin: false, // 明示的にfalseを設定
        isPermanentUser: true,
        tenantId: `virtual-tenant-${userId}`,
        userRole: 'admin',
        error: null,
        lastChecked: Date.now(),
      });
    } catch (e) {
      logDebug('永久利用権設定エラー', e);
    }
  }

  return permanent;
}

// APIチェック関数 - 管理者状態を維持するように修正
export const checkCorporateAccess = async (force = false) => {
  const now = Date.now();

  // クライアントサイド初期化が未完了の場合は待機
  if (typeof window !== 'undefined' && initializePromise) {
    await initializePromise;
  }

  // キャッシュ利用判定で、永久利用権も考慮
  const isPermanent = checkPermanentAccess();
  if (isPermanent) {
    // 永久利用権ユーザーの場合
    let userId = 'unknown';
    try {
      if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
        // sessionStorageからユーザーデータを取得
        const userDataStr = sessionStorage.getItem('userData');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          // ユーザーIDを取得
          userId = userData.id || Date.now().toString();
        }
      }
    } catch (e) {
      logDebug('永久利用権ユーザーデータ取得エラー', e);
    }

    // 更新されたステータス
    const updatedState = {
      hasAccess: true,
      isAdmin: true,
      isSuperAdmin: false, // 明示的にfalseに設定
      isPermanentUser: true,
      tenantId: `virtual-tenant-${userId}`,
      userRole: 'admin',
      error: null,
      lastChecked: now,
    };

    updateCorporateAccessState(updatedState);
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
        isPermanentUser: false,
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
      // 永久利用権ユーザーの場合はisSuperAdminを常にfalseに
      const permanent = corporateAccessState.isPermanentUser || false;

      let isSuperAdmin;
      if (permanent) {
        isSuperAdmin = false; // 永久利用権ユーザーは常にfalse
      } else {
        isSuperAdmin = data.isSuperAdmin === true || currentIsSuperAdmin === true;
      }

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
        isSuperAdmin: isSuperAdmin, // 修正: スーパー管理者状態を適切に設定
        isPermanentUser: permanent,
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

// スーパー管理者かどうかを確認する関数 - 永久利用権ユーザーは常にfalseを返す
export function isUserSuperAdmin(): boolean {
  // 永久利用権ユーザーは絶対に管理者になれない
  if (isPermanentUser() || corporateAccessState.isPermanentUser) {
    return false;
  }

  // それ以外は通常の判定
  return corporateAccessState.isSuperAdmin === true;
}

// 状態をリセットする関数
export function resetCorporateAccessState(): void {
  logDebug('状態リセット前', { ...corporateAccessState });

  // 管理者状態の保存
  const currentIsSuperAdmin = corporateAccessState.isSuperAdmin;
  // 永久利用権状態の保存
  const isPermanent = corporateAccessState.isPermanentUser;

  updateCorporateAccessState({
    hasAccess: null,
    isAdmin: false,
    // 修正: 管理者状態を維持
    isSuperAdmin: currentIsSuperAdmin,
    isPermanentUser: isPermanent,
    tenantId: null,
    userRole: null,
    lastChecked: 0,
    error: null,
  });

  logDebug('状態リセット後', { ...corporateAccessState });
}

// クッキーを保存する際のオプション
export function setCorporateAccessCookies(hasAccess: boolean, role: string | null): void {
  if (typeof document === 'undefined') return;

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

// クライアントサイドのみでのクッキー更新処理
if (typeof window !== 'undefined') {
  // 初期化後にクッキーを設定
  initializeClientState()
    .then(() => {
      setCorporateAccessCookies(
        corporateAccessState.hasAccess === true,
        corporateAccessState.userRole !== undefined ? corporateAccessState.userRole : null,
      );
    })
    .catch(console.error);
}

// 仮想テナントデータの型定義
export interface VirtualTenantData {
  id: string;
  name: string;
  users: Array<{
    id: string;
    role: string;
    name?: string | null;
  }>;
  departments: Array<{
    id: string;
    name: string;
    description: string | null;
  }>;
  snsLinks: Array<{
    id: string;
    platform: string;
    url: string;
    username: string | null;
    displayOrder: number;
    isRequired: boolean;
  }>;
  settings: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl: string | null;
  };
  plan?: string; // オプショナルのplanプロパティを追加
}

// 永久利用権ユーザー用の仮想テナントデータを生成
export function generateVirtualTenantData(
  userId: string,
  userName?: string | null,
): VirtualTenantData {
  return {
    id: `virtual-tenant-${userId}`,
    name: '仮想法人名',
    users: [{ id: userId, role: 'admin', name: userName || '仮想ユーザー' }],
    departments: [{ id: 'default-dept', name: '全社', description: 'デフォルト部署' }],
    snsLinks: [
      {
        id: 'vs-1',
        platform: 'line',
        url: 'https://line.me/ti/p/~',
        username: null,
        displayOrder: 1,
        isRequired: true,
      },
      {
        id: 'vs-2',
        platform: 'instagram',
        url: 'https://www.instagram.com/',
        username: null,
        displayOrder: 2,
        isRequired: true,
      },
      {
        id: 'vs-3',
        platform: 'youtube',
        url: 'https://www.youtube.com/c/',
        username: null,
        displayOrder: 3,
        isRequired: false,
      },
    ],
    settings: {
      primaryColor: '#3B82F6',
      secondaryColor: '#60A5FA',
      logoUrl: null,
    },
    // plan フィールドを追加
    plan: 'business_plus', // ここをbusiness_plusに設定
  };
}

// グローバルな仮想テナントデータを保持する変数
let virtualTenantData: VirtualTenantData | null = null;

// 仮想テナントデータの更新と永続化
export function updateVirtualTenantData(
  updater: (data: VirtualTenantData) => VirtualTenantData,
): VirtualTenantData | null {
  const currentData = getVirtualTenantData();
  if (!currentData) return null;

  // 更新関数を適用して新しいデータを生成
  const updatedData = updater(currentData);

  // グローバル変数を更新
  virtualTenantData = updatedData;

  // LocalStorageに保存（ページリロード間で保持するため）
  if (isClient()) {
    try {
      localStorage.setItem('virtualTenantData', JSON.stringify(updatedData));
    } catch (e) {
      console.error('仮想テナントデータの保存エラー:', e);
    }
  }

  return updatedData;
}

// getVirtualTenantData 関数を修正し、LocalStorage からの復元ロジックを追加
export function getVirtualTenantData(): VirtualTenantData | null {
  // すでにメモリ上にデータがある場合はそれを返す
  if (virtualTenantData) {
    return virtualTenantData;
  }

  // サーバーサイドの場合は早期リターン
  if (!isClient()) {
    return null;
  }

  // LocalStorageから復元を試みる
  try {
    const savedData = localStorage.getItem('virtualTenantData');
    if (savedData) {
      virtualTenantData = JSON.parse(savedData);
      return virtualTenantData;
    }
  } catch (e) {
    console.error('仮想テナントデータの復元エラー:', e);
  }

  // データがない場合は新規作成を試みる
  try {
    if (typeof sessionStorage !== 'undefined') {
      const userDataStr = sessionStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        if (userData.subscriptionStatus === 'permanent') {
          virtualTenantData = generateVirtualTenantData(userData.id, userData.name);
          // 新しく生成したデータをLocalStorageに保存
          localStorage.setItem('virtualTenantData', JSON.stringify(virtualTenantData));
          return virtualTenantData;
        }
      }
    }
  } catch (e) {
    console.error('仮想テナント生成エラー:', e);
  }

  return null;
}
