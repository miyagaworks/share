// lib/corporateAccess/state.ts
import { logger } from '@/lib/utils/logger';

// 法人アクセス状態の型定義
export interface CorporateAccessState {
  // 管理者権限 (メールアドレスによる)
  isSuperAdmin: boolean;

  // 法人アクセス関連
  hasAccess: boolean | null;
  isAdmin: boolean;
  tenantId: string | null;
  userRole: string | null;

  // 永久利用権関連
  isPermanentUser: boolean;
  permanentPlanType: string | null;

  // 共通
  lastChecked: number;
  error: string | null;
}

// グローバル変数の型拡張
if (typeof window !== 'undefined') {
  // ランタイム時のみ型を拡張
}

/**
 * グローバル状態オブジェクト
 * アプリケーション全体で共有される法人アクセス状態を保持
 */
export const corporateAccessState: CorporateAccessState = {
  // 管理者権限
  isSuperAdmin: false,

  // 法人アクセス関連
  hasAccess: null,
  isAdmin: false,
  tenantId: null,
  userRole: null,

  // 永久利用権関連
  isPermanentUser: false,
  permanentPlanType: null,

  // 共通
  lastChecked: 0,
  error: null,
};

// デバッグ用にグローバル変数名を明示
export const STATE_VAR_NAME = '_corporateAccessState';

/**
 * サーバー/クライアント環境を判定する関数
 */
export function isClient(): boolean {
  return typeof window !== 'undefined';
}

/**
 * デバッグログを記録する関数
 */
export function logDebug(action: string, data: unknown): void {
  // 統合ロガーを使用
  logger.corporate(action, data);
}

/**
 * 状態を更新する関数
 * @param newState 新しい状態（部分的）
 * @param options 更新オプション
 */
export function updateState(
  newState: Partial<CorporateAccessState>,
  options: { dispatchEvent?: boolean } = { dispatchEvent: true },
): void {
  const prevState = { ...corporateAccessState };
  logDebug('状態更新前', prevState);

  // 状態を更新
  Object.assign(corporateAccessState, newState);

  // windowオブジェクトも更新
  if (isClient()) {
    // 適切な型変換
    const win = window as unknown as { [key: string]: unknown };
    if (win[STATE_VAR_NAME]) {
      Object.assign(win[STATE_VAR_NAME], newState);
    } else {
      win[STATE_VAR_NAME] = { ...corporateAccessState };
    }
  }

  // イベントディスパッチ
  if (options.dispatchEvent !== false && isClient()) {
    try {
      const event = new CustomEvent('corporateAccessChanged', {
        detail: { ...corporateAccessState },
      });
      window.dispatchEvent(event);
    } catch (error) {
      logDebug('イベントディスパッチエラー', error);
    }
  }
}

/**
 * 状態をリセットする関数
 * @param options リセットオプション
 */
export function resetState(
  options: { preserveAdmin?: boolean; preservePermanent?: boolean } = {},
): void {
  logDebug('状態リセット前', { ...corporateAccessState });

  // オプションに基づいて保持する値を抽出
  const preservedValues: Partial<CorporateAccessState> = {};

  if (options.preserveAdmin) {
    preservedValues.isSuperAdmin = corporateAccessState.isSuperAdmin;
  }

  if (options.preservePermanent) {
    preservedValues.isPermanentUser = corporateAccessState.isPermanentUser;
    preservedValues.permanentPlanType = corporateAccessState.permanentPlanType;
  }

  // 初期状態にリセット（保持する値を除く）
  updateState({
    isSuperAdmin: preservedValues.isSuperAdmin || false,
    hasAccess: null,
    isAdmin: false,
    tenantId: null,
    userRole: null,
    isPermanentUser: preservedValues.isPermanentUser || false,
    permanentPlanType: preservedValues.permanentPlanType || null,
    lastChecked: 0,
    error: null,
  });
}