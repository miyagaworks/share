// lib/corporateAccess/virtualTenant.ts
import { isClient, logDebug } from './state';
import { getFromStorage, saveToStorage, StorageKey, StorageType } from './storage';

interface UserData {
  id: string;
  name?: string | null;
  subscriptionStatus?: string;
}

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
  plan?: string;
}

// グローバルな仮想テナントデータを保持する変数
let virtualTenantDataCache: VirtualTenantData | null = null;

/**
 * 永久利用権ユーザー用の仮想テナントデータを生成
 *
 * @param userId ユーザーID
 * @param userName ユーザー名（オプション）
 * @returns 仮想テナントデータ
 */
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
    plan: 'business_plus',
  };
}

/**
 * 仮想テナントデータを取得
 *
 * @returns 仮想テナントデータ
 */
export function getVirtualTenantData(): VirtualTenantData | null {
  // すでにメモリ上にデータがある場合はそれを返す
  if (virtualTenantDataCache) {
    return virtualTenantDataCache;
  }

  // サーバーサイドの場合は早期リターン
  if (!isClient()) {
    return null;
  }

  // LocalStorageから復元を試みる
  try {
    const savedData = getFromStorage<VirtualTenantData>(StorageKey.VIRTUAL_TENANT);
    if (savedData) {
      virtualTenantDataCache = savedData;
      return virtualTenantDataCache;
    }
  } catch (e) {
    logDebug('仮想テナントデータの復元エラー', e);
  }

  // データがない場合は新規作成を試みる
  try {
    const permanentUser = getFromStorage<UserData>(StorageKey.USER_DATA, StorageType.SESSION);

    if (permanentUser && permanentUser.subscriptionStatus === 'permanent') {
      virtualTenantDataCache = generateVirtualTenantData(permanentUser.id, permanentUser.name);

      // 新しく生成したデータをLocalStorageに保存
      saveToStorage(StorageKey.VIRTUAL_TENANT, virtualTenantDataCache);

      return virtualTenantDataCache;
    }
  } catch (e) {
    logDebug('仮想テナント生成エラー', e);
  }

  return null;
}

/**
 * 仮想テナントデータを更新
 *
 * @param updater 更新関数
 * @returns 更新後のデータ
 */
export function updateVirtualTenantData(
  updater: (data: VirtualTenantData) => VirtualTenantData,
): VirtualTenantData | null {
  const currentData = getVirtualTenantData();
  if (!currentData) return null;

  // 更新関数を適用して新しいデータを生成
  const updatedData = updater(currentData);

  // グローバル変数を更新
  virtualTenantDataCache = updatedData;

  // LocalStorageに保存（ページリロード間で保持するため）
  if (isClient()) {
    saveToStorage(StorageKey.VIRTUAL_TENANT, updatedData);
  }

  return updatedData;
}

/**
 * 仮想テナントデータから部署情報を取得
 *
 * @returns 部署リスト
 */
export function getVirtualDepartments(): Array<{
  id: string;
  name: string;
  description: string | null;
}> {
  const data = getVirtualTenantData();
  return data?.departments || [];
}

/**
 * 仮想テナントデータからSNSリンク情報を取得
 *
 * @returns SNSリンクリスト
 */
export function getVirtualSnsLinks(): Array<{
  id: string;
  platform: string;
  url: string;
  username: string | null;
  displayOrder: number;
  isRequired: boolean;
}> {
  const data = getVirtualTenantData();
  return data?.snsLinks || [];
}

/**
 * 仮想テナントデータからユーザー情報を取得
 *
 * @returns ユーザーリスト
 */
export function getVirtualUsers(): Array<{ id: string; role: string; name?: string | null }> {
  const data = getVirtualTenantData();
  return data?.users || [];
}

/**
 * 仮想テナントデータから設定情報を取得
 *
 * @returns 設定情報
 */
export function getVirtualSettings(): {
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
} | null {
  const data = getVirtualTenantData();
  return data?.settings || null;
}