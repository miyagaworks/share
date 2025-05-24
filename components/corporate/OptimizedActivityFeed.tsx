// components/corporate/OptimizedActivityFeed.tsx
import React, { memo, useMemo } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { useOptimizedActivity } from '@/hooks/useOptimizedActivity';
import { formatRelativeTime } from '@/lib/utils';

interface OptimizedActivityFeedProps {
  limit?: number;
  className?: string;
  autoRefresh?: boolean;
}

// アクションアイコンマップをコンポーネント外で定義
const actionIconMap: Record<string, string> = {
  create_user: '👤+',
  update_user: '👤✏️',
  delete_user: '👤-',
  create_department: '🏢+',
  update_branding: '🎨',
  update_sns: '🔗',
  update_settings: '⚙️',
  login: '🔓',
  logout: '🔒',
  invite_user: '✉️',
};

// 個別のアクティビティアイテムコンポーネント
const ActivityItem = memo<{
  activity: {
    id: string;
    action: string;
    description: string;
    createdAt: string;
    user: { name: string } | null;
  };
}>(({ activity }) => {
  const icon = useMemo(() => actionIconMap[activity.action] || '📝', [activity.action]);

  const timeText = useMemo(() => formatRelativeTime(activity.createdAt), [activity.createdAt]);

  return (
    <div className="flex p-2 hover:bg-gray-50 rounded-md">
      <div className="mr-3 text-lg">{icon}</div>
      <div className="flex-1">
        <div className="flex justify-between text-sm">
          <span className="font-medium">{activity.user?.name || '不明なユーザー'}</span>
          <span className="text-gray-500 text-xs">{timeText}</span>
        </div>
        <p className="text-sm text-gray-600">{activity.description}</p>
      </div>
    </div>
  );
});

ActivityItem.displayName = 'ActivityItem';

export const OptimizedActivityFeed = memo<OptimizedActivityFeedProps>(
  ({ limit = 5, className = '', autoRefresh = false }) => {
    const {
      data: activities = [],
      isLoading,
      error,
      refetch,
    } = useOptimizedActivity({
      limit,
      autoRefresh,
      refreshInterval: 5 * 60 * 1000, // 5分
    });

    const handleRefresh = useMemo(
      () => () => {
        refetch();
      },
      [refetch],
    );

    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-4">
          <Spinner size="md" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-center text-red-600">
          <p>エラー: {error.message}</p>
          <button
            onClick={handleRefresh}
            className="mt-2 px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded hover:bg-red-200"
          >
            再試行
          </button>
        </div>
      );
    }

    return (
      <div className={className}>
        <div className="mb-3 flex justify-between items-center">
          <h3 className="text-base sm:text-lg font-medium">最近の活動</h3>
          <button
            onClick={handleRefresh}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            更新
          </button>
        </div>

        {activities.length === 0 ? (
          <div className="text-center text-gray-500 py-4">活動データはありません</div>
        ) : (
          <div className="space-y-2">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </div>
    );
  },
);

OptimizedActivityFeed.displayName = 'OptimizedActivityFeed';