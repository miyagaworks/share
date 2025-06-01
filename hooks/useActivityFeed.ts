// hooks/useActivityFeed.ts
import { useState, useEffect, useCallback } from 'react';
import { useCorporateAccess } from '@/hooks/useCorporateAccess';
interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  corporateRole: string | null;
}
interface ActivityLog {
  id: string;
  tenantId: string;
  userId: string | null;
  user: User | null;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string;
  metadata: Record<string, unknown> | null; // any を unknown に変更
  createdAt: string;
}
interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}
interface ActivityFeedResponse {
  activities: ActivityLog[];
  pagination: PaginationInfo;
}
interface UseActivityFeedOptions {
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}
export function useActivityFeed({
  limit = 10,
  autoRefresh = false,
  refreshInterval = 60000, // 1分
}: UseActivityFeedOptions = {}) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const { hasCorporateAccess } = useCorporateAccess();
  // アクティビティデータの取得関数
  const fetchActivities = useCallback(
    async (pageNum = 1) => {
      if (!hasCorporateAccess) {
        setError('法人アクセス権限がありません');
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError(null);
        // キャッシュを無効化するためのクエリパラメータを追加
        const timestamp = new Date().getTime();
        const response = await fetch(
          `/api/corporate/activity?page=${pageNum}&limit=${limit}&_t=${timestamp}`,
          {
            headers: {
              'Cache-Control': 'no-cache, no-store',
              Pragma: 'no-cache',
            },
          },
        );
        if (!response.ok) {
          if (response.status === 403) {
            throw new Error('アクセス権限がありません');
          }
          const errorData = await response.json();
          throw new Error(errorData.error || 'アクティビティデータの取得に失敗しました');
        }
        const data: ActivityFeedResponse = await response.json();
        setActivities(data.activities);
        setPagination(data.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'アクティビティデータの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    },
    [hasCorporateAccess, limit],
  );
  // ページ変更ハンドラ
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);
  // 自動更新処理
  useEffect(() => {
    fetchActivities(page);
    // 自動更新が有効な場合
    if (autoRefresh) {
      const intervalId = setInterval(() => {
        fetchActivities(page);
      }, refreshInterval);
      return () => clearInterval(intervalId);
    }
  }, [fetchActivities, page, autoRefresh, refreshInterval]);
  // 手動更新関数
  const refreshActivities = useCallback(() => {
    return fetchActivities(page);
  }, [fetchActivities, page]);
  return {
    activities,
    pagination,
    isLoading,
    error,
    page,
    setPage: handlePageChange,
    refresh: refreshActivities,
  };
}