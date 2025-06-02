// hooks/useOptimizedTenant.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useCallback } from 'react';
// テナント情報の型定義
interface TenantInfo {
  id: string;
  name: string;
  logoUrl?: string | null;
  logoWidth?: number | null;
  logoHeight?: number | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  headerText?: string | null;
  textColor?: string | null;
  maxUsers: number;
  accountStatus: string;
  onboardingCompleted: boolean;
  userCount: number;
  departmentCount: number;
  users: Array<{ id: string; name?: string | null; role: string }>;
  departments: Array<{ id: string; name: string }>;
  subscriptionPlan?: string;
}
interface TenantResponse {
  tenant: TenantInfo;
  isAdmin: boolean;
  userRole: string;
}
// エラー型定義
interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: string;
}
// テナント情報を取得する関数
async function fetchTenantInfo(): Promise<TenantResponse> {
  const response = await fetch('/api/corporate/tenant', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'max-age=300', // 5分間ブラウザキャッシュ
    },
  });

  if (!response.ok) {
    let errorData: { error?: string; details?: string; code?: string } = {};
    try {
      const errorText = await response.text();
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { error: 'レスポンスの解析に失敗しました' };
    }

    const apiError = new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`,
    ) as ApiError;
    apiError.status = response.status;
    apiError.code = errorData.code;
    apiError.details = errorData.details;
    throw apiError;
  }
  const data = await response.json();

  return data;
}
// 最適化されたテナント情報取得フック
export function useOptimizedTenant() {
  const { data: session } = useSession();

  const query = useQuery<TenantResponse, ApiError>({
    queryKey: ['tenant', session?.user?.id],
    queryFn: fetchTenantInfo,
    enabled: !!session?.user?.id,
    staleTime: 0, // 🔥 永久利用権ユーザーの場合はキャッシュを短縮
    gcTime: 5 * 60 * 1000, // 🔥 5分間キャッシュ保持に短縮
    retry: (failureCount, error) => {
      if (error.status === 401 || error.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true, // 🔥 フォーカス時も再取得
    refetchOnMount: true, // 🔥 マウント時も再取得
    refetchOnReconnect: true,
    refetchInterval: false,
  });

  return query;
}
// テナント情報を手動で更新するフック
export function useRefreshTenant() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  return useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: ['tenant', session?.user?.id],
    });
  }, [queryClient, session?.user?.id]);
}