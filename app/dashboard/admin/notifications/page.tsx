// app/dashboard/admin/notifications/page.tsx
'use client';
import React, { useState, useEffect, Fragment, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/Spinner';
import {
  HiBell,
  HiPlus,
  HiPencil,
  HiTrash,
  HiRefresh,
  HiSearch,
  HiChevronDown,
  HiChevronUp,
} from 'react-icons/hi';
import { toast } from 'react-hot-toast';
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
  targetGroup: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
// お知らせフォームの型
interface NotificationFormData {
  title: string;
  content: string;
  type: string;
  priority: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  targetGroup: string;
  active: boolean;
}
// フィルター設定の型
interface FilterConfig {
  status: string;
  type: string;
  priority: string;
}
// ソート設定の型
interface SortConfig {
  key: string;
  direction: string;
}
// 初期フォームデータ
const initialFormData: NotificationFormData = {
  title: '',
  content: '',
  type: 'announcement',
  priority: 'normal',
  imageUrl: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  targetGroup: 'all',
  active: true,
};
// お知らせ統計データの型
interface NotificationStats {
  total: number;
  active: number;
  inactive: number;
  upcoming: number;
  expired: number;
  byType: Record<string, number>;
}
export default function AdminNotificationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    active: 0,
    inactive: 0,
    upcoming: 0,
    expired: 0,
    byType: {},
  });
  // フィルター状態
  const [filters, setFilters] = useState({
    status: 'all', // 'all', 'active', 'inactive', 'upcoming', 'expired'
    type: 'all', // 'all', 'announcement', 'maintenance', 'feature', 'alert'
    priority: 'all', // 'all', 'high', 'normal', 'low'
  });
  // 並べ替え状態
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'createdAt',
    direction: 'desc',
  });
  // フォーム状態
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<NotificationFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  // 削除確認状態
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // 詳細表示状態
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // お知らせ一覧取得
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        calculateStats(data.notifications || []);
        applyFiltersAndSort(data.notifications || [], filters, searchTerm, sortConfig);
      } else {
        toast.error('お知らせ一覧の取得に失敗しました');
      }
    } catch {
      toast.error('お知らせ情報の取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [filters, searchTerm, sortConfig]);
  // 管理者チェック
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!session?.user?.id) {
        router.push('/auth/signin');
        return;
      }
      try {
        const response = await fetch('/api/admin/access');
        const data = await response.json();
        if (data.isSuperAdmin) {
          setIsAdmin(true);
          fetchNotifications();
        } else {
          router.push('/dashboard');
        }
      } catch {
        router.push('/dashboard');
      }
    };
    checkAdminAccess();
  }, [session, router, fetchNotifications]);
  // お知らせ統計情報の計算
  const calculateStats = (notificationList: Notification[]) => {
    const now = new Date();
    const stats: NotificationStats = {
      total: notificationList.length,
      active: 0,
      inactive: 0,
      upcoming: 0,
      expired: 0,
      byType: {},
    };
    notificationList.forEach((notification) => {
      // アクティブ/非アクティブのカウント
      if (notification.active) {
        stats.active++;
      } else {
        stats.inactive++;
      }
      // 開始前のお知らせをカウント
      if (new Date(notification.startDate) > now) {
        stats.upcoming++;
      }
      // 終了済みのお知らせをカウント
      if (notification.endDate && new Date(notification.endDate) < now) {
        stats.expired++;
      }
      // タイプ別カウント
      const type = notification.type;
      stats.byType[type] = (stats.byType[type] || 0) + 1;
    });
    setStats(stats);
  };
  // フィルタリングと並べ替えを適用
  const applyFiltersAndSort = (
    notificationList: Notification[],
    filters: FilterConfig,
    search: string,
    sortConfig: SortConfig,
  ) => {
    let filtered = [...notificationList];
    const now = new Date();
    // 検索フィルター
    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(
        (notification) =>
          notification.title.toLowerCase().includes(lowerSearch) ||
          notification.content.toLowerCase().includes(lowerSearch),
      );
    }
    // ステータスフィルター
    if (filters.status !== 'all') {
      switch (filters.status) {
        case 'active':
          filtered = filtered.filter((n) => n.active);
          break;
        case 'inactive':
          filtered = filtered.filter((n) => !n.active);
          break;
        case 'upcoming':
          filtered = filtered.filter((n) => new Date(n.startDate) > now);
          break;
        case 'expired':
          filtered = filtered.filter((n) => n.endDate && new Date(n.endDate) < now);
          break;
      }
    }
    // タイプフィルター
    if (filters.type !== 'all') {
      filtered = filtered.filter((n) => n.type === filters.type);
    }
    // 優先度フィルター
    if (filters.priority !== 'all') {
      filtered = filtered.filter((n) => n.priority === filters.priority);
    }
    // 並べ替え
    filtered.sort((a, b) => {
      // 値を取得
      const keyToSort = sortConfig.key as keyof Notification;
      const aValue = a[keyToSort];
      const bValue = b[keyToSort];
      // 日付型の場合は数値に変換
      if (
        typeof aValue === 'string' &&
        ['createdAt', 'updatedAt', 'startDate', 'endDate'].includes(sortConfig.key)
      ) {
        // 日付文字列をタイムスタンプに変換
        const aTimestamp = aValue ? new Date(aValue).getTime() : 0;
        const bTimestamp = bValue ? new Date(bValue as string).getTime() : 0;
        // 昇順/降順に応じて比較
        return sortConfig.direction === 'asc' ? aTimestamp - bTimestamp : bTimestamp - aTimestamp;
      }
      // nullチェックを追加して安全に比較
      // null値は常に最後に配置
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return sortConfig.direction === 'asc' ? 1 : -1;
      if (bValue === null) return sortConfig.direction === 'asc' ? -1 : 1;
      // それ以外の型の場合の比較
      if (aValue! < bValue!) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue! > bValue!) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    setFilteredNotifications(filtered);
  };
  // フィルター変更時に再適用
  useEffect(() => {
    applyFiltersAndSort(notifications, filters, searchTerm, sortConfig);
  }, [filters, searchTerm, sortConfig, notifications]);
  // 並べ替え変更ハンドラ
  const handleSort = (key: string) => {
    setSortConfig((prevConfig) => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
  };
  // フィルター変更ハンドラ
  const handleFilterChange = (filterType: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };
  // フォーム入力変更ハンドラ
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  // チェックボックス変更ハンドラ
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };
  // お知らせ作成/更新ハンドラ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      const url = editingId
        ? `/api/admin/notifications/${editingId}`
        : '/api/admin/notifications/create';
      const method = editingId ? 'PUT' : 'POST';
      // 日付のフォーマット
      const formattedData = {
        ...formData,
        startDate: formData.startDate
          ? new Date(formData.startDate).toISOString()
          : new Date().toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      };
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });
      if (response.ok) {
        await response.json();
        toast.success(editingId ? 'お知らせを更新しました' : 'お知らせを作成しました');
        // フォームをリセット
        setShowForm(false);
        setFormData(initialFormData);
        setEditingId(null);
        // 一覧を再取得
        fetchNotifications();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'お知らせの保存に失敗しました');
      }
    } catch {
      toast.error('処理中にエラーが発生しました');
    } finally {
      setFormSubmitting(false);
    }
  };
  // お知らせ編集ハンドラ
  const handleEdit = (notification: Notification) => {
    setFormData({
      title: notification.title,
      content: notification.content,
      type: notification.type,
      priority: notification.priority,
      imageUrl: notification.imageUrl || '',
      startDate: new Date(notification.startDate).toISOString().split('T')[0],
      endDate: notification.endDate
        ? new Date(notification.endDate).toISOString().split('T')[0]
        : '',
      targetGroup: notification.targetGroup,
      active: notification.active,
    });
    setEditingId(notification.id);
    setShowForm(true);
  };
  // お知らせ削除ハンドラ
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/admin/notifications/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        toast.success('お知らせを削除しました');
        // 削除確認をクリア
        setDeleteConfirm(null);
        // 一覧を再取得
        fetchNotifications();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'お知らせの削除に失敗しました');
      }
    } catch {
      toast.error('削除中にエラーが発生しました');
    } finally {
      setDeletingId(null);
    }
  };
  // フォームキャンセルハンドラ
  const handleCancelForm = () => {
    setShowForm(false);
    setFormData(initialFormData);
    setEditingId(null);
  };
  // プライオリティに応じたバッジカラー
  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  // タイプに応じたバッジカラー
  const getTypeBadgeClass = (type: string) => {
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
  // ターゲットグループに応じたバッジカラー
  const getTargetGroupBadgeClass = (targetGroup: string) => {
    switch (targetGroup) {
      case 'all':
        return 'bg-gray-100 text-gray-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'trial':
        return 'bg-blue-100 text-blue-800';
      case 'permanent':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  // ターゲットグループの表示名
  const getTargetGroupDisplay = (targetGroup: string) => {
    switch (targetGroup) {
      case 'all':
        return '全ユーザー';
      case 'active':
        return 'アクティブユーザー';
      case 'trial':
        return 'トライアルユーザー';
      case 'permanent':
        return '永久利用権ユーザー';
      default:
        return targetGroup;
    }
  };
  // 日付のフォーマット
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('ja-JP');
    } catch {
      return dateString;
    }
  };
  // 相対日付のフォーマット
  const formatRelativeDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ja,
      });
    } catch {
      return dateString;
    }
  };
  // 詳細表示切り替え
  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-2 text-gray-500">お知らせ情報を読み込み中...</p>
        </div>
      </div>
    );
  }
  if (!isAdmin) {
    return null; // リダイレクト処理中は表示なし
  }
  return (
    <div className="max-w-[80vw] mx-auto">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-center mb-6">
          <HiBell className="h-6 w-6 text-blue-600 mr-3" />
          <h1 className="text-2xl font-bold">お知らせ管理</h1>
        </div>
        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-800">合計</h3>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-green-800">有効</h3>
            <p className="text-2xl font-bold">{stats.active}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-yellow-800">開始前</h3>
            <p className="text-2xl font-bold">{stats.upcoming}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-red-800">無効/期限切れ</h3>
            <p className="text-2xl font-bold">{stats.inactive + stats.expired}</p>
          </div>
        </div>
        {/* 検索・アクションエリア */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <HiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="お知らせを検索..."
              className="pl-10 pr-3 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                setFormData(initialFormData);
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <HiPlus className="mr-2 h-4 w-4" />
              新規作成
            </button>
            <button
              onClick={fetchNotifications}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <HiRefresh className="mr-2 h-4 w-4" />
              更新
            </button>
          </div>
        </div>
        {/* フィルターエリア */}
        <div className="flex flex-wrap gap-2 mb-4">
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
          >
            <option value="all">全てのステータス</option>
            <option value="active">有効</option>
            <option value="inactive">無効</option>
            <option value="upcoming">開始前</option>
            <option value="expired">期限切れ</option>
          </select>
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
          >
            <option value="all">全てのタイプ</option>
            <option value="announcement">お知らせ</option>
            <option value="maintenance">メンテナンス</option>
            <option value="feature">新機能</option>
            <option value="alert">アラート</option>
          </select>
          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
          >
            <option value="all">全ての重要度</option>
            <option value="high">高</option>
            <option value="normal">通常</option>
            <option value="low">低</option>
          </select>
          <span className="text-sm text-gray-500 flex items-center ml-auto">
            {filteredNotifications.length}件表示 / 全{notifications.length}件
          </span>
        </div>
        {/* フォーム */}
        {showForm && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">
              {editingId ? 'お知らせを編集' : 'お知らせを作成'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">タイトル*</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">タイプ*</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="announcement">お知らせ</option>
                    <option value="maintenance">メンテナンス</option>
                    <option value="feature">新機能</option>
                    <option value="alert">アラート</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">重要度</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="low">低</option>
                    <option value="normal">通常</option>
                    <option value="high">高</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    対象ユーザー
                  </label>
                  <select
                    name="targetGroup"
                    value={formData.targetGroup}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="all">全ユーザー</option>
                    <option value="active">アクティブユーザー</option>
                    <option value="trial">トライアルユーザー</option>
                    <option value="permanent">永久利用権ユーザー</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    表示開始日*
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    表示終了日（空欄の場合は無期限）
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    画像URL（オプション）
                  </label>
                  <input
                    type="text"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="active"
                    id="active"
                    checked={formData.active}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                    有効にする
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">内容*</label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md h-32"
                ></textarea>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  disabled={formSubmitting}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {formSubmitting ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      保存中...
                    </>
                  ) : (
                    <>{editingId ? '更新' : '作成'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
        {/* お知らせ一覧テーブル */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center">
                    タイトル
                    {sortConfig.key === 'title' &&
                      (sortConfig.direction === 'asc' ? (
                        <HiChevronUp className="ml-1" />
                      ) : (
                        <HiChevronDown className="ml-1" />
                      ))}
                  </div>
                </th>
                <th
                  className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center">
                    タイプ
                    {sortConfig.key === 'type' &&
                      (sortConfig.direction === 'asc' ? (
                        <HiChevronUp className="ml-1" />
                      ) : (
                        <HiChevronDown className="ml-1" />
                      ))}
                  </div>
                </th>
                <th
                  className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('priority')}
                >
                  <div className="flex items-center">
                    重要度
                    {sortConfig.key === 'priority' &&
                      (sortConfig.direction === 'asc' ? (
                        <HiChevronUp className="ml-1" />
                      ) : (
                        <HiChevronDown className="ml-1" />
                      ))}
                  </div>
                </th>
                <th
                  className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('targetGroup')}
                >
                  <div className="flex items-center">
                    対象
                    {sortConfig.key === 'targetGroup' &&
                      (sortConfig.direction === 'asc' ? (
                        <HiChevronUp className="ml-1" />
                      ) : (
                        <HiChevronDown className="ml-1" />
                      ))}
                  </div>
                </th>
                <th
                  className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('startDate')}
                >
                  <div className="flex items-center">
                    表示期間
                    {sortConfig.key === 'startDate' &&
                      (sortConfig.direction === 'asc' ? (
                        <HiChevronUp className="ml-1" />
                      ) : (
                        <HiChevronDown className="ml-1" />
                      ))}
                  </div>
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => (
                  <Fragment key={notification.id}>
                    <tr
                      className={`hover:bg-gray-50 ${expandedId === notification.id ? 'bg-gray-50' : ''}`}
                      onClick={() => toggleExpand(notification.id)}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900 cursor-pointer">
                            {notification.title}
                          </div>
                          {expandedId === notification.id ? (
                            <HiChevronUp className="ml-2 h-4 w-4 text-gray-500" />
                          ) : (
                            <HiChevronDown className="ml-2 h-4 w-4 text-gray-500" />
                          )}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {notification.content.length > 50
                            ? `${notification.content.substring(0, 50)}...`
                            : notification.content}
                        </div>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeBadgeClass(notification.type)}`}
                        >
                          {notification.type === 'maintenance' && 'メンテナンス'}
                          {notification.type === 'announcement' && 'お知らせ'}
                          {notification.type === 'feature' && '新機能'}
                          {notification.type === 'alert' && 'アラート'}
                          {!['maintenance', 'announcement', 'feature', 'alert'].includes(
                            notification.type,
                          ) && notification.type}
                        </span>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadgeClass(notification.priority)}`}
                        >
                          {notification.priority === 'high' && '高'}
                          {notification.priority === 'normal' && '通常'}
                          {notification.priority === 'low' && '低'}
                          {!['high', 'normal', 'low'].includes(notification.priority) &&
                            notification.priority}
                        </span>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTargetGroupBadgeClass(notification.targetGroup)}`}
                        >
                          {getTargetGroupDisplay(notification.targetGroup)}
                        </span>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDate(notification.startDate)}
                          {notification.endDate && ` ～ ${formatDate(notification.endDate)}`}
                          {!notification.endDate && ' ～ 無期限'}
                        </div>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        {notification.active ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            有効
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            無効
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2 justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(notification);
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1"
                          >
                            <HiPencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm(notification.id);
                            }}
                            className="text-red-600 hover:text-red-900 p-1"
                          >
                            <HiTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === notification.id && (
                      <tr className="bg-gray-50">
                        <td colSpan={7} className="py-4 px-6 border-t border-gray-100">
                          <div className="text-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <h4 className="font-medium text-gray-900 mb-1">詳細情報</h4>
                                <ul className="space-y-1">
                                  <li className="text-gray-600">
                                    <span className="font-medium text-gray-900">作成日時:</span>{' '}
                                    {formatDate(notification.createdAt)} (
                                    {formatRelativeDate(notification.createdAt)})
                                  </li>
                                  <li className="text-gray-600">
                                    <span className="font-medium text-gray-900">更新日時:</span>{' '}
                                    {formatDate(notification.updatedAt)} (
                                    {formatRelativeDate(notification.updatedAt)})
                                  </li>
                                  <li className="text-gray-600">
                                    <span className="font-medium text-gray-900">ID:</span>{' '}
                                    {notification.id}
                                  </li>
                                  {notification.imageUrl && (
                                    <li className="text-gray-600">
                                      <span className="font-medium text-gray-900">画像URL:</span>{' '}
                                      <a
                                        href={notification.imageUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                      >
                                        {notification.imageUrl}
                                      </a>
                                    </li>
                                  )}
                                </ul>
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900 mb-1">内容</h4>
                                <p className="text-gray-600 whitespace-pre-wrap">
                                  {notification.content}
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 flex justify-end">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(notification);
                                }}
                                className="text-blue-600 hover:text-blue-900 inline-flex items-center mr-4"
                              >
                                <HiPencil className="h-4 w-4 mr-1" />
                                編集
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirm(notification.id);
                                }}
                                className="text-red-600 hover:text-red-900 inline-flex items-center"
                              >
                                <HiTrash className="h-4 w-4 mr-1" />
                                削除
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                    お知らせが見つかりません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* 削除確認モーダル */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4 text-red-500">
              <HiTrash className="h-6 w-6 mr-2" />
              <h3 className="text-lg font-medium">お知らせ削除の確認</h3>
            </div>
            <p className="mb-4">
              このお知らせを削除しますか？
              <br />
              この操作は元に戻せません。
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={!!deletingId}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={!!deletingId}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                {deletingId === deleteConfirm ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    削除中...
                  </>
                ) : (
                  <>
                    <HiTrash className="mr-2 h-4 w-4 inline" />
                    削除する
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}