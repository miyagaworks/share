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
import Image from 'next/image';
import QRCode from 'qrcode';
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
  const [isAdmin, setIsAdmin] = useState(false);
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
          await fetchUsers();
        } else {
          router.push('/dashboard');
        }
      } catch {
        router.push('/dashboard');
      }
    };
    checkAdminAccess();
  }, [session, router, fetchUsers]);
  // 検索とフィルタリング
  useEffect(() => {
    const filtered = users.filter(
      (user) =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.nameKana?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.company?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    // 並び替え
    filtered.sort((a, b) => {
      switch (sortType) {
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
        case 'views_desc':
          const aViews =
            (a.profile?.views || 0) + (a.qrCodePages?.reduce((sum, qr) => sum + qr.views, 0) || 0);
          const bViews =
            (b.profile?.views || 0) + (b.qrCodePages?.reduce((sum, qr) => sum + qr.views, 0) || 0);
          return bViews - aViews;
        case 'views_asc':
          const aViewsAsc =
            (a.profile?.views || 0) + (a.qrCodePages?.reduce((sum, qr) => sum + qr.views, 0) || 0);
          const bViewsAsc =
            (b.profile?.views || 0) + (b.qrCodePages?.reduce((sum, qr) => sum + qr.views, 0) || 0);
          return aViewsAsc - bViewsAsc;
        default:
          return 0;
      }
    });
    setFilteredUsers(filtered);
  }, [users, searchTerm, sortType]);
  // 並び替え変更
  const handleSort = (type: SortType) => {
    setSortType(type);
  };
  // URLをコピー
  const copyUrl = (url: string, type: string) => {
    navigator.clipboard.writeText(url);
    toast.success(`${type}URLをコピーしました`);
  };
  // プロフィール詳細を表示
  const showProfileDetails = (user: UserProfileData) => {
    setSelectedUser(user);
    setShowProfileModal(true);
  };
  // QRコード詳細を表示
  const showQRDetails = async (user: UserProfileData, qrCode: QRCodePageData) => {
    setSelectedUser(user);
    setSelectedQRCode(qrCode);
    // QRコードを生成
    try {
      const qrUrl = `${window.location.origin}/qr/${qrCode.slug}`;
      const qrDataUrl = await QRCode.toDataURL(qrUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: qrCode.primaryColor || '#000000',
          light: '#FFFFFF',
        },
      });
      setQrCodeDataUrl(qrDataUrl);
      setShowQRModal(true);
    } catch {
      toast.error('QRコードの生成に失敗しました');
    }
  };
  // QRコードをダウンロード
  const downloadQRCode = () => {
    if (qrCodeDataUrl && selectedQRCode && selectedUser) {
      const link = document.createElement('a');
      link.href = qrCodeDataUrl;
      link.download = `${selectedUser.name || 'user'}_${selectedQRCode.slug}_qrcode.png`;
      link.click();
    }
  };
  // 日付フォーマット
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ja-JP');
  };
  // 合計閲覧数を計算
  const getTotalViews = (user: UserProfileData) => {
    const profileViews = user.profile?.views || 0;
    const qrViews = user.qrCodePages?.reduce((sum, qr) => sum + qr.views, 0) || 0;
    return profileViews + qrViews;
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
  if (!isAdmin) {
    return null;
  }
  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-center mb-6">
          <HiUsers className="h-6 w-6 text-blue-600 mr-3" />
          <h1 className="text-2xl font-bold">プロフィール・QRコード管理</h1>
        </div>
        {/* 検索・操作エリア */}
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
            {/* 並び替えドロップダウン */}
            <div className="relative">
              <select
                value={sortType}
                onChange={(e) => handleSort(e.target.value as SortType)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="views_desc">閲覧数 (多→少)</option>
                <option value="views_asc">閲覧数 (少→多)</option>
                <option value="created_desc">登録日 (新→古)</option>
                <option value="created_asc">登録日 (古→新)</option>
                <option value="nameKana_asc">フリガナ (ア→ワ)</option>
                <option value="nameKana_desc">フリガナ (ワ→ア)</option>
                <option value="email_asc">メール (A→Z)</option>
                <option value="email_desc">メール (Z→A)</option>
              </select>
            </div>
            <Button onClick={fetchUsers} variant="outline">
              <HiRefresh className="mr-2 h-4 w-4" />
              更新
            </Button>
          </div>
        </div>
        {/* プロフィール一覧テーブル */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ユーザー情報
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  プロフィール
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  QRコード
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  合計閲覧数
                </th>
                <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.image ? (
                          <Image
                            src={user.image}
                            alt={user.name || 'プロフィール画像'}
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <HiUsers className="h-6 w-6 text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name || '未設定'}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        {user.company && (
                          <div className="text-xs text-gray-400">{user.company}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    {user.profile && user.profile.isPublic ? (
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            公開中
                          </span>
                          <span className="text-xs text-gray-500">{user.profile.views} 回閲覧</span>
                        </div>
                        <div className="text-xs text-gray-400">/{user.profile.slug}</div>
                      </div>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        非公開 / 未作成
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    {user.qrCodePages && user.qrCodePages.length > 0 ? (
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {user.qrCodePages.length}個作成済み
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          合計 {user.qrCodePages.reduce((sum, qr) => sum + qr.views, 0)} 回閲覧
                        </div>
                      </div>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        未作成
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-center">
                    <span className="text-lg font-semibold text-gray-900">
                      {getTotalViews(user)}
                    </span>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center space-x-2">
                      {/* プロフィール確認 */}
                      {user.profile && user.profile.isPublic && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => showProfileDetails(user)}
                            title="プロフィール詳細"
                          >
                            <HiEye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              copyUrl(
                                `${window.location.origin}/${user.profile!.slug}`,
                                'プロフィール',
                              )
                            }
                            title="プロフィールURLをコピー"
                          >
                            <HiClipboard className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {/* QRコード確認 */}
                      {user.qrCodePages && user.qrCodePages.length > 0 && (
                        <div className="relative group">
                          {user.qrCodePages.length === 1 ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => showQRDetails(user, user.qrCodePages![0])}
                                title="QRコード詳細"
                              >
                                <HiQrcode className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  copyUrl(
                                    `${window.location.origin}/qr/${user.qrCodePages![0].slug}`,
                                    'QRコード',
                                  )
                                }
                                title="QRコードURLをコピー"
                              >
                                <HiClipboard className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <div className="flex flex-col space-y-1">
                              {user.qrCodePages.map((qr, index) => (
                                <div key={qr.id} className="flex items-center space-x-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => showQRDetails(user, qr)}
                                    title={`QRコード${index + 1} 詳細`}
                                  >
                                    <HiQrcode className="h-3 w-3" />
                                    <span className="text-xs ml-1">{index + 1}</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      copyUrl(
                                        `${window.location.origin}/qr/${qr.slug}`,
                                        `QRコード${index + 1}`,
                                      )
                                    }
                                    title={`QRコード${index + 1}URLをコピー`}
                                  >
                                    <HiClipboard className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
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
      {/* プロフィール詳細モーダル */}
      {showProfileModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-medium">プロフィール詳細</h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <HiX className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 基本情報 */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">基本情報</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">名前:</span> {selectedUser.name || '未設定'}
                    </div>
                    <div>
                      <span className="font-medium">フリガナ:</span>{' '}
                      {selectedUser.nameKana || '未設定'}
                    </div>
                    <div>
                      <span className="font-medium">英語名:</span> {selectedUser.nameEn || '未設定'}
                    </div>
                    <div>
                      <span className="font-medium">メール:</span> {selectedUser.email}
                    </div>
                    <div>
                      <span className="font-medium">電話:</span> {selectedUser.phone || '未設定'}
                    </div>
                    <div>
                      <span className="font-medium">会社:</span> {selectedUser.company || '未設定'}
                    </div>
                  </div>
                </div>
                {/* プロフィール情報 */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">プロフィール情報</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">URL:</span>
                      {selectedUser.profile ? (
                        <a
                          href={`${window.location.origin}/${selectedUser.profile.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline ml-1"
                        >
                          /{selectedUser.profile.slug}
                        </a>
                      ) : (
                        '未作成'
                      )}
                    </div>
                    <div>
                      <span className="font-medium">閲覧数:</span>{' '}
                      {selectedUser.profile?.views || 0}
                    </div>
                    <div>
                      <span className="font-medium">公開状態:</span>
                      <span
                        className={`ml-1 px-2 py-1 text-xs rounded-full ${
                          selectedUser.profile?.isPublic
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {selectedUser.profile?.isPublic ? '公開中' : '非公開'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">最終アクセス:</span>{' '}
                      {formatDate(selectedUser.profile?.lastAccessed || null)}
                    </div>
                  </div>
                </div>
              </div>
              {/* 自己紹介 */}
              {selectedUser.bio && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">自己紹介</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedUser.bio}</p>
                </div>
              )}
              {/* SNSリンク */}
              {selectedUser.snsLinks && selectedUser.snsLinks.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">SNSリンク</h4>
                  <div className="space-y-2">
                    {selectedUser.snsLinks.map((link, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{link.platform}</span>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          {link.url}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* アクションボタン */}
              <div className="mt-6 flex justify-end space-x-3">
                {selectedUser.profile && selectedUser.profile.isPublic && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() =>
                        copyUrl(
                          `${window.location.origin}/${selectedUser.profile!.slug}`,
                          'プロフィール',
                        )
                      }
                    >
                      <HiClipboard className="mr-2 h-4 w-4" />
                      URLをコピー
                    </Button>
                    <Button
                      onClick={() =>
                        window.open(
                          `${window.location.origin}/${selectedUser.profile!.slug}`,
                          '_blank',
                        )
                      }
                    >
                      <HiExternalLink className="mr-2 h-4 w-4" />
                      プロフィールを開く
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* QRコード詳細モーダル */}
      {showQRModal && selectedUser && selectedQRCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-lg w-full m-4">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium">QRコード詳細</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <HiX className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              {/* QRコード画像 */}
              <div className="text-center mb-6">
                {qrCodeDataUrl && (
                  <Image
                    src={qrCodeDataUrl}
                    alt="QRコード"
                    width={200}
                    height={200}
                    className="mx-auto border border-gray-200 rounded-lg"
                  />
                )}
              </div>
              {/* QRコード情報 */}
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">ユーザー:</span>{' '}
                  {selectedUser.name || selectedUser.email}
                </div>
                <div>
                  <span className="font-medium">URL:</span>
                  <a
                    href={`${window.location.origin}/qr/${selectedQRCode.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline ml-1"
                  >
                    /qr/{selectedQRCode.slug}
                  </a>
                </div>
                <div>
                  <span className="font-medium">閲覧数:</span> {selectedQRCode.views}
                </div>
                <div>
                  <span className="font-medium">メインカラー:</span>
                  <span
                    className="inline-block w-4 h-4 rounded ml-2 border border-gray-300"
                    style={{ backgroundColor: selectedQRCode.primaryColor }}
                  ></span>
                  <span className="ml-1">{selectedQRCode.primaryColor}</span>
                </div>
                <div>
                  <span className="font-medium">最終アクセス:</span>{' '}
                  {formatDate(selectedQRCode.lastAccessed)}
                </div>
              </div>
              {/* アクションボタン */}
              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() =>
                    copyUrl(`${window.location.origin}/qr/${selectedQRCode.slug}`, 'QRコード')
                  }
                >
                  <HiClipboard className="mr-2 h-4 w-4" />
                  URLをコピー
                </Button>
                <Button variant="outline" onClick={downloadQRCode}>
                  <HiDownload className="mr-2 h-4 w-4" />
                  QRコードをダウンロード
                </Button>
                <Button
                  onClick={() =>
                    window.open(`${window.location.origin}/qr/${selectedQRCode.slug}`, '_blank')
                  }
                >
                  <HiExternalLink className="mr-2 h-4 w-4" />
                  QRコードページを開く
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}