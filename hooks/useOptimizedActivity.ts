// hooks/useOptimizedActivity.ts
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

interface ActivityItem {
  id: string;
  action: string;
  description: string;
  createdAt: string;
  user: {
    name: string;
  } | null;
}

interface UseActivityFeedOptions {
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useOptimizedActivity({
  limit = 5,
  autoRefresh = false,
  refreshInterval = 5 * 60 * 1000, // 5分
}: UseActivityFeedOptions = {}) {
  const { data: session } = useSession();

  return useQuery<ActivityItem[]>({
    queryKey: ['activity', session?.user?.id, limit],
    queryFn: async () => {
      const response = await fetch(`/api/corporate/activity?limit=${limit}`);

      if (!response.ok) {
        throw new Error('アクティビティデータの取得に失敗しました');
      }

      const data = await response.json();
      return data.activities || [];
    },
    enabled: !!session?.user?.id,
    staleTime: 2 * 60 * 1000, // 2分間フレッシュ
    refetchInterval: autoRefresh ? refreshInterval : false,
  });
}