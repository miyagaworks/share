// hooks/useDashboardInfo.ts (元の状態)
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { DashboardInfo } from '@/hooks/useTestDashboardInfo';

export function useDashboardInfo() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['dashboardInfo', session?.user?.id],
    queryFn: async (): Promise<DashboardInfo> => {
      console.log('🚀 Production Dashboard API呼び出し');

      const response = await fetch('/api/user/dashboard-info', {
        headers: {
          'Cache-Control': 'no-cache',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Production Dashboard Info取得成功:', data.permissions?.userType);
      return data;
    },
    enabled: !!session?.user?.id,
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    gcTime: 10 * 60 * 1000, // 10分間保持
    refetchOnWindowFocus: false,
    refetchOnMount: false, // 🚀 マウント時再取得無効（高速化）
    retry: 2,
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