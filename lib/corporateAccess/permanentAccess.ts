// lib/corporateAccess/permanentAccess.ts
import { logger } from "@/lib/utils/logger";
import {
  CorporateAccessState,
  corporateAccessState,
  isClient,
  logDebug,
  updateState,
} from './state';
import { setAdminStatus } from './adminAccess';
import { generateVirtualTenantData } from './virtualTenant';
import { VirtualTenantData } from './virtualTenant';
// 永久利用権プランタイプの列挙型
export enum PermanentPlanType {
  PERSONAL = 'personal',
  BUSINESS = 'business',
  BUSINESS_PLUS = 'business_plus',
  ENTERPRISE = 'enterprise',
}
// プランタイプの表示名マッピング
export const PLAN_TYPE_DISPLAY_NAMES: Record<PermanentPlanType, string> = {
  [PermanentPlanType.PERSONAL]: '個人永久プラン',
  [PermanentPlanType.BUSINESS]: 'ビジネス永久プラン (10名まで)',
  [PermanentPlanType.BUSINESS_PLUS]: 'ビジネスプラス永久プラン (30名まで)',
  [PermanentPlanType.ENTERPRISE]: 'エンタープライズ永久プラン (50名まで)',
};
/**
 * ユーザーが永久利用権を持っているかどうかをチェック
 *
 * @returns 永久利用権を持っている場合はtrue、そうでなければfalse
 */
export function checkPermanentAccess(): boolean {
  // サーバーサイドではfalseを返す
  if (!isClient()) {
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
        if (isPermanent) {
          // 永久利用権ユーザーとして設定
          updatePermanentUserStatus(true, userData.id, userData.name);
          // 管理者権限をfalseに設定（念のため）
          setAdminStatus(false, true);
          logDebug('永久利用権ユーザーを検出', {
            userId: userData.id,
            name: userData.name,
            isPermanent: true,
          });
          return true;
        }
      }
    }
  } catch (error) {
    logDebug('永久利用権チェックエラー', error);
  }
  return false;
}
/**
 * 永久利用権ユーザーの状態を更新
 *
 * @param isPermanent 永久利用権を持っているかどうか
 * @param userId ユーザーID（仮想テナント生成用）
 * @param userName ユーザー名（仮想テナント生成用）
 */
export function updatePermanentUserStatus(
  isPermanent: boolean,
  userId?: string,
  userName?: string | null,
): void {
  // 現在のステータス
  const currentStatus = corporateAccessState.isPermanentUser;
  // 変更がなければ何もしない
  if (currentStatus === isPermanent) {
    return;
  }
  logDebug('永久利用権ステータス更新', {
    isPermanent,
    userId,
    previousStatus: currentStatus,
  });
  if (isPermanent) {
    // 永久利用権ユーザーの場合
    // 状態を更新
    updateState({
      isPermanentUser: true,
      // 法人管理者権限はここでは付与しない（プラン種別の判定後に付与）
      isAdmin: false,
      isSuperAdmin: false, // スーパー管理者権限は剥奪
      hasAccess: false, // 法人アクセス権はここでは付与しない（プラン種別の判定後に付与）
      tenantId: null, // テナントIDもプラン種別判定後に設定
      userRole: null,
      error: null,
    });
    // 仮想テナントデータを生成（クライアントサイドのみ）
    if (isClient() && userId) {
      const virtualData = generateVirtualTenantData(userId, userName);
      storeVirtualTenantData(virtualData);
    }
  } else {
    // 永久利用権ではない場合
    updateState({
      isPermanentUser: false,
      // 他の状態はリセットしない（上位モジュールで必要に応じてリセット）
    });
  }
}
/**
 * 仮想テナントデータをローカルストレージに保存
 *
 * @param data 仮想テナントデータ
 */
function storeVirtualTenantData(data: VirtualTenantData): void {
  if (!isClient() || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem('virtualTenantData', JSON.stringify(data));
    logDebug('仮想テナントデータを保存', { tenantId: data.id });
  } catch (error) {
    logDebug('仮想テナントデータ保存エラー', error);
  }
}
/**
 * 永久利用権ユーザーのプラン種別を取得し、アクセス権を更新する
 *
 * @returns プラン種別のPromise
 */
export async function fetchPermanentPlanType(): Promise<PermanentPlanType | null> {
  if (!isClient() || !corporateAccessState.isPermanentUser) {
    return null;
  }
  // すでに取得済みの場合は保存されている値を返す
  if (corporateAccessState.permanentPlanType) {
    // プラン種別に基づいてアクセス権を更新
    updatePermanentAccessByPlanType(corporateAccessState.permanentPlanType as PermanentPlanType);
    return corporateAccessState.permanentPlanType as PermanentPlanType;
  }
  try {
    logDebug('永久利用権プラン種別を取得開始', {});
    const response = await fetch('/api/user/permanent-plan-type', {
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
      credentials: 'include',
    });
    if (response.ok) {
      const data = await response.json();
      logDebug('永久利用権プラン種別取得結果', data);
      if (!data.isPermanent) {
        // APIによると永久利用権ユーザーではない
        updatePermanentUserStatus(false);
        return null;
      }
      // プラン種別を取得
      // デフォルトはPERSONAL
      const planType = (data.planType || PermanentPlanType.PERSONAL) as PermanentPlanType;
      // 状態を更新
      updateState({
        permanentPlanType: planType,
      });
      // プラン種別に基づいてアクセス権を更新
      updatePermanentAccessByPlanType(planType);
      return planType;
    } else {
      // エラー時はデフォルトでpersonalに設定（安全側）
      const defaultPlanType = PermanentPlanType.PERSONAL;
      updateState({
        permanentPlanType: defaultPlanType,
      });
      updatePermanentAccessByPlanType(defaultPlanType);
      logDebug('永久利用権プラン種別取得エラー - デフォルト使用', { planType: defaultPlanType });
      return defaultPlanType;
    }
  } catch (error) {
    logDebug('永久利用権プラン種別取得エラー', error);
    // エラー時はデフォルトでpersonalに設定（安全側）
    const defaultPlanType = PermanentPlanType.PERSONAL;
    updateState({
      permanentPlanType: defaultPlanType,
    });
    updatePermanentAccessByPlanType(defaultPlanType);
    return defaultPlanType;
  }
}
/**
 * プラン種別に基づいて永久利用権ユーザーのアクセス権を更新
 *
 * @param planType プラン種別
 */
export function updatePermanentAccessByPlanType(planType: PermanentPlanType): void {
  // 明示的にプラン種別を確認して処理
  let hasAccess = false;
  switch (planType) {
    case PermanentPlanType.PERSONAL:
      // 個人プランは法人アクセス権なし
      hasAccess = false;
      break;
    case PermanentPlanType.BUSINESS:
    case PermanentPlanType.BUSINESS_PLUS:
    case PermanentPlanType.ENTERPRISE:
      // 法人プランはアクセス権あり
      hasAccess = true;
      break;
    default:
      // デフォルトはアクセス権なし
      hasAccess = false;
      break;
  }
  // ユーザーIDを取得（可能であれば）
  let userId = '';
  try {
    if (typeof sessionStorage !== 'undefined') {
      const userDataStr = sessionStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        userId = userData.id || '';
      }
    }
  } catch (e) {
    logDebug('ユーザーID取得エラー', e);
  }
  // 更新対象の状態
  const updateData: Partial<CorporateAccessState> = {
    hasAccess,
    isAdmin: hasAccess,
    userRole: hasAccess ? 'admin' : null,
    permanentPlanType: planType,
  };
  // 法人プランの場合はテナントIDも設定
  if (hasAccess && userId) {
    updateData.tenantId = `virtual-tenant-${userId}`;
  } else {
    updateData.tenantId = null;
  }
  // 状態を更新
  updateState(updateData);
  logDebug('永久利用権プラン種別によるアクセス権更新', {
    planType,
    hasAccess,
    isAdmin: hasAccess,
    userRole: hasAccess ? 'admin' : null,
    tenantId: updateData.tenantId,
  });
}
/**
 * 永久利用権ユーザーに対してアクション（プラン変更など）が許可されているかチェック
 *
 * @param action アクション名
 * @returns 許可されている場合はtrue、そうでなければfalse
 */
export function isPermanentActionAllowed(action: string): boolean {
  if (!corporateAccessState.isPermanentUser) {
    // 永久利用権ユーザーでなければ制限なし
    return true;
  }
  // 永久利用権ユーザーに制限されているアクション
  const restrictedActions = [
    'change_plan',
    'cancel_subscription',
    'downgrade_plan',
    'upgrade_plan',
  ];
  // 制限アクションリストにあるかチェック
  return !restrictedActions.includes(action);
}