// lib/corporateAccess/index.ts
import { logger } from "@/lib/utils/logger";
// グローバル型定義
declare global {
  interface Window {
    _corporateAccessState?: typeof corporateAccessState;
  }
}
// タイプと基本状態
export * from './state';
// 管理者権限 (クライアントサイド専用)
export {
  initializeAdminStatus,
  loadAdminStatusFromStorage,
  persistAdminStatus,
  setAdminStatus,
  validateAdminStatusFromApi,
  isUserSuperAdmin,
} from './adminAccess';
// 永久利用権
export {
  PermanentPlanType,
  PLAN_TYPE_DISPLAY_NAMES,
  checkPermanentAccess,
  updatePermanentUserStatus,
  fetchPermanentPlanType,
  isPermanentActionAllowed,
} from './permanentAccess';
// ストレージ操作
export {
  StorageType,
  StorageKey,
  getFromStorage,
  saveToStorage,
  removeFromStorage,
  getPermanentUserFromStorage,
  setCookie,
  setCorporateAccessCookies,
} from './storage';
// 仮想テナント
export type { VirtualTenantData } from './virtualTenant';
export {
  generateVirtualTenantData,
  getVirtualTenantData,
  updateVirtualTenantData,
  getVirtualDepartments,
  getVirtualSnsLinks,
  getVirtualUsers,
  getVirtualSettings,
} from './virtualTenant';
// API通信 - クライアントサイド専用関数のみエクスポート
export type { ApiResult } from './api';
export { checkCorporateAccess, isUserCorporateAdmin } from './api';
/**
 * クライアントサイドの状態を初期化するメイン関数
 * アプリケーション起動時に一度だけ呼び出す
 */
import { initializeAdminStatus } from './adminAccess';
import { corporateAccessState, isClient, updateState } from './state';
import { checkPermanentAccess, fetchPermanentPlanType } from './permanentAccess';
// 遅延初期化処理 - クライアントサイドのみ
let initializePromise: Promise<void> | null = null;
// 安全なグローバル状態アクセス（修正版）
const getGlobalState = (): unknown => {
  return (window as unknown as Record<string, unknown>)._corporateAccessState;
};
const setGlobalState = (state: unknown): void => {
  (window as unknown as Record<string, unknown>)._corporateAccessState = state;
};
export function initializeClientState(): Promise<void> {
  // すでに初期化中か初期化済みの場合は既存のPromiseを返す
  if (initializePromise) return initializePromise;
  // サーバーサイドでは空のPromiseを返す
  if (!isClient()) {
    return Promise.resolve();
  }
  // 初期化処理を実行
  initializePromise = new Promise<void>((resolve) => {
    try {
      // 既存の状態があれば復元
      const existingState = getGlobalState();
      if (existingState) {
        Object.assign(corporateAccessState, existingState);
        resolve();
        return;
      }
      // 新規初期化
      setGlobalState(corporateAccessState);
      // Promise全体を作成して順次実行
      Promise.all([
        // 管理者状態を初期化
        initializeAdminStatus(),
        // 永久利用権状態をチェック
        Promise.resolve().then(async () => {
          const isPermanent = checkPermanentAccess();
          if (isPermanent) {
            // プラン種別を取得して適切なアクセス権を設定
            await fetchPermanentPlanType();
          }
          return isPermanent;
        }),
      ])
        .then(() => {
          resolve();
        })
        .catch((error) => {
          logger.error('初期化エラー:', error);
          resolve(); // エラーでも初期化は完了とする
        });
    } catch (error) {
      // エラーが発生しても初期化は完了させる
      logger.error('クライアント初期化エラー:', error);
      resolve();
    }
  });
  return initializePromise;
}
// クライアントサイドでのみ自動初期化
if (isClient()) {
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(() => {
      initializeClientState().catch(() => {
        // 初期化エラーは無視（バックグラウンド処理のため）
      });
    });
  } else {
    setTimeout(() => {
      initializeClientState().catch(() => {
        // 初期化エラーは無視（バックグラウンド処理のため）
      });
    }, 0);
  }
}
// レガシーコードとの互換性維持のため、API通信のみ提供
import { ApiResult, checkCorporateAccess } from './api';
export const corporateAccessLegacy = {
  checkCorporateAccess: async (force = false): Promise<ApiResult> => {
    return checkCorporateAccess({ force });
  },
  resetCorporateAccessState: (): void => {
    updateState({
      hasAccess: null,
      isAdmin: false,
      tenantId: null,
      userRole: null,
      lastChecked: 0,
      error: null,
    });
  },
};