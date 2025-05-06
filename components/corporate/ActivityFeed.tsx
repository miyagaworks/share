// components/corporate/ActivityFeed.tsx
import React from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { useActivityFeed } from '@/hooks/useActivityFeed';

interface ActivityFeedProps {
  limit?: number;
  className?: string;
  autoRefresh?: boolean;
}

// アクションアイコンのマッピング
function getActionIcon(action: string): string {
  switch (action) {
    case 'create_user':
      return '👤+';
    case 'update_user':
      return '👤✏️';
    case 'delete_user':
      return '👤-';
    case 'create_department':
      return '🏢+';
    case 'update_branding':
      return '🎨';
    case 'update_sns':
      return '🔗';
    case 'update_settings':
      return '⚙️';
    case 'login':
      return '🔓';
    case 'logout':
      return '🔒';
    case 'invite_user':
      return '✉️';
    default:
      return '📝';
  }
}

// 日付フォーマット用の関数
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  // 経過時間を計算
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  // 相対時間を返す
  if (diffDay > 30) {
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  } else if (diffDay > 0) {
    return `${diffDay}日前`;
  } else if (diffHour > 0) {
    return `${diffHour}時間前`;
  } else if (diffMin > 0) {
    return `${diffMin}分前`;
  } else {
    return `${diffSec}秒前`;
  }
}

export function ActivityFeed({
  limit = 5,
  className = '',
  autoRefresh = false,
}: ActivityFeedProps) {
  const { activities, isLoading, error, refresh } = useActivityFeed({
    limit,
    autoRefresh,
    refreshInterval: 60000, // 1分ごとに更新
  });

  // 更新ボタンをクリックしたときの処理
  const handleRefresh = () => {
    refresh();
  };

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
        <p>エラー: {error}</p>
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
            <div key={activity.id} className="flex p-2 hover:bg-gray-50 rounded-md">
              <div className="mr-3 text-lg">{getActionIcon(activity.action)}</div>
              <div className="flex-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{activity.user?.name || '不明なユーザー'}</span>
                  <span className="text-gray-500 text-xs">
                    {formatRelativeTime(activity.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{activity.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}