// lib/react-query.ts (元の状態)
import { QueryClient } from '@tanstack/react-query';
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分間データを新鮮と見なす
      gcTime: 10 * 60 * 1000, // 10分間キャッシュを保持（cacheTimeから変更）
      refetchOnWindowFocus: false, // ウィンドウフォーカス時の再取得を無効
      refetchOnMount: true, // マウント時は再取得
      retry: (failureCount, error: unknown) => {
        // 認証エラーや404の場合はリトライしない
        if (typeof error === 'object' && error !== null && 'message' in error) {
          const errorMessage = String((error as { message: unknown }).message);
          if (errorMessage.includes('401') || errorMessage.includes('404')) {
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
// 開発環境でのデバッグ用設定
if (process.env.NODE_ENV === 'development') {
  queryClient.setQueryDefaults(['dashboardInfo'], {
    staleTime: 2 * 60 * 1000, // 開発中は2分で更新
    gcTime: 5 * 60 * 1000,
  });
}