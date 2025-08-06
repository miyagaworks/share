// app/dashboard/admin/email/page.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from 'react-hot-toast';
import {
  HiOutlineMail,
  HiOutlineInformationCircle,
  HiOutlineClipboardList,
  HiOutlineTrash,
  HiOutlineSearch,
  HiOutlineUser,
} from 'react-icons/hi';
import { getPagePermissions, ReadOnlyBanner } from '@/lib/utils/admin-permissions';

// AdminAccess型定義
interface AdminAccess {
  isSuperAdmin: boolean;
  isFinancialAdmin: boolean;
  adminLevel: 'super' | 'financial' | 'none';
}

// ユーザー検索モーダル用の型
interface User {
  id: string;
  name: string | null;
  email: string;
}

// メール履歴の型定義
interface EmailHistory {
  id: string;
  subject: string;
  targetGroup: string;
  sentCount: number;
  failCount: number;
  sentAt: string;
  sender?: {
    name: string | null;
    email: string;
  };
}

export default function AdminEmailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminAccess, setAdminAccess] = useState<AdminAccess | null>(null);
  const [sending, setSending] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [emailHistory, setEmailHistory] = useState<EmailHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // ユーザー検索関連の状態
  const [showUserSearchModal, setShowUserSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    subject: '',
    title: '',
    message: '',
    targetGroup: 'all',
    ctaText: '',
    ctaUrl: '',
    userId: '', // 個別ユーザーID
  });

  // ターゲットグループオプション
  const targetGroups = [
    { value: 'all', label: '全ユーザー' },
    { value: 'active', label: 'アクティブユーザー' },
    { value: 'trial', label: 'トライアルユーザー' },
    { value: 'permanent', label: '永久利用権ユーザー' },
    { value: 'individual', label: '個人プランユーザー（すべて）' },
    { value: 'individual_monthly', label: '個人プラン（月更新）' },
    { value: 'individual_yearly', label: '個人プラン（年更新）' },
    { value: 'corporate', label: '法人プランユーザー（管理者のみ）' },
    { value: 'corporate_monthly', label: '法人プラン（月更新）' },
    { value: 'corporate_yearly', label: '法人プラン（年更新）' },
    { value: 'inactive', label: '非アクティブユーザー' },
    { value: 'expired', label: '利用期限切れユーザー' },
    { value: 'single_user', label: '特定のユーザー' },
  ];

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
        } else {
          router.push('/dashboard');
        }
      } catch {
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [session, router]);

  // 🆕 権限設定の取得
  const permissions = adminAccess
    ? getPagePermissions(adminAccess.isSuperAdmin ? 'admin' : 'financial-admin', 'email')
    : { canView: false, canEdit: false, canDelete: false, canCreate: false };

  // 入力フォームの変更ハンドラ
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // ターゲットグループが変更されたとき、single_user以外に変更された場合はselectedUserをクリア
    if (name === 'targetGroup' && value !== 'single_user') {
      setSelectedUser(null);
      setFormData((prev) => ({ ...prev, userId: '' }));
    }
  };

  // ユーザー検索の実行
  const searchUsers = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const response = await fetch(
        `/api/admin/users/search?query=${encodeURIComponent(searchQuery)}`,
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
      } else {
        toast.error('ユーザー検索に失敗しました');
      }
    } catch {
      toast.error('ユーザーの検索中にエラーが発生しました');
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery]);

  // ユーザー選択ハンドラ
  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setFormData((prev) => ({ ...prev, userId: user.id }));
    setShowUserSearchModal(false);
  };

  // 送信履歴の取得
  const fetchEmailHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch('/api/admin/email/history');
      if (response.ok) {
        const data = await response.json();
        setEmailHistory(data.history || []);
      } else {
        toast.error('送信履歴の取得に失敗しました');
      }
    } catch {
      toast.error('送信履歴の取得中にエラーが発生しました');
    } finally {
      setHistoryLoading(false);
    }
  };

  // メール送信ハンドラ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 権限チェック
    if (!permissions.canCreate) {
      toast.error('メール送信にはスーパー管理者権限が必要です');
      return;
    }

    // すでに送信中なら処理をスキップ
    if (sending) return;

    // 特定ユーザー選択時にユーザーIDがない場合はエラー
    if (formData.targetGroup === 'single_user' && !formData.userId) {
      toast.error('ユーザーを選択してください');
      return;
    }

    setSending(true);
    try {
      // 冪等性キーを生成
      const idempotencyKey = crypto.randomUUID();
      const response = await fetch('/api/admin/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        // 成功の場合
        toast.success(`メールを送信しました（${data.sentCount}/${data.totalCount}件成功）`);
        // 失敗したメールがある場合は通知
        if (data.failCount > 0) {
          toast(
            `⚠️ ${data.failCount}件のメールは送信できませんでした。詳細はコンソールをご確認ください。`,
          );
        }
        // フォームをリセット
        setFormData({
          subject: '',
          title: '',
          message: '',
          targetGroup: 'all',
          ctaText: '',
          ctaUrl: '',
          userId: '',
        });
        setSelectedUser(null);
        // 履歴を更新
        if (showHistory) {
          fetchEmailHistory();
        }
      } else {
        // エラーの場合
        toast.error(data.error || 'メール送信に失敗しました');
      }
    } catch {
      toast.error('処理中にエラーが発生しました。ネットワーク接続を確認してください。');
    } finally {
      setSending(false);
    }
  };

  // 単一の履歴を削除するハンドラ
  const handleDeleteHistory = async (id: string) => {
    if (!permissions.canDelete) {
      toast.error('履歴削除にはスーパー管理者権限が必要です');
      return;
    }

    if (!confirm('この送信履歴を削除しますか？')) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/admin/email/history/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        toast.success('送信履歴を削除しました');
        // 履歴を再取得
        fetchEmailHistory();
      } else {
        const data = await response.json();
        toast.error(data.error || '送信履歴の削除に失敗しました');
      }
    } catch {
      toast.error('送信履歴の削除中にエラーが発生しました');
    } finally {
      setDeletingId(null);
    }
  };

  // 履歴の選択状態を切り替えるハンドラ
  const handleToggleSelectHistory = (id: string) => {
    setSelectedHistoryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // 選択した履歴を一括削除するハンドラ
  const handleBulkDelete = async () => {
    if (!permissions.canDelete) {
      toast.error('履歴削除にはスーパー管理者権限が必要です');
      return;
    }

    if (selectedHistoryIds.length === 0) {
      toast.error('削除する履歴を選択してください');
      return;
    }

    if (!confirm(`選択した${selectedHistoryIds.length}件の送信履歴を削除しますか？`)) {
      return;
    }

    setBulkDeleting(true);
    try {
      const response = await fetch('/api/admin/email/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedHistoryIds }),
      });
      if (response.ok) {
        const data = await response.json();
        toast.success(`${data.deletedCount}件の送信履歴を削除しました`);
        // 選択をクリア
        setSelectedHistoryIds([]);
        // 履歴を再取得
        fetchEmailHistory();
      } else {
        const data = await response.json();
        toast.error(data.error || '送信履歴の一括削除に失敗しました');
      }
    } catch {
      toast.error('送信履歴の一括削除中にエラーが発生しました');
    } finally {
      setBulkDeleting(false);
    }
  };

  // ターゲットグループの表示名を取得
  const getTargetGroupLabel = (value: string) => {
    const group = targetGroups.find((g) => g.value === value);
    return group ? group.label : value;
  };

  // 日付フォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-2 text-gray-500">権限を確認中...</p>
        </div>
      </div>
    );
  }

  if (!adminAccess) {
    return null; // リダイレクト処理中は表示なし
  }

  return (
    <div className="max-w-[90vw] mx-auto px-4">
      {/* 🆕 権限バナー表示 */}
      <ReadOnlyBanner message={permissions.readOnlyMessage} />

      {/* メール送信フォーム */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 sm:p-8 mb-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <HiOutlineMail className="h-6 w-6 text-blue-600 mr-4" />
            <div>
              <h1 className="text-2xl font-bold">メール配信</h1>
              {/* 🆕 権限バッジ表示 */}
              <div className="mt-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium inline-block">
                {adminAccess.isSuperAdmin ? 'スーパー管理者' : '財務管理者'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowHistory(!showHistory);
              if (!showHistory && emailHistory.length === 0) {
                fetchEmailHistory();
              }
            }}
            className="inline-flex items-center px-4 py-2 text-base font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <HiOutlineClipboardList className="mr-2 h-5 w-5" />
            {showHistory ? '履歴を非表示' : '送信履歴を表示'}
          </button>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-5 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <HiOutlineInformationCircle className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-base text-yellow-700">
                このページからユーザーグループにメールを送信できます。すべてのユーザーに届くため、内容を十分確認してから送信してください。
              </p>
            </div>
          </div>
        </div>

        {/* 送信履歴セクション */}
        {showHistory && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">送信履歴</h2>
              {/* 🆕 権限に応じて一括削除ボタンを制御 */}
              {selectedHistoryIds.length > 0 && permissions.canDelete && (
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                  className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {bulkDeleting ? (
                    <Spinner size="sm" className="mr-2" />
                  ) : (
                    <HiOutlineTrash className="mr-1 h-4 w-4" />
                  )}
                  選択した{selectedHistoryIds.length}件を削除
                </button>
              )}
            </div>

            {historyLoading ? (
              <div className="flex justify-center items-center py-8">
                <Spinner size="md" />
                <p className="ml-3 text-gray-500">履歴を読み込み中...</p>
              </div>
            ) : emailHistory.length === 0 ? (
              <div className="bg-gray-50 rounded-md p-5 text-center text-gray-500">
                <p>送信履歴はありません</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {/* 🆕 権限に応じてチェックボックス列を制御 */}
                      {permissions.canDelete && (
                        <th scope="col" className="px-4 py-3 w-10">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            checked={
                              selectedHistoryIds.length === emailHistory.length &&
                              emailHistory.length > 0
                            }
                            onChange={() => {
                              if (selectedHistoryIds.length === emailHistory.length) {
                                setSelectedHistoryIds([]);
                              } else {
                                setSelectedHistoryIds(emailHistory.map((h) => h.id));
                              }
                            }}
                          />
                        </th>
                      )}
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-base font-medium text-gray-500"
                      >
                        件名
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-base font-medium text-gray-500"
                      >
                        送信対象
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-base font-medium text-gray-500"
                      >
                        送信数
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-base font-medium text-gray-500"
                      >
                        送信日時
                      </th>
                      {/* 🆕 権限に応じて操作列を制御 */}
                      {permissions.canDelete && (
                        <th
                          scope="col"
                          className="px-6 py-3 w-16 text-right text-base font-medium text-gray-500"
                        >
                          操作
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {emailHistory.map((history) => (
                      <tr key={history.id} className="hover:bg-gray-50">
                        {/* 🆕 権限に応じてチェックボックス列を制御 */}
                        {permissions.canDelete && (
                          <td className="px-4 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              checked={selectedHistoryIds.includes(history.id)}
                              onChange={() => handleToggleSelectHistory(history.id)}
                            />
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-base text-gray-900">
                          {history.subject}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-base text-gray-900">
                          {getTargetGroupLabel(history.targetGroup)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-base text-gray-900">
                          {history.sentCount}
                          {history.failCount > 0 && (
                            <span className="text-red-500 ml-2">(失敗: {history.failCount})</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-base text-gray-900">
                          {formatDate(history.sentAt)}
                        </td>
                        {/* 🆕 権限に応じて削除ボタンを制御 */}
                        {permissions.canDelete && (
                          <td className="px-6 py-4 whitespace-nowrap text-base text-gray-900 text-right">
                            <button
                              onClick={() => handleDeleteHistory(history.id)}
                              className="text-red-600 hover:text-red-900 p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                              disabled={deletingId === history.id}
                            >
                              {deletingId === history.id ? (
                                <Spinner size="sm" />
                              ) : (
                                <HiOutlineTrash className="h-5 w-5" />
                              )}
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 🆕 権限に応じてメール送信フォームを表示 */}
        {permissions.canCreate ? (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label
                htmlFor="targetGroup"
                className="block text-base font-medium text-gray-700 mb-2"
              >
                送信対象
              </label>
              <select
                id="targetGroup"
                name="targetGroup"
                value={formData.targetGroup}
                onChange={handleChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-3 text-base"
                required
              >
                {targetGroups.map((group) => (
                  <option key={group.value} value={group.value}>
                    {group.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 特定ユーザー選択フィールド */}
            {formData.targetGroup === 'single_user' && (
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  ユーザーを選択
                </label>
                <div className="flex items-center">
                  <div
                    className={`flex-1 p-3 border ${selectedUser ? 'border-green-300 bg-green-50' : 'border-gray-300'} rounded-md`}
                  >
                    {selectedUser ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{selectedUser.name || '名前なし'}</div>
                          <div className="text-sm text-gray-500">{selectedUser.email}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUser(null);
                            setFormData((prev) => ({ ...prev, userId: '' }));
                          }}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <HiOutlineTrash className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-gray-500">ユーザーが選択されていません</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowUserSearchModal(true)}
                    className="ml-3 inline-flex items-center px-4 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <HiOutlineSearch className="mr-2 h-5 w-5" />
                    ユーザー検索
                  </button>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="subject" className="block text-base font-medium text-gray-700 mb-2">
                件名
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-3 text-base"
                placeholder="メールの件名"
                required
              />
            </div>

            <div>
              <label htmlFor="title" className="block text-base font-medium text-gray-700 mb-2">
                タイトル
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-3 text-base"
                placeholder="メール本文内のタイトル"
                required
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-base font-medium text-gray-700 mb-2">
                本文
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={8}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-3 text-base"
                placeholder="メールの本文"
                required
              />
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-700 mb-4">
                Call To Action（オプション）
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="ctaText"
                    className="block text-base font-medium text-gray-700 mb-2"
                  >
                    CTAボタンテキスト
                  </label>
                  <input
                    type="text"
                    id="ctaText"
                    name="ctaText"
                    value={formData.ctaText}
                    onChange={handleChange}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-3 text-base"
                    placeholder="今すぐ確認する"
                  />
                </div>
                <div>
                  <label
                    htmlFor="ctaUrl"
                    className="block text-base font-medium text-gray-700 mb-2"
                  >
                    CTAリンクURL
                  </label>
                  <input
                    type="url"
                    id="ctaUrl"
                    name="ctaUrl"
                    value={formData.ctaUrl}
                    onChange={handleChange}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-3 text-base"
                    placeholder="https://app.sns-share.com/dashboard"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={sending || (formData.targetGroup === 'single_user' && !formData.userId)}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <>
                    <Spinner size="sm" className="mr-3" />
                    送信中...
                  </>
                ) : (
                  <>
                    <HiOutlineMail className="mr-3 h-5 w-5" />
                    メールを送信する
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-8">
            <HiOutlineMail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">メール送信は閲覧のみです</h3>
            <p className="text-gray-600">メール送信機能はスーパー管理者権限が必要です</p>
          </div>
        )}
      </div>

      {/* ユーザー検索モーダル */}
      {showUserSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">ユーザー検索</h3>
              <button
                onClick={() => setShowUserSearchModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                ✕
              </button>
            </div>
            <div className="mb-4">
              <div className="flex items-center">
                <input
                  type="text"
                  placeholder="名前またはメールアドレスで検索..."
                  className="w-full border-gray-300 rounded-l-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-3 text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                />
                <button
                  onClick={searchUsers}
                  disabled={searchLoading}
                  className="inline-flex items-center px-4 py-3 border border-l-0 border-gray-300 bg-gray-50 text-gray-700 rounded-r-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {searchLoading ? <Spinner size="sm" /> : <HiOutlineSearch className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {searchResults.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {searchResults.map((user) => (
                    <li key={user.id} className="py-3 hover:bg-gray-50">
                      <button
                        onClick={() => handleSelectUser(user)}
                        className="w-full text-left flex items-center p-2 rounded hover:bg-blue-50"
                      >
                        <div className="bg-blue-100 rounded-full p-2 mr-3">
                          <HiOutlineUser className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name || '名前なし'}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : searchQuery && !searchLoading ? (
                <div className="text-center py-4 text-gray-500">ユーザーが見つかりませんでした</div>
              ) : !searchQuery ? (
                <div className="text-center py-4 text-gray-500">
                  ユーザー名またはメールアドレスを入力して検索してください
                </div>
              ) : null}
              {searchLoading && (
                <div className="flex justify-center items-center py-4">
                  <Spinner size="md" />
                  <p className="ml-3 text-gray-500">検索中...</p>
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowUserSearchModal(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}