// hooks/usePlanInfo.ts - 既存型定義に合わせた修正版
import { useDashboardInfo } from './useDashboardInfo';

export interface PlanDisplayInfo {
  // プラン基本情報
  planType: 'personal' | 'corporate' | 'permanent' | null;
  displayName: string;
  hasActivePlan: boolean;
  isTrialPeriod: boolean;

  // UI表示制御
  shouldShowTrialBanner: boolean;
  shouldShowUpgradePrompt: boolean;
  shouldShowCorporateFeatures: boolean;

  // ユーザータイプ情報
  userType: string;
  isCorpAdmin: boolean;
  isInvitedMember: boolean;
  isPermanentUser: boolean;
}

export function usePlanInfo(): PlanDisplayInfo | null {
  const { data: dashboardInfo } = useDashboardInfo();

  if (!dashboardInfo) return null;

  const { permissions } = dashboardInfo;
  const {
    userType,
    isCorpAdmin,
    isPermanentUser,
    hasActivePlan,
    isTrialPeriod,
    planType,
    planDisplayName,
  } = permissions;

  // 🚀 トライアルバナー表示判定（重要な修正）
  const shouldShowTrialBanner =
    isTrialPeriod &&
    userType === 'personal' && // 個人ユーザーのみ
    !isCorpAdmin && // 法人管理者は除外
    !isPermanentUser; // 永久利用権ユーザーは除外

  // 🚀 アップグレード促進表示判定
  const shouldShowUpgradePrompt = !hasActivePlan && userType === 'personal' && !isPermanentUser;

  // 🚀 法人機能表示判定
  const shouldShowCorporateFeatures =
    userType === 'corporate' || userType === 'invited-member' || isPermanentUser;

  return {
    // プラン基本情報
    planType,
    displayName: planDisplayName,
    hasActivePlan,
    isTrialPeriod,

    // UI表示制御
    shouldShowTrialBanner,
    shouldShowUpgradePrompt,
    shouldShowCorporateFeatures,

    // ユーザータイプ情報
    userType,
    isCorpAdmin,
    isInvitedMember: userType === 'invited-member',
    isPermanentUser,
  };
}

// 🎯 特定の判定用フック
export function useIsTrialUser() {
  const planInfo = usePlanInfo();
  return planInfo?.shouldShowTrialBanner ?? false;
}

export function useShouldShowUpgrade() {
  const planInfo = usePlanInfo();
  return planInfo?.shouldShowUpgradePrompt ?? false;
}

export function useCanAccessCorporateFeatures() {
  const planInfo = usePlanInfo();
  return planInfo?.shouldShowCorporateFeatures ?? false;
}