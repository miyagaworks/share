// components/layout/NotificationBell.tsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { HiBell } from 'react-icons/hi';
import { Spinner } from '@/components/ui/Spinner';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
// お知らせの型定義
interface Notification {
  id: string;
  title: string;
  content: string;
  type: string;
  priority: string;
  imageUrl: string | null;
  startDate: string;
  endDate: string | null;
  isRead: boolean;
  createdAt: string;
}
export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // 初回読み込み
  useEffect(() => {
    fetchNotifications();
    // 定期的な更新（5分ごと）
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  // クリックイベントハンドラを設定
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  // お知らせ取得
  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/notifications', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // クッキー（認証情報）を含める
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API応答エラー: ${response.status}`);
      }
      const data = await response.json();
      if (!data.notifications) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラー';
      setError('お知らせの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };
  // お知らせを既読にする
  const markAsRead = async (notificationId: string) => {
    // UIを先に更新（UX向上のため）
    setNotifications(
      notifications.map((notification) =>
        notification.id === notificationId ? { ...notification, isRead: true } : notification,
      ),
    );
    // 未読カウントを減らす
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      const response = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId }),
      });
      if (!response.ok) {
        // エラーが発生してもUI側の表示は変更しない（UX向上のため）
      }
    } catch (err) {
      // エラーが発生してもUI側の表示は変更しない（UX向上のため）
    }
  };
  // お知らせクリック処理
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };
  // お知らせの種類に応じたアイコンクラス
  const getNotificationTypeClass = (type: string) => {
    switch (type) {
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'announcement':
        return 'bg-green-100 text-green-800';
      case 'feature':
        return 'bg-purple-100 text-purple-800';
      case 'alert':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  // 日付のフォーマット
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ja,
      });
    } catch {
      return dateString;
    }
  };
  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1 rounded-full text-gray-600 hover:bg-gray-100 focus:outline-none"
        aria-label="お知らせ"
      >
        <HiBell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>
      {/* お知らせドロップダウン */}
      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-md shadow-lg overflow-hidden z-50 max-h-[80vh] flex flex-col"
        >
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-semibold">お知らせ</h3>
          </div>
          <div className="overflow-y-auto flex-grow">
            {loading && (
              <div className="text-center py-6">
                <Spinner size="md" />
                <p className="mt-2 text-sm text-gray-500">読み込み中...</p>
              </div>
            )}
            {error && <div className="px-4 py-3 text-sm text-red-500">{error}</div>}
            {!loading && !error && notifications.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                お知らせはありません
              </div>
            )}
            {!loading &&
              !error &&
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex justify-between items-start">
                    <span
                      className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getNotificationTypeClass(
                        notification.type,
                      )}`}
                    >
                      {notification.type === 'maintenance' && 'メンテナンス'}
                      {notification.type === 'announcement' && 'お知らせ'}
                      {notification.type === 'feature' && '新機能'}
                      {notification.type === 'alert' && 'アラート'}
                      {!['maintenance', 'announcement', 'feature', 'alert'].includes(
                        notification.type,
                      ) && notification.type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(notification.createdAt)}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium mt-1">{notification.title}</h4>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notification.content}</p>
                  {!notification.isRead && (
                    <div className="mt-2 text-right">
                      <span className="text-xs font-medium text-blue-600">未読</span>
                    </div>
                  )}
                </div>
              ))}
          </div>
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-right">
            <span
              onClick={fetchNotifications}
              className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              更新
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
// 名前付きエクスポートも追加
export { NotificationBell };