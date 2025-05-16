// app/dashboard/admin/notifications/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import {
  HiBell,
  HiPlus,
  HiPencil,
  HiTrash,
  HiRefresh,
  HiSearch,
} from 'react-icons/hi';
import { toast } from 'react-hot-toast';

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

export default function AdminNotificationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // フォーム状態
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<NotificationFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // 削除確認状態
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      } catch (error) {
        console.error('管理者チェックエラー:', error);
        router.push('/dashboard');
      }
    };

    checkAdminAccess();
  }, [session, router]);

  // お知らせ一覧取得
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      } else {
        console.error('お知らせ一覧取得エラー');
        toast.error('お知らせ一覧の取得に失敗しました');
      }
    } catch (error) {
      console.error('お知らせ一覧取得エラー:', error);
      toast.error('お知らせ情報の取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
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
        await response.json(); // 応答を読み込むだけで変数に割り当てない
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
    } catch (error) {
      console.error('お知らせ保存エラー:', error);
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
    } catch (error) {
      console.error('お知らせ削除エラー:', error);
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

  // 検索フィルター
  const filteredNotifications = notifications.filter(
    (notification) =>
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.content.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-center mb-6">
          <HiBell className="h-6 w-6 text-blue-600 mr-3" />
          <h1 className="text-2xl font-bold">お知らせ管理</h1>
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
            <Button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
              }}
            >
              <HiPlus className="mr-2 h-4 w-4" />
              新規作成
            </Button>
            <Button variant="outline" onClick={fetchNotifications}>
              <HiRefresh className="mr-2 h-4 w-4" />
              更新
            </Button>
          </div>
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelForm}
                  disabled={formSubmitting}
                >
                  キャンセル
                </Button>
                <Button type="submit" disabled={formSubmitting}>
                  {formSubmitting ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      保存中...
                    </>
                  ) : (
                    <>{editingId ? '更新' : '作成'}</>
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* お知らせ一覧テーブル */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  タイトル
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  タイプ
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  重要度
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  対象
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  表示期間
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => (
                  <tr key={notification.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{notification.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {notification.content}
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
                        {new Date(notification.startDate).toLocaleDateString('ja-JP')}
                        {notification.endDate &&
                          ` ～ ${new Date(notification.endDate).toLocaleDateString('ja-JP')}`}
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
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(notification)}
                        >
                          <HiPencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                          onClick={() => setDeleteConfirm(notification.id)}
                        >
                          <HiTrash className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
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
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
                disabled={!!deletingId}
              >
                キャンセル
              </Button>
              <Button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={!!deletingId}
                className="bg-red-600 hover:bg-red-700"
              >
                {deletingId === deleteConfirm ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    削除中...
                  </>
                ) : (
                  <>
                    <HiTrash className="mr-2 h-4 w-4" />
                    削除する
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}