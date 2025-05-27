// hooks/useTestDashboardInfo.ts - 更新版
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

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
    // 🚀 新しく追加されたプラン関連プロパティ
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

export function useTestDashboardInfo() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['testDashboardInfo', session?.user?.id],
    queryFn: async (): Promise<DashboardInfo> => {
      console.log('🧪 Test Dashboard Info fetch開始');

      const response = await fetch('/api/user/dashboard-info', {
        headers: {
          'Cache-Control': 'no-cache',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🧪 API Error:', response.status, errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('🧪 Test Dashboard Info取得成功:', {
        userType: data.permissions?.userType,
        hasMenuItems: !!data.navigation?.menuItems?.length,
        hasTenant: !!data.tenant,
        hasActivePlan: data.permissions?.hasActivePlan,
        isTrialPeriod: data.permissions?.isTrialPeriod,
        planDisplayName: data.permissions?.planDisplayName,
      });

      return data;
    },
    enabled: !!session?.user?.id,
    staleTime: 30 * 1000, // テスト中は30秒
    gcTime: 2 * 60 * 1000, // 2分間保持
    refetchOnWindowFocus: false,
    refetchOnMount: true, // テスト中はマウント時に取得
    retry: (failureCount, error) => {
      console.log('🧪 リトライ判定:', failureCount, error);

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

// デバッグ用フック
export function useDebugDashboardInfo() {
  const result = useTestDashboardInfo();

  // デバッグ情報をコンソールに出力
  if (typeof window !== 'undefined') {
    console.log('🔍 Dashboard Info Debug:', {
      isLoading: result.isLoading,
      isError: result.isError,
      error: result.error,
      hasData: !!result.data,
      userType: result.data?.permissions?.userType,
      menuCount: result.data?.navigation?.menuItems?.length,
      planInfo: {
        hasActivePlan: result.data?.permissions?.hasActivePlan,
        isTrialPeriod: result.data?.permissions?.isTrialPeriod,
        planDisplayName: result.data?.permissions?.planDisplayName,
      },
    });
  }

  return result;
}