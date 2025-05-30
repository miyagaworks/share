// hooks/useDashboardInfo.ts (修正版)
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

// 🔧 型定義をこのファイル内に移動
export interface DashboardInfo {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    subscriptionStatus: string | null;
  };
  permissions: {
    userType: 'admin' | 'corporate' | 'personal' | 'permanent' | 'invited-member';
    isAdmin: boolean;
    isSuperAdmin: boolean;
    hasCorpAccess: boolean;
    isCorpAdmin: boolean;
    isPermanentUser: boolean;
    permanentPlanType: string | null;
    userRole: 'admin' | 'member' | 'personal' | null;
    // プラン関連プロパティ
    hasActivePlan: boolean;
    isTrialPeriod: boolean;
    planType: 'personal' | 'corporate' | 'permanent' | null;
    planDisplayName: string;
  };
  navigation: {
    shouldRedirect: boolean;
    redirectPath: string | null;
    menuItems: Array<{
      title: string;
      href: string;
      icon: string;
      isDivider?: boolean;
    }>;
  };
  tenant: {
    id: string;
    name: string;
    logoUrl: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
  } | null;
}

export function useDashboardInfo() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['dashboardInfo', session?.user?.id],
    queryFn: async (): Promise<DashboardInfo> => {
      console.log('🚀 Dashboard API呼び出し');

      const response = await fetch('/api/user/dashboard-info', {
        headers: {
          'Cache-Control': 'no-cache',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🚀 Dashboard API Error:', response.status, errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Dashboard Info取得成功:', {
        userType: data.permissions?.userType,
        hasMenuItems: !!data.navigation?.menuItems?.length,
        hasTenant: !!data.tenant,
        shouldRedirect: data.navigation?.shouldRedirect,
        redirectPath: data.navigation?.redirectPath,
      });

      return data;
    },
    enabled: !!session?.user?.id,
    staleTime: 0, // キャッシュなし
    gcTime: 30 * 1000, // 30秒間保持
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: (failureCount, error) => {
      console.log('🚀 Dashboard Info リトライ判定:', failureCount, error);

      if (failureCount >= 2) return false;

      if (error instanceof Error) {
        if (error.message.includes('401')) return false;
        if (error.message.includes('404')) return false;
      }

      return true;
    },
    retryDelay: 1000,
  });
}

// 特定権限チェック用フック
export function useIsInvitedMember() {
  const { data } = useDashboardInfo();
  return data?.permissions.userType === 'invited-member';
}

export function useIsCorporateAdmin() {
  const { data } = useDashboardInfo();
  return data?.permissions.isCorpAdmin === true;
}

export function useUserType() {
  const { data } = useDashboardInfo();
  return data?.permissions.userType || null;
}

export function useHasCorporateAccess() {
  const { data } = useDashboardInfo();
  return data?.permissions.hasCorpAccess === true;
}

export function useIsAdmin() {
  const { data } = useDashboardInfo();
  return data?.permissions.isAdmin === true;
}

export function useIsSuperAdmin() {
  const { data } = useDashboardInfo();
  return data?.permissions.isSuperAdmin === true;
}

export function usePlanInfo() {
  const { data } = useDashboardInfo();
  return {
    hasActivePlan: data?.permissions.hasActivePlan || false,
    isTrialPeriod: data?.permissions.isTrialPeriod || false,
    planType: data?.permissions.planType || null,
    planDisplayName: data?.permissions.planDisplayName || '不明',
  };
}

// デバッグ用フック
export function useDebugDashboardInfo() {
  const result = useDashboardInfo();

  // デバッグ情報をコンソールに出力
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('🔍 Dashboard Info Debug:', {
      isLoading: result.isLoading,
      isError: result.isError,
      error: result.error,
      hasData: !!result.data,
      userType: result.data?.permissions?.userType,
      menuCount: result.data?.navigation?.menuItems?.length,
      shouldRedirect: result.data?.navigation?.shouldRedirect,
      redirectPath: result.data?.navigation?.redirectPath,
      planInfo: {
        hasActivePlan: result.data?.permissions?.hasActivePlan,
        isTrialPeriod: result.data?.permissions?.isTrialPeriod,
        planDisplayName: result.data?.permissions?.planDisplayName,
      },
    });
  }

  return result;
}