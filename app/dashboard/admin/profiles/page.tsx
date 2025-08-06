// app/dashboard/admin/profiles/page.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import {
  HiUsers,
  HiSearch,
  HiRefresh,
  HiEye,
  HiQrcode,
  HiExternalLink,
  HiClipboard,
  HiDownload,
  HiX,
} from 'react-icons/hi';
import { getPagePermissions, ReadOnlyBanner } from '@/lib/utils/admin-permissions';
import Image from 'next/image';
import QRCode from 'qrcode';

// AdminAccess型定義を追加
interface AdminAccess {
  isSuperAdmin: boolean;
  isFinancialAdmin: boolean;
  adminLevel: 'super' | 'financial' | 'none';
}

// ユーザープロフィール情報の型定義
interface UserProfileData {
  id: string;
  name: string | null;
  nameKana: string | null;
  nameEn: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  company: string | null;
  phone: string | null;
  mainColor: string;
  createdAt: string;
  subscriptionStatus: string;
  profile?: {
    slug: string;
    views: number;
    isPublic: boolean;
    lastAccessed: string | null;
  } | null;
  qrCodePages?: QRCodePageData[];
  snsLinks?: {
    platform: string;
    url: string;
  }[];
  customLinks?: {
    name: string;
    url: string;
  }[];
  tenant?: {
    name: string;
    primaryColor: string;
    logoUrl: string | null;
  } | null;
  department?: {
    name: string;
  } | null;
}

// QRコードページの型定義
interface QRCodePageData {
  id: string;
  slug: string;
  views: number;
  primaryColor: string;
  lastAccessed: string | null;
}

// 並び替えのタイプ
type SortType =
  | 'created_asc'
  | 'created_desc'
  | 'nameKana_asc'
  | 'nameKana_desc'
  | 'email_asc'
  | 'email_desc'
  | 'views_desc'
  | 'views_asc';

export default function AdminProfilesPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfileData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfileData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [adminAccess, setAdminAccess] = useState<AdminAccess | null>(null);
  const [sortType, setSortType] = useState<SortType>('views_desc');

  // モーダル関連の状態
  const [selectedUser, setSelectedUser] = useState<UserProfileData | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [selectedQRCode, setSelectedQRCode] = useState<QRCodePageData | null>(null);

  // ユーザープロフィール一覧の取得
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/profiles');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        toast.error('プロファイル一覧の取得に失敗しました');
      }
    } catch {
      toast.error('プロファイル情報の取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, []);

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
  }, [session, router, fetchUsers]);

  // 🆕 権限設定の取得
  const permissions = adminAccess
    ? getPagePermissions(adminAccess.isSuperAdmin ? 'admin' : 'financial-admin', 'profiles')
    : { canView: false, canEdit: false, canDelete: false, canCreate: false };

  // 検索とフィルタリング
  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter((user) =>
        [user.name, user.nameKana, user.email, user.company]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(searchTerm.toLowerCase())),
      );
    }

    // ソート処理
    filtered.sort((a, b) => {
      switch (sortType) {
        case 'views_desc':
          return (b.profile?.views || 0) - (a.profile?.views || 0);
        case 'views_asc':
          return (a.profile?.views || 0) - (b.profile?.views || 0);
        case 'created_desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'created_asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'nameKana_asc':
          return (a.nameKana || '').localeCompare(b.nameKana || '');
        case 'nameKana_desc':
          return (b.nameKana || '').localeCompare(a.nameKana || '');
        case 'email_asc':
          return a.email.localeCompare(b.email);
        case 'email_desc':
          return b.email.localeCompare(a.email);
        default:
          return 0;
      }
    });

    setFilteredUsers(filtered);
  }, [users, searchTerm, sortType]);

  // プロフィール表示
  const handleViewProfile = (user: UserProfileData) => {
    setSelectedUser(user);
    setShowProfileModal(true);
  };

  // QRコード生成と表示
  const handleViewQRCode = async (user: UserProfileData, qrPage?: QRCodePageData) => {
    try {
      let url: string;
      if (qrPage) {
        url = `${window.location.origin}/${qrPage.slug}`;
        setSelectedQRCode(qrPage);
      } else if (user.profile) {
        url = `${window.location.origin}/${user.profile.slug}`;
        setSelectedQRCode(null);
      } else {
        toast.error('プロフィールページが見つかりません');
        return;
      }

      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      setQrCodeDataUrl(qrDataUrl);
      setSelectedUser(user);
      setShowQRModal(true);
    } catch (error) {
      console.error('QRコード生成エラー:', error);
      toast.error('QRコードの生成に失敗しました');
    }
  };

  // QRコードダウンロード
  const handleDownloadQRCode = () => {
    if (!qrCodeDataUrl || !selectedUser) return;

    const link = document.createElement('a');
    link.download = `qrcode-${selectedUser.email}-${Date.now()}.png`;
    link.href = qrCodeDataUrl;
    link.click();
  };

  // URLコピー
  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('URLをコピーしました');
    } catch {
      toast.error('URLのコピーに失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-2 text-gray-500">プロフィール情報を読み込み中...</p>
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
            <HiUsers className="h-6 w-6 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold">プロフィール・QRコード管理</h1>
          </div>
          <div className="flex items-center space-x-4">
            {/* 🆕 権限バッジ表示 */}
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {adminAccess.isSuperAdmin ? 'スーパー管理者' : '財務管理者'}
            </div>
            <Button onClick={fetchUsers} className="flex items-center">
              <HiRefresh className="mr-2 h-4 w-4" />
              更新
            </Button>
          </div>
        </div>

        {/* 統計表示 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900">総ユーザー数</p>
            <p className="text-2xl font-bold text-blue-600">{users.length}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm font-medium text-green-900">公開プロフィール</p>
            <p className="text-2xl font-bold text-green-600">
              {users.filter((u) => u.profile?.isPublic).length}
            </p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm font-medium text-purple-900">QRページ作成済み</p>
            <p className="text-2xl font-bold text-purple-600">
              {users.filter((u) => u.qrCodePages && u.qrCodePages.length > 0).length}
            </p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm font-medium text-yellow-900">総PV数</p>
            <p className="text-2xl font-bold text-yellow-600">
              {users.reduce((sum, u) => sum + (u.profile?.views || 0), 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* 検索・並び替えコントロール */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <HiSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="名前、メール、会社名で検索..."
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
            <option value="views_desc">PV数（多い順）</option>
            <option value="views_asc">PV数（少ない順）</option>
            <option value="created_desc">登録日（新しい順）</option>
            <option value="created_asc">登録日（古い順）</option>
            <option value="nameKana_asc">フリガナ（昇順）</option>
            <option value="nameKana_desc">フリガナ（降順）</option>
            <option value="email_asc">メール（昇順）</option>
            <option value="email_desc">メール（降順）</option>
          </select>
        </div>
      </div>

      {/* プロフィール一覧 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  プロフィール
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  基本情報
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PV数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.image ? (
                          <Image
                            className="h-10 w-10 rounded-full object-cover"
                            src={user.image}
                            alt={user.name || 'プロフィール画像'}
                            width={40}
                            height={40}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <HiUsers className="h-6 w-6 text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name || '名前未設定'}
                        </div>
                        <div className="text-sm text-gray-500">{user.nameKana || ''}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{user.email}</div>
                    {user.company && <div className="text-sm text-gray-500">{user.company}</div>}
                    <div className="text-xs text-gray-400 mt-1">
                      登録: {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.profile?.views?.toLocaleString() || '0'} PV
                    </div>
                    <div className="text-xs text-gray-500">
                      {user.profile?.isPublic ? '公開中' : '非公開'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleViewProfile(user)}
                      className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                    >
                      <HiEye className="h-4 w-4 mr-1" />
                      詳細
                    </button>
                    {user.profile && (
                      <>
                        <button
                          onClick={() => handleViewQRCode(user)}
                          className="text-green-600 hover:text-green-900 inline-flex items-center"
                        >
                          <HiQrcode className="h-4 w-4 mr-1" />
                          QR
                        </button>
                        <a
                          href={`/${user.profile.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-900 inline-flex items-center"
                        >
                          <HiExternalLink className="h-4 w-4 mr-1" />
                          表示
                        </a>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* プロフィール詳細モーダル */}
      {showProfileModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* モーダルヘッダー */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">プロフィール詳細</h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiX className="h-6 w-6" />
              </button>
            </div>

            {/* モーダル内容 */}
            <div className="p-6 space-y-6">
              {/* 基本情報 */}
              <div>
                <h4 className="font-semibold mb-3">基本情報</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">名前:</span> {selectedUser.name || '未設定'}
                  </div>
                  <div>
                    <span className="text-gray-500">フリガナ:</span>{' '}
                    {selectedUser.nameKana || '未設定'}
                  </div>
                  <div>
                    <span className="text-gray-500">英語名:</span> {selectedUser.nameEn || '未設定'}
                  </div>
                  <div>
                    <span className="text-gray-500">メール:</span> {selectedUser.email}
                  </div>
                  <div>
                    <span className="text-gray-500">会社:</span> {selectedUser.company || '未設定'}
                  </div>
                  <div>
                    <span className="text-gray-500">電話:</span> {selectedUser.phone || '未設定'}
                  </div>
                </div>
              </div>

              {/* プロフィールページ情報 */}
              {selectedUser.profile && (
                <div>
                  <h4 className="font-semibold mb-3">プロフィールページ</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">URL:</span>{' '}
                      <a
                        href={`/${selectedUser.profile.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        /{selectedUser.profile.slug}
                      </a>
                    </div>
                    <div>
                      <span className="text-gray-500">PV数:</span>{' '}
                      {selectedUser.profile.views.toLocaleString()}
                    </div>
                    <div>
                      <span className="text-gray-500">公開状態:</span>{' '}
                      <span
                        className={
                          selectedUser.profile.isPublic ? 'text-green-600' : 'text-red-600'
                        }
                      >
                        {selectedUser.profile.isPublic ? '公開' : '非公開'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* SNSリンク */}
              {selectedUser.snsLinks && selectedUser.snsLinks.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">SNSリンク</h4>
                  <div className="space-y-2">
                    {selectedUser.snsLinks.map((link, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="capitalize">{link.platform}:</span>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center"
                        >
                          {link.url}
                          <HiExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* カスタムリンク */}
              {selectedUser.customLinks && selectedUser.customLinks.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">カスタムリンク</h4>
                  <div className="space-y-2">
                    {selectedUser.customLinks.map((link, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span>{link.name}:</span>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center"
                        >
                          {link.url}
                          <HiExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QRコードモーダル */}
      {showQRModal && qrCodeDataUrl && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            {/* モーダルヘッダー */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">QRコード</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiX className="h-6 w-6" />
              </button>
            </div>

            {/* QRコード表示 */}
            <div className="p-6 text-center">
              <Image
                src={qrCodeDataUrl}
                alt="QRCode"
                width={256}
                height={256}
                className="mx-auto mb-4"
              />
              <p className="text-sm text-gray-600 mb-4">
                {selectedUser.name || selectedUser.email}のプロフィール
              </p>
              <div className="flex space-x-3">
                <Button
                  onClick={handleDownloadQRCode}
                  className="flex-1 flex items-center justify-center"
                >
                  <HiDownload className="h-4 w-4 mr-2" />
                  ダウンロード
                </Button>
                <Button
                  onClick={() => {
                    const url = selectedQRCode
                      ? `${window.location.origin}/${selectedQRCode.slug}`
                      : `${window.location.origin}/${selectedUser.profile?.slug}`;
                    handleCopyUrl(url);
                  }}
                  variant="outline"
                  className="flex-1 flex items-center justify-center"
                >
                  <HiClipboard className="h-4 w-4 mr-2" />
                  URLコピー
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}