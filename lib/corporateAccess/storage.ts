// lib/corporateAccess/storage.ts
import { isClient, logDebug } from './state';

/**
 * ブラウザストレージへの読み書きを抽象化するユーティリティ
 */

interface UserData {
  id: string;
  name?: string | null;
  subscriptionStatus?: string;
}

export enum StorageType {
  LOCAL = 'localStorage',
  SESSION = 'sessionStorage',
}

/**
 * ストレージキーの列挙型
 */
export enum StorageKey {
  ADMIN_STATUS = 'sns_share_admin_status',
  USER_DATA = 'userData',
  VIRTUAL_TENANT = 'virtualTenantData',
  CORPORATE_ACCESS = 'corporateAccess',
  CORPORATE_ROLE = 'corporateRole',
}

/**
 * ストレージからデータを読み込む
 *
 * @param key ストレージキー
 * @param type ストレージタイプ（デフォルトはローカルストレージ）
 * @returns 保存されている値、ない場合はnull
 */
export function getFromStorage<T>(
  key: StorageKey,
  type: StorageType = StorageType.LOCAL,
): T | null {
  if (!isClient()) return null;

  try {
    const storage = window[type];
    if (!storage) return null;

    const value = storage.getItem(key);
    if (!value) return null;

    // JSON形式の場合はパースを試みる
    if (value.startsWith('{') || value.startsWith('[')) {
      try {
        return JSON.parse(value) as T;
      } catch (parseError) {
        logDebug('JSONパースエラー', { key, error: parseError });
        return value as unknown as T;
      }
    }

    return value as unknown as T;
  } catch (error) {
    logDebug('ストレージ読み込みエラー', { key, type, error });
    return null;
  }
}

/**
 * ストレージにデータを保存する
 *
 * @param key ストレージキー
 * @param value 保存する値
 * @param type ストレージタイプ（デフォルトはローカルストレージ）
 * @returns 保存に成功した場合はtrue、失敗した場合はfalse
 */
export function saveToStorage<T>(
  key: StorageKey,
  value: T,
  type: StorageType = StorageType.LOCAL,
): boolean {
  if (!isClient()) return false;

  try {
    const storage = window[type];
    if (!storage) return false;

    // オブジェクトや配列の場合はJSON文字列に変換
    const valueToStore =
      typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value);

    storage.setItem(key, valueToStore);
    return true;
  } catch (error) {
    logDebug('ストレージ保存エラー', { key, type, error });
    return false;
  }
}

/**
 * ストレージからデータを削除する
 *
 * @param key ストレージキー
 * @param type ストレージタイプ（デフォルトはローカルストレージ）
 * @returns 削除に成功した場合はtrue、失敗した場合はfalse
 */
export function removeFromStorage(key: StorageKey, type: StorageType = StorageType.LOCAL): boolean {
  if (!isClient()) return false;

  try {
    const storage = window[type];
    if (!storage) return false;

    storage.removeItem(key);
    return true;
  } catch (error) {
    logDebug('ストレージ削除エラー', { key, type, error });
    return false;
  }
}

/**
 * ストレージから永久利用権ユーザー情報を取得する
 *
 * @returns ユーザー情報、ない場合はnull
 */
export function getPermanentUserFromStorage(): {
  id: string;
  name?: string | null;
  subscriptionStatus: string;
} | null {
  const userData = getFromStorage<UserData>(StorageKey.USER_DATA, StorageType.SESSION);

  if (!userData || userData.subscriptionStatus !== 'permanent') {
    return null;
  }

  return {
    id: userData.id,
    name: userData.name,
    subscriptionStatus: userData.subscriptionStatus,
  };
}

/**
 * Cookieを設定する
 *
 * @param name Cookie名
 * @param value 値
 * @param options オプション
 */
export function setCookie(
  name: string,
  value: string,
  options: {
    days?: number;
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
  } = {},
): void {
  if (!isClient()) return;

  const { days = 1, path = '/', domain, secure, sameSite = 'strict' } = options;

  // Cookie有効期限を設定
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

  // Cookie文字列を構築
  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  cookieString += `; expires=${expires.toUTCString()}`;
  cookieString += `; path=${path}`;

  if (domain) cookieString += `; domain=${domain}`;
  if (secure || sameSite === 'none') cookieString += '; secure';
  if (sameSite) cookieString += `; samesite=${sameSite}`;

  // Cookieを設定
  document.cookie = cookieString;
}

/**
 * 法人アクセスCookieを設定する
 *
 * @param hasAccess アクセス権があるかどうか
 * @param role ユーザーロール
 */
export function setCorporateAccessCookies(hasAccess: boolean, role: string | null): void {
  if (!isClient()) return;

  // 明示的に数値に変換してからbooleanに戻す（一貫性確保のため）
  const accessValue = hasAccess ? '1' : '0';
  const roleValue = role || '';

  // Cookie設定
  setCookie('corporateAccess', accessValue);
  setCookie('corporateRole', roleValue);

  // コンソールでも確認できるようログ出力
  console.log('[CookieSet] corporateAccess =', accessValue, 'corporateRole =', roleValue);
}