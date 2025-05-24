// lib/react-query.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分間データを新鮮と見なす
      gcTime: 10 * 60 * 1000, // 10分間キャッシュを保持
      refetchOnWindowFocus: false, // ウィンドウフォーカス時の再取得を無効
      refetchOnMount: true, // マウント時は再取得
      retry: (failureCount, error: unknown) => {
        // 認証エラーや404の場合はリトライしない
        if (typeof error === 'object' && error !== null && 'status' in error) {
          const statusError = error as { status: number };
          if (statusError.status === 401 || statusError.status === 404) {
            return false;
          }
        }
        // 最大3回まで
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false, // ミューテーションはリトライしない
    },
  },
});