// app/dashboard/corporate/users/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { HiUserAdd, HiPencil, HiTrash, HiDownload, HiUpload } from 'react-icons/hi';
import { toast } from 'react-hot-toast';

// ユーザー情報の型定義
interface User {
  id: string;
  name: string | null;
  email: string;
  corporateRole: string | null;
  position: string | null;
  department: {
    id: string;
    name: string;
  } | null;
}

// 部署情報の型定義
interface Department {
  id: string;
  name: string;
}

// テナント情報の型定義
interface TenantData {
  id: string;
  name: string;
  maxUsers: number;
  users: User[];
  departments: Department[];
}

export default function CorporateUsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // テナント情報を取得
  useEffect(() => {
    const fetchTenantData = async () => {
      if (!session?.user?.id) return;

      try {
        setIsLoading(true);

        // テナント情報取得API
        const response = await fetch('/api/corporate/tenant');

        if (!response.ok) {
          throw new Error('テナント情報の取得に失敗しました');
        }

        const data = await response.json();
        setTenantData(data.tenant);
        setUsers(data.tenant.users);
        setDepartments(data.tenant.departments);
        setIsAdmin(data.userRole === 'admin');
        setError(null);
      } catch (err) {
        console.error('テナント情報取得エラー:', err);
        setError('テナント情報を読み込めませんでした');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenantData();
  }, [session]);

  // 検索フィルター
  const filteredUsers = users.filter(
    (user) =>
      (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.position && user.position.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.department && user.department.name.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  // ユーザー削除処理（モック）
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('このユーザーを削除してもよろしいですか？この操作は元に戻せません。')) return;

    try {
      // ここでAPIを呼び出す（実装予定）
      toast.success('ユーザーが削除されました');
      // 成功したら画面から削除
      setUsers(users.filter((user) => user.id !== userId));
    } catch (error) {
      console.error('ユーザー削除エラー:', error);
      toast.error('ユーザーの削除に失敗しました');
    }
  };

  // ユーザー招待処理（モック）
  const handleInviteUser = () => {
    router.push('/dashboard/corporate/users/invite');
  };

  // 読み込み中
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Spinner size="lg" />
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-red-800 mb-2">エラーが発生しました</h3>
        <p className="text-red-700">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          再読み込み
        </Button>
      </div>
    );
  }

  // テナントデータがない場合
  if (!tenantData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-yellow-800 mb-2">法人プランが有効ではありません</h3>
        <p className="text-yellow-700">法人プランにアップグレードしてこの機能をご利用ください。</p>
        <Button className="mt-4" onClick={() => router.push('/dashboard/subscription')}>
          プランを見る
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー部分 */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">ユーザー管理</h1>
          <p className="text-gray-500 mt-1">
            {users.length}/{tenantData.maxUsers} ユーザー
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleInviteUser}
                className="flex items-center"
              >
                <HiUserAdd className="mr-2 h-4 w-4" />
                ユーザーを招待
              </Button>
              <Button variant="outline" size="sm" className="flex items-center">
                <HiDownload className="mr-2 h-4 w-4" />
                CSVインポート
              </Button>
              <Button variant="outline" size="sm" className="flex items-center">
                <HiUpload className="mr-2 h-4 w-4" />
                CSVエクスポート
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 検索とフィルター */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="名前、メール、役職で検索..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <select className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">すべての部署</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>

            <select className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">すべての役割</option>
              <option value="admin">管理者</option>
              <option value="member">メンバー</option>
              <option value="restricted">制限付き</option>
            </select>
          </div>
        </div>
      </div>

      {/* ユーザーリスト */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  ユーザー
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  役職
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  部署
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  役割
                </th>
                {isAdmin && (
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    操作
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                          {user.name ? (
                            <span className="text-gray-600 font-medium">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          ) : (
                            <span className="text-gray-400">?</span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || '名前なし'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.position || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.department?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${
                          user.corporateRole === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : user.corporateRole === 'restricted'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {user.corporateRole === 'admin'
                          ? '管理者'
                          : user.corporateRole === 'restricted'
                            ? '制限付き'
                            : 'メンバー'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <HiPencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-800"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <HiTrash className="h-4 w-4" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="px-6 py-10 text-center text-gray-500">
                    {searchTerm
                      ? '検索結果が見つかりませんでした'
                      : 'ユーザーがいません。「ユーザーを招待」ボタンから追加してください'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}