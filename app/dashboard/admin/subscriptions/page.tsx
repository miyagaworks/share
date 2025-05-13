// app/dashboard/admin/subscriptions/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { HiRefresh, HiCreditCard } from 'react-icons/hi';
import { toast } from 'react-hot-toast';

// サブスクリプション情報の型定義
interface UserSubscription {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  trialEndsAt: string | null;
  subscription: {
    id: string;
    status: string;
    plan: string;
    currentPeriodEnd: string;
  } | null;
  subscriptionStatus: string | null;
}

export default function AdminSubscriptionsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserSubscription[]>([]);
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

  // ユーザーサブスクリプション一覧の取得
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/subscriptions');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        console.error('サブスクリプション一覧取得エラー');
        toast.error('サブスクリプション一覧の取得に失敗しました');
      }
    } catch (error) {
      console.error('サブスクリプション一覧取得エラー:', error);
      toast.error('サブスクリプション情報の取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-2 text-gray-500">サブスクリプション情報を読み込み中...</p>
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
          <HiCreditCard className="h-6 w-6 text-blue-600 mr-3" />
          <h1 className="text-2xl font-bold">サブスクリプション管理</h1>
        </div>

        <div className="flex justify-end mb-4">
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
                  プラン
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状態
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  次回更新日
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  特別ステータス
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name || '未設定'}</div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.subscription?.plan || 'なし'}</div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.subscription?.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : user.subscription?.status === 'trialing'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.subscription?.status || 'なし'}
                    </span>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {user.subscription?.currentPeriodEnd
                        ? new Date(user.subscription.currentPeriodEnd).toLocaleDateString('ja-JP')
                        : user.trialEndsAt
                          ? new Date(user.trialEndsAt).toLocaleDateString('ja-JP')
                          : 'なし'}
                    </div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    {user.subscriptionStatus === 'permanent' ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        永久利用権
                      </span>
                    ) : user.subscriptionStatus === 'grace_period_expired' ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        猶予期間終了
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        {user.subscriptionStatus || '通常'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-6">
            <p className="text-gray-500">サブスクリプション情報が見つかりません</p>
          </div>
        )}
      </div>
    </div>
  );
}