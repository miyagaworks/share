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
import Image from 'next/image';
import { getPagePermissions, ReadOnlyBanner } from '@/lib/utils/admin-permissions';

// AdminAccess型定義を追加
interface AdminAccess {
  isSuperAdmin: boolean;
  isFinancialAdmin: boolean;
  adminLevel: 'super' | 'financial' | 'none';
}

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
  const [adminAccess, setAdminAccess] = useState<AdminAccess | null>(null);
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

  // 🔧 修正: 財務管理者も許可する権限チェック
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!session?.user?.id) {
        router.push('/auth/signin');
        return;
      }

      try {
        const response = await fetch('/api/admin/access');
        const data = await response.json();

        // スーパー管理者または財務管理者の場合アクセス許可
        if (data.adminLevel !== 'none') {
          setAdminAccess({
            isSuperAdmin: data.isSuperAdmin,
            isFinancialAdmin: data.isFinancialAdmin,
            adminLevel: data.adminLevel,
          });
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

  // 🆕 権限設定の取得
  const permissions = adminAccess
    ? getPagePermissions(adminAccess.isSuperAdmin ? 'admin' : 'financial-admin', 'notifications')
    : { canView: false, canEdit: false, canDelete: false, canCreate: false };

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

  // フィルタリングとソート処理
  const applyFiltersAndSort = (
    notificationList: Notification[],
    filterConfig: FilterConfig,
    search: string,
    sort: SortConfig,
  ) => {
    let filtered = [...notificationList];

    // 検索フィルター
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (notification) =>
          notification.title.toLowerCase().includes(searchLower) ||
          notification.content.toLowerCase().includes(searchLower),
      );
    }

    // ステータスフィルター
    if (filterConfig.status !== 'all') {
      const now = new Date();
      filtered = filtered.filter((notification) => {
        switch (filterConfig.status) {
          case 'active':
            return notification.active;
          case 'inactive':
            return !notification.active;
          case 'upcoming':
            return new Date(notification.startDate) > now;
          case 'expired':
            return notification.endDate && new Date(notification.endDate) < now;
          default:
            return true;
        }
      });
    }

    // タイプフィルター
    if (filterConfig.type !== 'all') {
      filtered = filtered.filter((notification) => notification.type === filterConfig.type);
    }

    // 優先度フィルター
    if (filterConfig.priority !== 'all') {
      filtered = filtered.filter((notification) => notification.priority === filterConfig.priority);
    }

    // ソート処理
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sort.key) {
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'priority':
          aValue = a.priority;
          bValue = b.priority;
          break;
        case 'startDate':
          aValue = new Date(a.startDate);
          bValue = new Date(b.startDate);
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
      }

      if (sort.direction === 'asc') {
        if (aValue < bValue) return -1;
        if (aValue > bValue) return 1;
        return 0;
      } else {
        if (aValue > bValue) return -1;
        if (aValue < bValue) return 1;
        return 0;
      }
    });

    setFilteredNotifications(filtered);
  };

  // フィルターが変更された時の処理
  useEffect(() => {
    applyFiltersAndSort(notifications, filters, searchTerm, sortConfig);
  }, [notifications, filters, searchTerm, sortConfig]);

  // お知らせ作成・更新ハンドラ
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);

    try {
      const url = editingId
        ? `/api/admin/notifications/${editingId}`
        : '/api/admin/notifications/create';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingId ? 'お知らせを更新しました' : 'お知らせを作成しました');
        setShowForm(false);
        setFormData(initialFormData);
        setEditingId(null);
        fetchNotifications();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'お知らせの保存に失敗しました');
      }
    } catch {
      toast.error('保存中にエラーが発生しました');
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
      case 'corporate':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  if (!adminAccess) {
    return null; // リダイレクト処理中は表示なし
  }

  return (
    <div className="max-w-[95vw] mx-auto px-4">
      {/* 🆕 権限バナー表示 */}
      <ReadOnlyBanner message={permissions.readOnlyMessage} />

      {/* ヘッダー */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <HiBell className="h-6 w-6 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold">お知らせ管理</h1>
          </div>
          <div className="flex items-center space-x-4">
            {/* 🆕 権限バッジ表示 */}
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {adminAccess.isSuperAdmin ? 'スーパー管理者' : '財務管理者'}
            </div>
            {/* 🆕 権限に応じてボタンを制御 */}
            {permissions.canCreate && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <HiPlus className="mr-2 h-4 w-4" />
                {showForm ? 'フォームを閉じる' : '新規作成'}
              </button>
            )}
            <button
              onClick={fetchNotifications}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center"
            >
              <HiRefresh className="mr-2 h-4 w-4" />
              更新
            </button>
          </div>
        </div>

        {/* 統計情報表示 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900">総数</p>
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm font-medium text-green-900">有効</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-medium text-red-900">無効</p>
            <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm font-medium text-yellow-900">予約</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.upcoming}</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-900">期限切れ</p>
            <p className="text-2xl font-bold text-gray-600">{stats.expired}</p>
          </div>
        </div>

        {/* 検索・フィルターコントロール */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="relative">
            <HiSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="タイトル、内容で検索..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="all">全ステータス</option>
            <option value="active">有効</option>
            <option value="inactive">無効</option>
            <option value="upcoming">予約済み</option>
            <option value="expired">期限切れ</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          >
            <option value="all">全タイプ</option>
            <option value="announcement">お知らせ</option>
            <option value="maintenance">メンテナンス</option>
            <option value="feature">新機能</option>
            <option value="alert">アラート</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          >
            <option value="all">全優先度</option>
            <option value="high">高</option>
            <option value="normal">普通</option>
            <option value="low">低</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={`${sortConfig.key}_${sortConfig.direction}`}
            onChange={(e) => {
              const [key, direction] = e.target.value.split('_');
              setSortConfig({ key, direction });
            }}
          >
            <option value="createdAt_desc">作成日（新しい順）</option>
            <option value="createdAt_asc">作成日（古い順）</option>
            <option value="startDate_desc">開始日（新しい順）</option>
            <option value="startDate_asc">開始日（古い順）</option>
            <option value="title_asc">タイトル（昇順）</option>
            <option value="title_desc">タイトル（降順）</option>
          </select>
        </div>

        {/* 🆕 権限に応じてお知らせ作成フォームを表示 */}
        {showForm && permissions.canCreate && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingId ? 'お知らせ編集' : '新規お知らせ作成'}
            </h3>
            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    タイトル <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="お知らせのタイトルを入力"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">画像URL</label>
                  <input
                    type="url"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  内容 <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="お知らせの内容を入力してください"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">タイプ</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="announcement">お知らせ</option>
                    <option value="maintenance">メンテナンス</option>
                    <option value="feature">新機能</option>
                    <option value="alert">アラート</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">優先度</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="low">低</option>
                    <option value="normal">普通</option>
                    <option value="high">高</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">対象</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.targetGroup}
                    onChange={(e) => setFormData({ ...formData, targetGroup: e.target.value })}
                  >
                    <option value="all">全ユーザー</option>
                    <option value="active">有料ユーザー</option>
                    <option value="trial">トライアルユーザー</option>
                    <option value="corporate">法人ユーザー</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.active.toString()}
                    onChange={(e) =>
                      setFormData({ ...formData, active: e.target.value === 'true' })
                    }
                  >
                    <option value="true">有効</option>
                    <option value="false">無効</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    開始日 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">終了日</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {formSubmitting ? '保存中...' : editingId ? '更新' : '作成'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* お知らせ一覧 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  タイトル
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  タイプ・優先度
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  期間
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  作成日時
                </th>
                {/* 🆕 権限に応じて操作列を表示 */}
                {(permissions.canEdit || permissions.canDelete) && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredNotifications.map((notification) => (
                <Fragment key={notification.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <button
                          onClick={() =>
                            setExpandedId(expandedId === notification.id ? null : notification.id)
                          }
                          className="mr-2 text-gray-400 hover:text-gray-600"
                        >
                          {expandedId === notification.id ? (
                            <HiChevronUp className="h-4 w-4" />
                          ) : (
                            <HiChevronDown className="h-4 w-4" />
                          )}
                        </button>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            対象: {notification.targetGroup}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeBadgeClass(
                            notification.type,
                          )}`}
                        >
                          {notification.type}
                        </span>
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadgeClass(
                            notification.priority,
                          )}`}
                        >
                          {notification.priority}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        開始: {new Date(notification.startDate).toLocaleDateString('ja-JP')}
                      </div>
                      {notification.endDate && (
                        <div>
                          終了: {new Date(notification.endDate).toLocaleDateString('ja-JP')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          notification.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {notification.active ? '有効' : '無効'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: ja,
                      })}
                    </td>
                    {/* 🆕 権限に応じて操作ボタンを表示 */}
                    {(permissions.canEdit || permissions.canDelete) && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {permissions.canEdit && (
                          <button
                            onClick={() => handleEdit(notification)}
                            className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                          >
                            <HiPencil className="h-4 w-4 mr-1" />
                            編集
                          </button>
                        )}
                        {permissions.canDelete && (
                          <button
                            onClick={() => setDeleteConfirm(notification.id)}
                            className="text-red-600 hover:text-red-900 inline-flex items-center"
                          >
                            <HiTrash className="h-4 w-4 mr-1" />
                            削除
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                  {expandedId === notification.id && (
                    <tr>
                      <td
                        colSpan={permissions.canEdit || permissions.canDelete ? 6 : 5}
                        className="px-6 py-4 bg-gray-50"
                      >
                        <div className="text-sm text-gray-700">
                          <strong>内容:</strong>
                          <div className="mt-1 whitespace-pre-wrap">{notification.content}</div>
                          {notification.imageUrl && (
                            <div className="mt-2">
                              <strong>画像:</strong>
                              <div className="mt-1">
                                <Image
                                  src={notification.imageUrl}
                                  alt="お知らせ画像"
                                  width={300}
                                  height={200}
                                  className="max-w-xs h-auto rounded border"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {filteredNotifications.length === 0 && (
          <div className="text-center py-12">
            <HiBell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ||
              filters.status !== 'all' ||
              filters.type !== 'all' ||
              filters.priority !== 'all'
                ? '検索結果がありません'
                : 'お知らせがありません'}
            </h3>
            <p className="text-gray-500">
              {searchTerm ||
              filters.status !== 'all' ||
              filters.type !== 'all' ||
              filters.priority !== 'all'
                ? '検索条件を変更してお試しください'
                : 'まだお知らせが作成されていません'}
            </p>
          </div>
        )}
      </div>

      {/* 削除確認モーダル */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">お知らせを削除しますか？</h3>
            <p className="text-gray-600 mb-6">
              この操作は取り消せません。本当に削除してもよろしいですか？
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deletingId === deleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deletingId === deleteConfirm ? '削除中...' : '削除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}