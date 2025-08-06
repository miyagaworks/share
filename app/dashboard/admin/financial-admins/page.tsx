// app/dashboard/admin/financial-admins/page.tsx (財務管理者権限対応修正版)
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Spinner } from '@/components/ui/Spinner';
import Image from 'next/image';
import {
  HiUserGroup,
  HiPlus,
  HiTrash,
  HiSearch,
  HiExclamationCircle,
  HiCheckCircle,
  HiInformationCircle,
  HiShieldCheck,
} from 'react-icons/hi';
import { getPagePermissions, ReadOnlyBanner } from '@/lib/utils/admin-permissions';

// AdminAccess型定義
interface AdminAccess {
  isSuperAdmin: boolean;
  isFinancialAdmin: boolean;
  adminLevel: 'super' | 'financial' | 'none';
}

interface FinancialAdmin {
  id: string;
  userId: string;
  addedAt: string;
  isActive: boolean;
  notes: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  addedByUser: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

export default function FinancialAdminsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminAccess, setAdminAccess] = useState<AdminAccess | null>(null);
  const [financialAdmins, setFinancialAdmins] = useState<FinancialAdmin[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // メッセージ表示関数
  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }, []);

  // 財務管理者一覧取得
  const loadFinancialAdmins = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/financial-admins');
      if (response.ok) {
        const data = await response.json();
        setFinancialAdmins(data.data || []);
      }
    } catch (error) {
      console.error('財務管理者一覧取得エラー:', error);
      showMessage('error', '財務管理者一覧の取得に失敗しました');
    }
  }, [showMessage]);

  // 🔧 修正: 財務管理者も許可する権限チェック
  const checkPermissionAndLoadData = useCallback(async () => {
    if (!session?.user?.id) {
      router.push('/auth/signin');
      return;
    }

    try {
      // 権限チェック
      const accessResponse = await fetch('/api/admin/access');
      const accessData = await accessResponse.json();

      // スーパー管理者または財務管理者の場合アクセス許可
      if (accessData.adminLevel !== 'none') {
        setAdminAccess({
          isSuperAdmin: accessData.isSuperAdmin,
          isFinancialAdmin: accessData.isFinancialAdmin,
          adminLevel: accessData.adminLevel,
        });
        await loadFinancialAdmins();
      } else {
        router.push('/dashboard');
        return;
      }
    } catch (error) {
      console.error('権限チェックエラー:', error);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [session, router, loadFinancialAdmins]);

  // 🆕 権限設定の取得
  const permissions = adminAccess
    ? getPagePermissions(adminAccess.isSuperAdmin ? 'admin' : 'financial-admin', 'financial-admins')
    : { canView: false, canEdit: false, canDelete: false, canCreate: false };

  // ユーザー検索
  const searchUsers = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);
      try {
        const response = await fetch(`/api/admin/users/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          // 既に財務管理者のユーザーを除外
          const existingIds = financialAdmins.map((fa) => fa.userId);
          const filteredResults = (data.users || []).filter(
            (user: User) => !existingIds.includes(user.id),
          );
          setSearchResults(filteredResults);
        }
      } catch (error) {
        console.error('ユーザー検索エラー:', error);
        showMessage('error', 'ユーザー検索に失敗しました');
      } finally {
        setSearchLoading(false);
      }
    },
    [financialAdmins, showMessage],
  );

  // 財務管理者追加
  const addFinancialAdmin = async () => {
    if (!selectedUser || !permissions.canCreate) return;

    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/financial-admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          notes: notes.trim() || null,
        }),
      });

      if (response.ok) {
        showMessage('success', '財務管理者を追加しました');
        setIsAddModalOpen(false);
        setSelectedUser(null);
        setNotes('');
        setSearchTerm('');
        setSearchResults([]);
        await loadFinancialAdmins();
      } else {
        const errorData = await response.json();
        showMessage('error', errorData.error || '財務管理者の追加に失敗しました');
      }
    } catch (error) {
      console.error('財務管理者追加エラー:', error);
      showMessage('error', '財務管理者の追加に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  // 財務管理者削除
  const removeFinancialAdmin = async (userId: string, userName: string) => {
    if (!permissions.canDelete) return;

    if (!confirm(`${userName || 'このユーザー'}の財務管理者権限を削除しますか？`)) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/financial-admins', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        showMessage('success', '財務管理者権限を削除しました');
        await loadFinancialAdmins();
      } else {
        const errorData = await response.json();
        showMessage('error', errorData.error || '財務管理者の削除に失敗しました');
      }
    } catch (error) {
      console.error('財務管理者削除エラー:', error);
      showMessage('error', '財務管理者の削除に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  // 初期化処理
  useEffect(() => {
    checkPermissionAndLoadData();
  }, [checkPermissionAndLoadData]);

  // 検索の遅延実行
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm && isAddModalOpen) {
        searchUsers(searchTerm);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, isAddModalOpen, searchUsers]);

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
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* 🆕 権限バナー表示 */}
      <ReadOnlyBanner message={permissions.readOnlyMessage} />

      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-lg p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <HiUserGroup className="h-8 w-8 mr-3" />
            <div>
              <h1 className="text-2xl font-bold">財務管理者管理</h1>
              <p className="mt-1 opacity-90">財務管理者の追加・削除・管理を行います</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* 🆕 権限バッジ表示 */}
            <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
              {adminAccess.isSuperAdmin ? 'スーパー管理者' : '財務管理者'}
            </div>
            {/* 🆕 権限に応じてボタンを制御 */}
            {permissions.canCreate && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <HiPlus className="h-5 w-5" />
                <span>財務管理者を追加</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 🔒 セキュリティ説明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <div className="flex items-start">
          <HiShieldCheck className="h-6 w-6 text-blue-500 mt-1 mr-3" />
          <div>
            <h3 className="font-semibold text-blue-800 mb-2">🔒 セキュアな権限管理</h3>
            <div className="text-blue-700 space-y-2">
              <p>
                <strong>明示的管理:</strong> スーパー管理者が手動で財務管理者を指定
              </p>
              <p>
                <strong>監査ログ:</strong> 追加・削除の履歴が完全に記録されます
              </p>
              <p>
                <strong>安全性:</strong> 自動権限付与は廃止し、セキュリティを強化
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* メッセージ */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <HiCheckCircle className="h-5 w-5" />
          ) : (
            <HiExclamationCircle className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* 財務管理者一覧 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">現在の財務管理者</h2>
          <p className="text-sm text-gray-600 mt-1">
            財務管理者権限を持つユーザーの一覧です（{financialAdmins.length}名）
          </p>
        </div>

        <div className="p-6">
          {financialAdmins.length === 0 ? (
            <div className="text-center py-8">
              <HiInformationCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">財務管理者が登録されていません</p>
              {permissions.canCreate && (
                <p className="text-sm text-gray-400 mt-1">
                  「財務管理者を追加」ボタンから追加してください
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {financialAdmins.map((admin) => (
                <div key={admin.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        {admin.user.image ? (
                          <Image
                            src={admin.user.image}
                            alt=""
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <span className="text-green-600 font-medium">
                            {admin.user.name?.[0] || admin.user.email[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {admin.user.name || '名前未設定'}
                        </h3>
                        <p className="text-sm text-gray-600">{admin.user.email}</p>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          <span>追加日: {new Date(admin.addedAt).toLocaleDateString('ja-JP')}</span>
                          <span>追加者: {admin.addedByUser.name || admin.addedByUser.email}</span>
                        </div>
                        {admin.notes && (
                          <p className="text-xs text-gray-600 mt-1 bg-gray-50 px-2 py-1 rounded">
                            メモ: {admin.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        アクティブ
                      </span>
                      {/* 🆕 権限に応じて削除ボタンを制御 */}
                      {permissions.canDelete && (
                        <button
                          onClick={() =>
                            removeFinancialAdmin(admin.userId, admin.user.name || admin.user.email)
                          }
                          disabled={actionLoading}
                          className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 disabled:opacity-50"
                          title="財務管理者権限を削除"
                        >
                          <HiTrash className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 🆕 権限に応じて追加モーダルを表示 */}
      {isAddModalOpen && permissions.canCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">財務管理者を追加</h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setSelectedUser(null);
                  setNotes('');
                  setSearchTerm('');
                  setSearchResults([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* ユーザー検索 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ユーザーを検索
                </label>
                <div className="relative">
                  <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="名前またはメールアドレスで検索"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* 検索結果 */}
                {searchLoading && (
                  <div className="mt-2 p-2 text-center text-gray-500">
                    <Spinner size="sm" />
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                    {searchResults.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          setSelectedUser(user);
                          setSearchResults([]);
                          setSearchTerm('');
                        }}
                        className="w-full p-3 text-left hover:bg-gray-50 flex items-center space-x-3 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          {user.image ? (
                            <Image
                              src={user.image}
                              alt=""
                              width={32}
                              height={32}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <span className="text-gray-600 text-sm">
                              {user.name?.[0] || user.email[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name || '名前未設定'}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 選択されたユーザー */}
              {selectedUser && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">選択されたユーザー:</p>
                  <div className="flex items-center space-x-3 mt-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      {selectedUser.image ? (
                        <Image
                          src={selectedUser.image}
                          alt=""
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <span className="text-green-600 text-sm">
                          {selectedUser.name?.[0] || selectedUser.email[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedUser.name || '名前未設定'}
                      </p>
                      <p className="text-sm text-gray-600">{selectedUser.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* メモ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">メモ（任意）</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="追加理由や注意事項など"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* ボタン */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setSelectedUser(null);
                    setNotes('');
                    setSearchTerm('');
                    setSearchResults([]);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={addFinancialAdmin}
                  disabled={!selectedUser || actionLoading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? <Spinner size="sm" /> : '追加'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}