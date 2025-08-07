// app/dashboard/admin/subscriptions/page.tsx - 財務管理者対応版（権限バナー最上部）
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { getPagePermissions, ReadOnlyBanner } from '@/lib/utils/admin-permissions';
import {
  HiRefresh,
  HiCreditCard,
  HiSearch,
  HiSortAscending,
  HiSortDescending,
  HiShieldCheck,
  HiExclamationCircle,
} from 'react-icons/hi';
import { toast } from 'react-hot-toast';

// サブスクリプション情報の型定義
interface UserSubscription {
  id: string;
  name: string | null;
  nameKana: string | null;
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

// 🆕 管理者アクセス権限の型定義
interface AdminAccess {
  isSuperAdmin: boolean;
  isFinancialAdmin: boolean;
  adminLevel: 'super' | 'financial' | 'none';
}

// 並び替えのタイプ
type SortType =
  | 'created_asc'
  | 'created_desc'
  | 'nameKana_asc'
  | 'nameKana_desc'
  | 'plan_asc'
  | 'plan_desc'
  | 'status';

export default function AdminSubscriptionsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserSubscription[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [adminAccess, setAdminAccess] = useState<AdminAccess | null>(null);
  const [sortType, setSortType] = useState<SortType>('status');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // 🔧 修正: 管理者チェック（財務管理者も許可）
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!session?.user?.id) {
        router.push('/auth/signin');
        return;
      }
      try {
        const response = await fetch('/api/admin/access');
        const data = await response.json();

        if (data.adminLevel !== 'none') {
          setAdminAccess(data);
          fetchUsers();
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
    ? getPagePermissions(adminAccess.isSuperAdmin ? 'admin' : 'financial-admin', 'subscriptions')
    : { canView: false, canEdit: false, canDelete: false, canCreate: false };

  // ユーザーサブスクリプション一覧の取得
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/subscriptions');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        toast.error('サブスクリプション一覧の取得に失敗しました');
      }
    } catch {
      toast.error('サブスクリプション情報の取得中にエラーが発生しました');
    } finally {
      setLoading(false);
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
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.subscription?.plan || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.subscription?.status || '').toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // ユーザーの並び替え
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    // サブスクリプション状態で並び替え（アクティブ > トライアル > その他）
    if (sortType === 'status') {
      const getStatusPriority = (status: string | null | undefined) => {
        if (status === 'active') return 1;
        if (status === 'trialing') return 2;
        if (status === 'incomplete' || status === 'past_due') return 3;
        if (status === 'canceled') return 4;
        return 5;
      };
      const statusPriorityA = getStatusPriority(a.subscription?.status);
      const statusPriorityB = getStatusPriority(b.subscription?.status);
      if (statusPriorityA !== statusPriorityB) {
        return statusPriorityA - statusPriorityB;
      }
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
    // プランの昇順
    if (sortType === 'plan_asc') {
      return (a.subscription?.plan || '').localeCompare(b.subscription?.plan || '');
    }
    // プランの降順
    if (sortType === 'plan_desc') {
      return (b.subscription?.plan || '').localeCompare(a.subscription?.plan || '');
    }
    return 0;
  });

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

  if (!adminAccess) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <HiExclamationCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">アクセス権限がありません</h3>
          <p className="text-gray-600">管理者権限が必要です</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[90vw] mx-auto px-4">
      {/* 🆕 権限バナー表示（最上部） */}
      <ReadOnlyBanner message={permissions.readOnlyMessage} />

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <HiCreditCard className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold">サブスクリプション管理</h1>
              <p className="text-gray-600 mt-1">ユーザーのサブスクリプション状態を管理</p>
            </div>
          </div>
          {/* 🆕 権限バッジ表示（ヘッダー内） */}
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
              <HiShieldCheck className="h-4 w-4 mr-1" />
              {adminAccess.isSuperAdmin ? 'スーパー管理者' : '財務管理者'}
            </div>
            {!permissions.canEdit && (
              <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                閲覧のみ
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <HiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="ユーザー/プラン検索..."
              className="pl-10 pr-3 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
            <div className="dropdown">
              <Button
                variant="outline"
                className="flex items-center"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <span className="mr-1">並び替え</span>
                {sortType.includes('asc') ? (
                  <HiSortAscending className="h-4 w-4" />
                ) : (
                  <HiSortDescending className="h-4 w-4" />
                )}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                    <div className="py-1">
                      <button
                        className={`block px-4 py-2 text-sm text-left w-full hover:bg-gray-100 ${sortType === 'status' ? 'bg-gray-100 font-medium' : ''}`}
                        onClick={() => handleSort('status')}
                      >
                        ステータス順
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
                        className={`block px-4 py-2 text-sm text-left w-full hover:bg-gray-100 ${sortType === 'plan_asc' ? 'bg-gray-100 font-medium' : ''}`}
                        onClick={() => handleSort('plan_asc')}
                      >
                        プラン (A→Z)
                      </button>
                      <button
                        className={`block px-4 py-2 text-sm text-left w-full hover:bg-gray-100 ${sortType === 'plan_desc' ? 'bg-gray-100 font-medium' : ''}`}
                        onClick={() => handleSort('plan_desc')}
                      >
                        プラン (Z→A)
                      </button>
                    </div>
                  </div>
                )}
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
              {sortedUsers.map((user) => (
                <tr
                  key={user.id}
                  className={`hover:bg-gray-50 ${
                    user.subscriptionStatus === 'permanent'
                      ? 'bg-blue-50'
                      : user.subscriptionStatus === 'grace_period_expired'
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
        {filteredUsers.length === 0 && (
          <div className="text-center py-6">
            <p className="text-gray-500">該当するユーザーが見つかりません</p>
          </div>
        )}
      </div>
    </div>
  );
}