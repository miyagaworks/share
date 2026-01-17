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
import { getPagePermissions, ReadOnlyBanner } from '@/lib/utils/admin-permissions';
import FixPermanentUsersButton from './fix-permanent-button';
import GrantPermanentAccess from '@/components/admin/GrantPermanentAccess';

// AdminAccess型定義
interface AdminAccess {
  isSuperAdmin: boolean;
  isFinancialAdmin: boolean;
  adminLevel: 'super' | 'financial' | 'none';
}

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
  const [adminAccess, setAdminAccess] = useState<AdminAccess | null>(null);
  const [sortType, setSortType] = useState<SortType>('permanent_first');
  const [showGrantForm, setShowGrantForm] = useState(false);
  const [stats, setStats] = useState({
    totalCount: 0,
    trialUsersCount: 0,
    permanentUsersCount: 0,
  });

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

  // 🆕 権限設定の取得
  const permissions = adminAccess
    ? getPagePermissions(adminAccess.isSuperAdmin ? 'admin' : 'financial-admin', 'permissions')
    : { canView: false, canEdit: false, canDelete: false, canCreate: false };

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

  // 永久利用権付与の完了ハンドラ（将来的にコンポーネント側で呼び出される場合に備えて）
  const handleGrantComplete = () => {
    setShowGrantForm(false);
    fetchUsers(); // 一覧を再取得
  };

  // fetchUsersを呼び出すための統合された関数（将来的にコンポーネント側で呼び出される場合に備えて）
  const handleRefresh = () => {
    fetchUsers();
  };

  // 検索とフィルタリング
  const filteredUsers = users.filter((user) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      (user.name && user.name.toLowerCase().includes(searchLower)) ||
      (user.nameKana && user.nameKana.toLowerCase().includes(searchLower)) ||
      user.email.toLowerCase().includes(searchLower)
    );
  });

  // 並び替え処理
  const sortedUsers = filteredUsers.sort((a, b) => {
    // 永久利用権ユーザーを最初に表示
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

  // プラン種別の表示名を取得
  const getPlanTypeDisplay = (user: UserData) => {
    if (!user.isPermanentUser) {
      return '-';
    }

    const plan = user.subscription?.plan || '';

    // permanent_xxx 形式からプラン種別を抽出
    if (plan.includes('enterprise')) {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
          エンタープライズ (50名)
        </span>
      );
    }
    if (plan.includes('business')) {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
          ビジネス (30名)
        </span>
      );
    }
    if (plan.includes('starter')) {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-teal-100 text-teal-800">
          スターター (10名)
        </span>
      );
    }
    if (plan.includes('personal')) {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
          個人
        </span>
      );
    }

    // プラン情報がない場合（古いデータなど）
    return (
      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
        不明
      </span>
    );
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

  if (!adminAccess) {
    return null; // リダイレクト処理中は表示なし
  }

  return (
    <div className="max-w-[90vw] mx-auto px-4">
      {/* 🆕 権限バナー表示 */}
      <ReadOnlyBanner message={permissions.readOnlyMessage} />

      {/* ヘッダー */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <HiKey className="h-6 w-6 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold">永久利用権管理</h1>
          </div>
          <div className="flex items-center space-x-4">
            {/* 🆕 権限バッジ表示 */}
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {adminAccess.isSuperAdmin ? 'スーパー管理者' : '財務管理者'}
            </div>
            {/* 🆕 権限に応じてボタンを制御 */}
            {permissions.canCreate && (
              <Button
                onClick={() => setShowGrantForm(!showGrantForm)}
                className="flex items-center"
              >
                <HiPlus className="mr-2 h-4 w-4" />
                {showGrantForm ? '付与フォームを閉じる' : '永久利用権を付与'}
              </Button>
            )}
          </div>
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

        {/* 検索・並び替えコントロール */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <HiSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="名前、フリガナ、メールアドレスで検索..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={sortType}
            onChange={(e) => setSortType(e.target.value as SortType)}
          >
            <option value="permanent_first">永久利用権ユーザー優先</option>
            <option value="trial_remaining_asc">残り日数（少ない順）</option>
            <option value="trial_remaining_desc">残り日数（多い順）</option>
            <option value="nameKana_asc">フリガナ（昇順）</option>
            <option value="nameKana_desc">フリガナ（降順）</option>
            <option value="email_asc">メール（昇順）</option>
            <option value="email_desc">メール（降順）</option>
            <option value="created_asc">登録日（古い順）</option>
            <option value="created_desc">登録日（新しい順）</option>
          </select>
          <Button onClick={fetchUsers} variant="outline" className="flex items-center">
            <HiRefresh className="mr-2 h-4 w-4" />
            更新
          </Button>
        </div>

        {/* 🆕 権限に応じて永久利用権付与フォームを表示 */}
        {showGrantForm && permissions.canCreate && (
          <div className="mb-6">
            <GrantPermanentAccess />
          </div>
        )}

        {/* 🆕 権限に応じて修正ボタンを表示 */}
        {permissions.canEdit && (
          <div className="mb-6">
            <FixPermanentUsersButton />
          </div>
        )}
      </div>

      {/* ユーザー一覧テーブル */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ユーザー情報
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  メールアドレス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  プラン種別
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  トライアル期限
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  登録日
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.name || '名前未設定'}
                    </div>
                    <div className="text-sm text-gray-500">{user.nameKana || 'フリガナ未設定'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getTrialStatusDisplay(user)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getPlanTypeDisplay(user)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user.isPermanentUser ? '永久利用権' : formatDate(user.trialEndsAt)}
                    </div>
                    {!user.isPermanentUser && user.trialDaysRemaining !== undefined && (
                      <div className="text-xs text-gray-500">残り{user.trialDaysRemaining}日</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <HiExclamationCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? '検索結果がありません' : 'ユーザーが見つかりません'}
            </h3>
            <p className="text-gray-500">
              {searchTerm ? '検索条件を変更してお試しください' : 'まだユーザーが登録されていません'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}