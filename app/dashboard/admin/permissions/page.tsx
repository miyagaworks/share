// app/dashboard/admin/permissions/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import {
  HiKey,
  HiRefresh,
  HiCheck,
  HiX,
  HiSearch,
  HiSortAscending,
  HiSortDescending,
  HiClock,
  HiExclamationCircle,
  HiUsers,
  HiPlus,
} from 'react-icons/hi';
import { toast } from 'react-hot-toast';
import FixPermanentUsersButton from './fix-permanent-button';
import GrantPermanentAccess from '@/components/admin/GrantPermanentAccess';

// ユーザー情報の型定義
interface UserData {
  id: string;
  name: string | null;
  nameKana: string | null;
  email: string;
  createdAt: string;
  trialEndsAt?: string | null;
  trialDaysRemaining: number;
  isPermanentUser: boolean;
  subscriptionStatus: string | null;
  subscription?: {
    status: string;
    plan: string;
  } | null;
}

// 並び替えのタイプ
type SortType =
  | 'permanent_first'
  | 'trial_remaining_asc'
  | 'trial_remaining_desc'
  | 'nameKana_asc'
  | 'nameKana_desc'
  | 'email_asc'
  | 'email_desc'
  | 'created_asc'
  | 'created_desc';

export default function AdminPermissionsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [sortType, setSortType] = useState<SortType>('permanent_first');
  const [showGrantForm, setShowGrantForm] = useState(false);
  const [stats, setStats] = useState({
    totalCount: 0,
    trialUsersCount: 0,
    permanentUsersCount: 0,
  });

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
      } catch {
        router.push('/dashboard');
      }
    };

    checkAdminAccess();
  }, [session, router]);

  // ユーザー一覧の取得
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/permissions');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setStats({
          totalCount: data.totalCount || 0,
          trialUsersCount: data.trialUsersCount || 0,
          permanentUsersCount: data.permanentUsersCount || 0,
        });
      } else {
        toast.error('ユーザー一覧の取得に失敗しました');
      }
    } catch {
      toast.error('ユーザー情報の取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // 永久利用権の付与/解除
  const togglePermanentAccess = async (userId: string, isPermanent: boolean) => {
    try {
      const response = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          isPermanent,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);

        // 解除時に追加の警告がある場合は表示
        if (!isPermanent && data.warning) {
          // react-hot-toastでは単純にメッセージを表示
          setTimeout(() => {
            toast(data.warning, {
              duration: 6000,
              icon: '⚠️',
            });
          }, 1000);
        }

        // 成功したら一覧を再取得
        fetchUsers();
      } else {
        toast.error(data.error || '永久利用権の更新に失敗しました');
      }
    } catch {
      toast.error('処理中にエラーが発生しました');
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
      user.nameKana?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // ユーザーの並び替え
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    // 永久利用権所持ユーザーを優先
    if (sortType === 'permanent_first') {
      if (a.isPermanentUser && !b.isPermanentUser) return -1;
      if (!a.isPermanentUser && b.isPermanentUser) return 1;
      // 同じステータスならフリガナの順
      return (a.nameKana || '').localeCompare(b.nameKana || '');
    }

    // トライアル残日数（少ない順）
    if (sortType === 'trial_remaining_asc') {
      // 永久利用権ユーザーは最後に
      if (a.isPermanentUser && !b.isPermanentUser) return 1;
      if (!a.isPermanentUser && b.isPermanentUser) return -1;
      if (a.isPermanentUser && b.isPermanentUser) return 0;
      return a.trialDaysRemaining - b.trialDaysRemaining;
    }

    // トライアル残日数（多い順）
    if (sortType === 'trial_remaining_desc') {
      // 永久利用権ユーザーは最後に
      if (a.isPermanentUser && !b.isPermanentUser) return 1;
      if (!a.isPermanentUser && b.isPermanentUser) return -1;
      if (a.isPermanentUser && b.isPermanentUser) return 0;
      return b.trialDaysRemaining - a.trialDaysRemaining;
    }

    // 登録日の新しい順
    if (sortType === 'created_desc') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }

    // 登録日の古い順
    if (sortType === 'created_asc') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }

    // フリガナの昇順
    if (sortType === 'nameKana_asc') {
      return (a.nameKana || '').localeCompare(b.nameKana || '');
    }

    // フリガナの降順
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

  // トライアル残日数の表示用関数
  const getTrialStatusDisplay = (user: UserData) => {
    if (user.isPermanentUser) {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
          永久利用権
        </span>
      );
    }

    if (user.trialDaysRemaining <= 0) {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
          期限切れ
        </span>
      );
    }

    if (user.trialDaysRemaining <= 3) {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
          残り{user.trialDaysRemaining}日
        </span>
      );
    }

    return (
      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
        残り{user.trialDaysRemaining}日
      </span>
    );
  };

  // 日付フォーマット用のヘルパー関数
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return '未設定';
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

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

  return (
    <div className="max-w-[90vw] mx-auto px-4">
      {/* ヘッダー */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <HiKey className="h-6 w-6 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold">永久利用権管理</h1>
          </div>
          <Button onClick={() => setShowGrantForm(!showGrantForm)} className="flex items-center">
            <HiPlus className="mr-2 h-4 w-4" />
            {showGrantForm ? '付与フォームを閉じる' : '永久利用権を付与'}
          </Button>
        </div>

        {/* 統計情報表示 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <HiUsers className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-900">対象ユーザー数</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <HiClock className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-green-900">トライアル中</p>
                <p className="text-2xl font-bold text-green-600">{stats.trialUsersCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center">
              <HiKey className="h-5 w-5 text-purple-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-purple-900">永久利用権</p>
                <p className="text-2xl font-bold text-purple-600">{stats.permanentUsersCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 重要なお知らせ */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <HiExclamationCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>重要:</strong> 永久利用権はトライアル期間中のユーザーのみに付与できます。
                永久利用権を解除した場合、元のトライアル期間が過ぎている場合は7日間の猶予期間が設定されます。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 永久利用権付与フォーム */}
      {showGrantForm && (
        <div className="mb-6">
          <GrantPermanentAccess />
        </div>
      )}

      {/* ユーザー一覧 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
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
            {/* 修正ボタン */}
            <FixPermanentUsersButton />

            <div className="relative group">
              <Button variant="outline" className="flex items-center">
                <span className="mr-1">並び替え</span>
                {sortType.includes('asc') ? (
                  <HiSortAscending className="h-4 w-4" />
                ) : (
                  <HiSortDescending className="h-4 w-4" />
                )}
              </Button>
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10 border border-gray-200 hidden group-hover:block">
                <div className="py-1">
                  <button
                    className={`block px-4 py-2 text-sm text-left w-full hover:bg-gray-100 ${sortType === 'permanent_first' ? 'bg-gray-100 font-medium' : ''}`}
                    onClick={() => handleSort('permanent_first')}
                  >
                    永久利用権所持者優先
                  </button>
                  <button
                    className={`block px-4 py-2 text-sm text-left w-full hover:bg-gray-100 ${sortType === 'trial_remaining_asc' ? 'bg-gray-100 font-medium' : ''}`}
                    onClick={() => handleSort('trial_remaining_asc')}
                  >
                    トライアル残日数（少→多）
                  </button>
                  <button
                    className={`block px-4 py-2 text-sm text-left w-full hover:bg-gray-100 ${sortType === 'trial_remaining_desc' ? 'bg-gray-100 font-medium' : ''}`}
                    onClick={() => handleSort('trial_remaining_desc')}
                  >
                    トライアル残日数（多→少）
                  </button>
                  <button
                    className={`block px-4 py-2 text-sm text-left w-full hover:bg-gray-100 ${sortType === 'created_desc' ? 'bg-gray-100 font-medium' : ''}`}
                    onClick={() => handleSort('created_desc')}
                  >
                    登録日 (新→古)
                  </button>
                  <button
                    className={`block px-4 py-2 text-sm text-left w-full hover:bg-gray-100 ${sortType === 'nameKana_asc' ? 'bg-gray-100 font-medium' : ''}`}
                    onClick={() => handleSort('nameKana_asc')}
                  >
                    フリガナ (ア→ワ)
                  </button>
                  <button
                    className={`block px-4 py-2 text-sm text-left w-full hover:bg-gray-100 ${sortType === 'email_asc' ? 'bg-gray-100 font-medium' : ''}`}
                    onClick={() => handleSort('email_asc')}
                  >
                    メール (A→Z)
                  </button>
                </div>
              </div>
            </div>

            <Button onClick={fetchUsers}>
              <HiRefresh className="mr-2 h-4 w-4" />
              更新
            </Button>
          </div>
        </div>

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
                  トライアル状態
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  トライアル期限
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  永久利用権
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedUsers.map((user) => (
                <tr
                  key={user.id}
                  className={`hover:bg-gray-50 ${
                    user.isPermanentUser
                      ? 'bg-purple-50'
                      : user.trialDaysRemaining <= 3 && user.trialDaysRemaining > 0
                        ? 'bg-orange-50'
                        : user.trialDaysRemaining <= 0
                          ? 'bg-red-50'
                          : ''
                  }`}
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
                  <td className="py-4 px-4 whitespace-nowrap">{getTrialStatusDisplay(user)}</td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {user.isPermanentUser ? '永久利用' : formatDate(user.trialEndsAt)}
                    </div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    {user.isPermanentUser ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                        永久利用権あり
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        なし
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm font-medium">
                    {user.isPermanentUser ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => togglePermanentAccess(user.id, false)}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <HiX className="mr-2 h-4 w-4" />
                        永久利用権を解除
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => setShowGrantForm(true)}
                        disabled={user.trialDaysRemaining <= 0}
                        className={
                          user.trialDaysRemaining <= 0 ? 'opacity-50 cursor-not-allowed' : ''
                        }
                      >
                        <HiCheck className="mr-2 h-4 w-4" />
                        永久利用権を付与
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-6">
            <p className="text-gray-500">該当するユーザーが見つかりません</p>
            <p className="text-sm text-gray-400 mt-1">
              永久利用権管理ページには、トライアル期間中のユーザーと永久利用権ユーザーのみが表示されます。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}