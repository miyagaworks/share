// app/dashboard/admin/users/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import {
  HiUsers,
  HiSearch,
  HiRefresh,
  HiExclamationCircle,
  HiTrash,
  HiSortAscending,
  HiSortDescending,
} from 'react-icons/hi';
// ユーザー情報の型定義
interface UserData {
  id: string;
  name: string | null;
  nameKana: string | null;
  email: string;
  createdAt: string; // 登録日
  updatedAt: string; // 更新日（追加）
  isPermanentUser: boolean;
  isGracePeriodExpired?: boolean;
  trialEndsAt?: string | null;
  subscription: {
    status: string;
    plan: string;
    currentPeriodEnd?: string; // サブスクリプション期限（追加）
  } | null;
  subscriptionStatus: string;
}
// 法人管理者エラー詳細の型定義
interface CorporateAdminErrorDetails {
  message: string;
  details: string;
  userId: string;
}
// 並び替えのタイプ
type SortType =
  | 'created_asc'
  | 'created_desc'
  | 'nameKana_asc'
  | 'nameKana_desc'
  | 'email_asc'
  | 'email_desc'
  | 'grace_period';
export default function AdminUsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [sortType, setSortType] = useState<SortType>('grace_period');
  const [corporateAdminErrorDetails, setCorporateAdminErrorDetails] =
    useState<CorporateAdminErrorDetails | null>(null);
  // URLパラメータから削除アクションを確認
  useEffect(() => {
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    if (action === 'delete' && userId) {
      setDeleteConfirm(userId);
    }
  }, [searchParams]);
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
          fetchUsers();
        } else {
          router.push('/dashboard');
        }
      } catch (error) {
        router.push('/dashboard');
      }
    };
    checkAdminAccess();
  }, [session, router]);
  // ユーザー一覧の取得
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        toast.error('ユーザー一覧の取得に失敗しました');
      }
    } catch (error) {
      toast.error('ユーザー情報の取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };
  // ユーザー削除の実行
  const deleteUser = async (userId: string) => {
    setDeletingUser(userId);
    try {
      const response = await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || 'ユーザーを削除しました');
        // 削除確認をクリア
        setDeleteConfirm(null);
        // 一覧を再取得
        fetchUsers();
      } else {
        // エラーメッセージの表示を改善
        if (data.isCorporateAdmin) {
          // 法人プラン管理者のエラーの場合、より目立つエラー表示
          setDeleteConfirm(null); // 削除ダイアログを閉じる
          // 詳細なエラーメッセージのモーダルを表示
          setCorporateAdminErrorDetails({
            message: data.error || '法人プラン管理者は削除できません',
            details: data.details || '管理者権限を他のユーザーに移譲してから削除してください。',
            userId,
          });
        } else {
          // 通常のエラー
          toast.error(data.error || 'ユーザー削除に失敗しました');
        }
      }
    } catch (error) {
      toast.error('ユーザー削除中にエラーが発生しました');
    } finally {
      setDeletingUser(null);
    }
  };
  // 並び替え関数
  const handleSort = (type: SortType) => {
    setSortType(type);
  };
  // 検索結果のフィルタリング
  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  // ユーザーの並び替え
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    // 猶予期間切れユーザーを優先
    if (sortType === 'grace_period') {
      if (a.isGracePeriodExpired && !b.isGracePeriodExpired) return -1;
      if (!a.isGracePeriodExpired && b.isGracePeriodExpired) return 1;
      // 同じステータスならフリガナの順
      return (a.nameKana || '').localeCompare(b.nameKana || '');
    }
    // 登録日の新しい順
    if (sortType === 'created_desc') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    // 登録日の古い順
    if (sortType === 'created_asc') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    // フリガナの昇順（ア→ワ）
    if (sortType === 'nameKana_asc') {
      return (a.nameKana || '').localeCompare(b.nameKana || '');
    }
    // フリガナの降順（ワ→ア）
    if (sortType === 'nameKana_desc') {
      return (b.nameKana || '').localeCompare(a.nameKana || '');
    }
    // メールアドレスの昇順
    if (sortType === 'email_asc') {
      return a.email.localeCompare(b.email);
    }
    // メールアドレスの降順
    if (sortType === 'email_desc') {
      return b.email.localeCompare(a.email);
    }
    return 0;
  });
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-2 text-gray-500">ユーザー情報を読み込み中...</p>
        </div>
      </div>
    );
  }
  if (!isAdmin) {
    return null; // リダイレクト処理中は表示なし
  }
  // 日付フォーマット用のヘルパー関数
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return '未設定';
    return new Date(dateString).toLocaleDateString('ja-JP');
  };
  // サブスクリプション期限の表示用関数
  const getSubscriptionEndDate = (user: UserData) => {
    if (user.isPermanentUser) {
      return '永久利用';
    }
    if (user.subscription?.currentPeriodEnd) {
      const endDate = new Date(user.subscription.currentPeriodEnd);
      const today = new Date();
      // 期限切れの場合
      if (endDate < today) {
        return (
          <span className="text-red-500">
            {formatDate(user.subscription.currentPeriodEnd)} (期限切れ)
          </span>
        );
      }
      return formatDate(user.subscription.currentPeriodEnd);
    }
    if (user.trialEndsAt) {
      const trialEnd = new Date(user.trialEndsAt);
      const today = new Date();
      // トライアル期限切れの場合
      if (trialEnd < today) {
        return (
          <span className="text-red-500">{formatDate(user.trialEndsAt)} (トライアル期限切れ)</span>
        );
      }
      return `${formatDate(user.trialEndsAt)} (トライアル)`;
    }
    return '未設定';
  };
  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-center mb-4">
          <HiUsers className="h-6 w-6 text-blue-600 mr-3" />
          <h1 className="text-2xl font-bold">ユーザー管理</h1>
        </div>
        {/* 検索フィールドと操作ボタン */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <HiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="ユーザー検索..."
              className="pl-10 pr-3 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
            <div className="dropdown">
              <Button variant="outline" className="flex items-center">
                <span className="mr-1">並び替え</span>
                {sortType.includes('asc') ? (
                  <HiSortAscending className="h-4 w-4" />
                ) : (
                  <HiSortDescending className="h-4 w-4" />
                )}
                <div className="dropdown-content absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <div className="py-1">
                    <button
                      className={`block px-4 py-2 text-sm text-left w-full hover:bg-gray-100 ${sortType === 'grace_period' ? 'bg-gray-100 font-medium' : ''}`}
                      onClick={() => handleSort('grace_period')}
                    >
                      猶予期間切れ優先
                    </button>
                    <button
                      className={`block px-4 py-2 text-sm text-left w-full hover:bg-gray-100 ${sortType === 'created_desc' ? 'bg-gray-100 font-medium' : ''}`}
                      onClick={() => handleSort('created_desc')}
                    >
                      登録日 (新→古)
                    </button>
                    <button
                      className={`block px-4 py-2 text-sm text-left w-full hover:bg-gray-100 ${sortType === 'created_asc' ? 'bg-gray-100 font-medium' : ''}`}
                      onClick={() => handleSort('created_asc')}
                    >
                      登録日 (古→新)
                    </button>
                    <button
                      className={`block px-4 py-2 text-sm text-left w-full hover:bg-gray-100 ${sortType === 'nameKana_asc' ? 'bg-gray-100 font-medium' : ''}`}
                      onClick={() => handleSort('nameKana_asc')}
                    >
                      フリガナ (ア→ワ)
                    </button>
                    <button
                      className={`block px-4 py-2 text-sm text-left w-full hover:bg-gray-100 ${sortType === 'nameKana_desc' ? 'bg-gray-100 font-medium' : ''}`}
                      onClick={() => handleSort('nameKana_desc')}
                    >
                      フリガナ (ワ→ア)
                    </button>
                    <button
                      className={`block px-4 py-2 text-sm text-left w-full hover:bg-gray-100 ${sortType === 'email_asc' ? 'bg-gray-100 font-medium' : ''}`}
                      onClick={() => handleSort('email_asc')}
                    >
                      メール (A→Z)
                    </button>
                    <button
                      className={`block px-4 py-2 text-sm text-left w-full hover:bg-gray-100 ${sortType === 'email_desc' ? 'bg-gray-100 font-medium' : ''}`}
                      onClick={() => handleSort('email_desc')}
                    >
                      メール (Z→A)
                    </button>
                  </div>
                </div>
              </Button>
            </div>
            <Button onClick={fetchUsers}>
              <HiRefresh className="mr-2 h-4 w-4" />
              更新
            </Button>
          </div>
        </div>
        {/* 削除確認モーダル */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex items-center mb-4 text-red-500">
                <HiExclamationCircle className="h-6 w-6 mr-2" />
                <h3 className="text-lg font-medium">ユーザー削除の確認</h3>
              </div>
              <p className="mb-4">
                このユーザーを削除しますか？
                <br />
                この操作は元に戻せません。ユーザーのすべてのデータが削除されます。
              </p>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirm(null)}
                  disabled={!!deletingUser}
                >
                  キャンセル
                </Button>
                <Button
                  onClick={() => deleteUser(deleteConfirm)}
                  disabled={!!deletingUser}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deletingUser === deleteConfirm ? (
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
        {/* 法人プラン管理者エラーモーダル（新規追加） */}
        {corporateAdminErrorDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex items-center mb-4 text-red-500">
                <HiExclamationCircle className="h-7 w-7 mr-2" />
                <h3 className="text-lg font-medium">{corporateAdminErrorDetails.message}</h3>
              </div>
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <p className="text-sm text-red-700">{corporateAdminErrorDetails.details}</p>
              </div>
              <div className="mt-6">
                <p className="text-sm text-gray-600 mb-4">法人プランの管理者を削除するには：</p>
                <ul className="list-disc pl-5 text-sm text-gray-600 mb-4">
                  <li>別のメンバーを管理者に設定してください</li>
                  <li>または、サブスクリプションが終了するまでお待ちください</li>
                </ul>
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <Button variant="outline" onClick={() => setCorporateAdminErrorDetails(null)}>
                  閉じる
                </Button>
              </div>
            </div>
          </div>
        )}
        {/* ユーザーテーブル */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ユーザー
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  フリガナ
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  メールアドレス
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  登録日
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  更新日
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  プラン状態
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  利用期限
                </th>
                <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操 作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedUsers.map((user) => (
                <tr
                  key={user.id}
                  className={`hover:bg-gray-50 ${user.isGracePeriodExpired ? 'bg-red-50' : ''}`}
                >
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name || '未設定'}</div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.nameKana || '未設定'}</div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {formatDate(user.updatedAt)}
                    </div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    {user.isGracePeriodExpired ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        猶予期間終了
                      </span>
                    ) : user.isPermanentUser ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                        永久利用権
                      </span>
                    ) : user.subscription?.status === 'active' ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {user.subscription?.plan || '有効'}
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        {user.subscription?.status || 'なし'}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {getSubscriptionEndDate(user)}
                    </div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => setDeleteConfirm(user.id)}
                    >
                      <HiTrash className="mr-2 h-4 w-4" />
                      削除
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="text-center py-6">
            <p className="text-gray-500">該当するユーザーが見つかりません</p>
          </div>
        )}
      </div>
    </div>
  );
}