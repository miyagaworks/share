// app/dashboard/admin/permissions/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import {
  HiRefresh,
  HiCheck,
  HiX,
  HiShieldCheck,
  HiSearch,
  HiSortAscending,
  HiSortDescending,
} from 'react-icons/hi';
import { toast } from 'react-hot-toast';

// ユーザー情報の型定義
interface UserData {
  id: string;
  name: string | null;
  nameKana: string | null; // フリガナ追加
  email: string;
  createdAt: string;
  isPermanentUser: boolean;
  isGracePeriodExpired?: boolean;
  subscriptionStatus: string | null;
}

// 並び替えのタイプ
type SortType =
  | 'created_asc'
  | 'created_desc'
  | 'nameKana_asc'
  | 'nameKana_desc'
  | 'email_asc'
  | 'email_desc'
  | 'permanent';

export default function AdminPermissionsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [sortType, setSortType] = useState<SortType>('permanent');

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
        console.error('管理者チェックエラー:', error);
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
        console.error('ユーザー一覧取得エラー');
        toast.error('ユーザー一覧の取得に失敗しました');
      }
    } catch (error) {
      console.error('ユーザー一覧取得エラー:', error);
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

      if (response.ok) {
        toast.success(isPermanent ? '永久利用権を付与しました' : '永久利用権を解除しました');
        // 成功したら一覧を再取得
        fetchUsers();
      } else {
        console.error('永久利用権の更新に失敗しました');
        toast.error('永久利用権の更新に失敗しました');
      }
    } catch (error) {
      console.error('永久利用権の更新エラー:', error);
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
    if (sortType === 'permanent') {
      if (a.isPermanentUser && !b.isPermanentUser) return -1;
      if (!a.isPermanentUser && b.isPermanentUser) return 1;

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
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-center mb-6">
          <HiShieldCheck className="h-6 w-6 text-blue-600 mr-3" />
          <h1 className="text-2xl font-bold">権限管理</h1>
        </div>

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
                      className={`block px-4 py-2 text-sm text-left w-full hover:bg-gray-100 ${sortType === 'permanent' ? 'bg-gray-100 font-medium' : ''}`}
                      onClick={() => handleSort('permanent')}
                    >
                      永久利用権所持者優先
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
                  現在の状態
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
                      ? 'bg-blue-50'
                      : user.isGracePeriodExpired
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
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {user.subscriptionStatus === 'permanent'
                        ? '永久利用権'
                        : user.subscriptionStatus === 'grace_period_expired'
                          ? '猶予期間終了'
                          : user.subscriptionStatus || '通常'}
                    </div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    {user.isPermanentUser ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
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
                      >
                        <HiX className="mr-2 h-4 w-4 text-red-500" />
                        永久利用権を解除
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => togglePermanentAccess(user.id, true)}>
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
          </div>
        )}
      </div>
    </div>
  );
}