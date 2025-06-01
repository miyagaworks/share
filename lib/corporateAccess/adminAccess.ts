// lib/corporateAccess/adminAccess.ts
import { logger } from "@/lib/utils/logger";
import { corporateAccessState, isClient, logDebug, updateState } from './state';
// 管理者メールアドレスのリスト（クライアントサイド用）
const ADMIN_EMAILS = ['admin@sns-share.com'];
/**
 * クライアントサイドで管理者権限の状態を初期化する
 *
 * @returns 初期化が完了したPromise
 */
export async function initializeAdminStatus(): Promise<void> {
  if (!isClient()) return;
  try {
    // ローカルストレージまたはセッションストレージから管理者状態を読み込む
    const savedStatus = loadAdminStatusFromStorage();
    // 状態を更新
    updateState(
      {
        isSuperAdmin: savedStatus,
      },
      {
        dispatchEvent: false, // 初期化中なのでイベントは発生させない
      },
    );
    logDebug('管理者状態を初期化', { isSuperAdmin: savedStatus });
    // ストレージからユーザーメールを取得
    let userEmail = '';
    if (typeof sessionStorage !== 'undefined') {
      try {
        const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
        userEmail = userData.email || '';
        // 特別に管理者メールをチェック
        if (ADMIN_EMAILS.includes(userEmail.toLowerCase())) {
          // 管理者メールの場合は強制的に管理者権限を付与
          updateState({ isSuperAdmin: true });
          persistAdminStatus();
        }
      } catch {
        // エラー処理
      }
    }
    // セッションストレージの確認と必要に応じてAPI検証を実行
    if (
      (savedStatus && userEmail !== 'admin@sns-share.com') ||
      (!savedStatus && userEmail === 'admin@sns-share.com')
    ) {
      validateAdminStatusFromApi().catch(() => {
        // API検証エラーは無視（バックグラウンド処理のため）
      });
    }
  } catch (error) {
    logDebug('管理者状態初期化エラー', error);
  }
}
/**
 * ローカルストレージから管理者状態を読み込む
 *
 * @returns 管理者の場合true、それ以外はfalse
 */
export function loadAdminStatusFromStorage(): boolean {
  if (!isClient()) return false;
  try {
    // 永久利用権ユーザーかどうかをチェック（セッションストレージから）
    if (typeof sessionStorage !== 'undefined') {
      const userDataStr = sessionStorage.getItem('userData');
      if (userDataStr) {
        try {
          const userData = JSON.parse(userDataStr);
          if (userData?.subscriptionStatus === 'permanent') {
            // 永久利用権ユーザーは管理者権限を持たない
            logDebug('永久利用権ユーザーのため管理者権限なし', { userData });
            return false;
          }
        } catch (parseError) {
          logDebug('JSONパースエラー', { error: parseError });
        }
      }
    }
    // ローカルストレージから管理者状態を読み込む
    const savedStatus = localStorage.getItem('sns_share_admin_status');
    const isAdmin = savedStatus === 'true';
    logDebug('管理者状態をローカルストレージから読み込み', { isAdmin });
    return isAdmin;
  } catch (storageError) {
    logDebug('ローカルストレージ読み込みエラー', { error: storageError });
    return false;
  }
}
/**
 * 管理者状態をローカルストレージに保存
 */
export function persistAdminStatus(): void {
  if (!isClient()) return;
  const adminStatus = corporateAccessState.isSuperAdmin;
  try {
    // ローカルストレージに保存
    localStorage.setItem('sns_share_admin_status', adminStatus ? 'true' : 'false');
    logDebug('管理者状態をローカルストレージに保存', { adminStatus });
  } catch (e) {
    logDebug('ローカルストレージ保存エラー', { error: e });
  }
}
/**
 * 管理者状態を更新する
 *
 * @param isAdmin 管理者かどうか
 * @param persist ストレージに保存するかどうか
 */
export function setAdminStatus(isAdmin: boolean, persist = true): void {
  // 永久利用権ユーザーは管理者になれない（クライアントサイドでの検証）
  if (isClient() && typeof sessionStorage !== 'undefined') {
    try {
      const userDataStr = sessionStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        if (userData?.subscriptionStatus === 'permanent') {
          logDebug('永久利用権ユーザーは管理者になれません', { attemptedStatus: isAdmin });
          // 強制的にfalseを設定
          updateState({ isSuperAdmin: false });
          // 保存が指定されている場合はストレージにも保存
          if (persist) {
            persistAdminStatus();
          }
          return;
        }
      }
    } catch (e) {
      logDebug('ユーザーデータ検証エラー', e);
    }
  }
  // 通常のケース: 状態を更新
  updateState({ isSuperAdmin: isAdmin });
  // 保存が指定されている場合はストレージにも保存
  if (persist) {
    persistAdminStatus();
  }
}
/**
 * APIを呼び出して管理者権限を検証する
 *
 * @returns 管理者の場合true、それ以外はfalse
 */
export async function validateAdminStatusFromApi(): Promise<boolean> {
  if (!isClient()) return false;
  try {
    const response = await fetch('/api/admin/access', {
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
      credentials: 'include',
    });
    if (response.ok) {
      const data = await response.json();
      const isAdmin = !!data.isSuperAdmin;
      // 状態を更新
      setAdminStatus(isAdmin);
      return isAdmin;
    }
    return false;
  } catch (error) {
    logDebug('管理者権限API検証エラー', error);
    return false;
  }
}
/**
 * ユーザーがスーパー管理者かどうかをチェックする
 * この関数はクライアントサイドでの簡易チェックで、厳密な認証には使用しない
 *
 * @returns 管理者の場合true、それ以外はfalse
 */
export function isUserSuperAdmin(): boolean {
  // 永久利用権ユーザーは絶対に管理者になれない
  if (corporateAccessState.isPermanentUser) {
    return false;
  }
  // 状態から管理者かどうかを返す
  return corporateAccessState.isSuperAdmin === true;
}