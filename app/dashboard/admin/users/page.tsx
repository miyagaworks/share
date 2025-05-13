// app/dashboard/admin/users/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { HiSearch, HiRefresh, HiCheck, HiX } from 'react-icons/hi';

// ユーザー情報の型定義
interface UserData {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  isPermanentUser: boolean;
  subscription: {
    status: string;
    plan: string;
  } | null;
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

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
      }
    } catch (error) {
      console.error('ユーザー一覧取得エラー:', error);
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
        // 成功したら一覧を再取得
        fetchUsers();
      } else {
        console.error('永久利用権の更新に失敗しました');
      }
    } catch (error) {
      console.error('永久利用権の更新エラー:', error);
    }
  };

  // 検索結果のフィルタリング
  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
        <h1 className="text-2xl font-bold mb-4">ユーザー管理</h1>

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

          <Button onClick={fetchUsers}>
            <HiRefresh className="mr-2 h-4 w-4" />
            更新
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ユーザー
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  メールアドレス
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  登録日
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  プラン状態
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
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name || '未設定'}</div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                    </div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.subscription?.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.subscription?.status || 'なし'}
                    </span>
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
                  <td className="py-4 px-4 whitespace-nowrap text-right text-sm font-medium">
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