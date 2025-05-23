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
  console.log('useOptimizedTenant - API呼び出し開始');

  const response = await fetch('/api/corporate/tenant', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'max-age=300', // 5分間ブラウザキャッシュ
    },
  });

  console.log('useOptimizedTenant - APIレスポンス:', {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
  });

  if (!response.ok) {
    let errorData: { error?: string; details?: string; code?: string } = {};

    try {
      const errorText = await response.text();
      errorData = JSON.parse(errorText);
    } catch (parseError) {
      console.error('useOptimizedTenant - レスポンス解析エラー:', parseError);
      errorData = { error: 'レスポンスの解析に失敗しました' };
    }

    console.error('useOptimizedTenant - APIエラー:', {
      status: response.status,
      statusText: response.statusText,
      errorData,
    });

    const apiError = new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`,
    ) as ApiError;
    apiError.status = response.status;
    apiError.code = errorData.code;
    apiError.details = errorData.details;

    throw apiError;
  }

  const data = await response.json();
  console.log('useOptimizedTenant - APIレスポンスデータ:', {
    hasTenant: !!data.tenant,
    tenantId: data.tenant?.id,
    tenantName: data.tenant?.name,
    isAdmin: data.isAdmin,
    userRole: data.userRole,
    accountStatus: data.tenant?.accountStatus,
  });

  return data;
}

// 最適化されたテナント情報取得フック
export function useOptimizedTenant() {
  const { data: session } = useSession();

  const query = useQuery<TenantResponse, ApiError>({
    queryKey: ['tenant', session?.user?.id],
    queryFn: fetchTenantInfo,
    enabled: !!session?.user?.id,
    staleTime: 5 * 60 * 1000, // 5分間はフレッシュ
    gcTime: 10 * 60 * 1000, // 10分間キャッシュ保持 (旧cacheTime)
    retry: (failureCount, error) => {
      // 認証エラーや404の場合はリトライしない
      if (error.status === 401 || error.status === 404) {
        return false;
      }
      // 最大3回まで
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    refetchInterval: false, // 自動更新は無効
  });

  console.log('useOptimizedTenant - クエリ状態:', {
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error?.message,
    hasData: !!query.data,
    status: query.status,
    enabled: !!session?.user?.id,
  });

  return query;
}

// テナント情報を手動で更新するフック
export function useRefreshTenant() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useCallback(() => {
    console.log('useRefreshTenant - 手動更新開始');
    return queryClient.invalidateQueries({
      queryKey: ['tenant', session?.user?.id],
    });
  }, [queryClient, session?.user?.id]);
}