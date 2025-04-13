// app/dashboard/corporate/sns/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Input } from '@/components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { ImprovedSnsIcon } from '@/components/shared/ImprovedSnsIcon';
import { SNS_METADATA, type SnsPlatform, SNS_PLATFORMS } from '@/types/sns';
import { toast } from 'react-hot-toast';
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiLink,
  HiExternalLink,
  HiRefresh,
  HiInformationCircle,
  HiOutlineExclamation,
} from 'react-icons/hi';

// CorporateSnsLink型
interface CorporateSnsLink {
  id: string;
  platform: string;
  username: string | null;
  url: string;
  displayOrder: number;
  isRequired: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function CorporateSnsMangementPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [corporateSnsLinks, setCorporateSnsLinks] = useState<CorporateSnsLink[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingLink, setEditingLink] = useState<CorporateSnsLink | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingLinkId, setDeletingLinkId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // フォーム状態
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [username, setUsername] = useState('');
  const [url, setUrl] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [description, setDescription] = useState('');

  // 法人共通SNSリンク情報を取得
  useEffect(() => {
    const fetchCorporateSnsLinks = async () => {
      if (!session?.user?.id) return;

      try {
        setIsLoading(true);
        const response = await fetch('/api/corporate/sns');

        if (!response.ok) {
          throw new Error('法人共通SNSリンク情報の取得に失敗しました');
        }

        const data = await response.json();
        setCorporateSnsLinks(data.snsLinks || []);
        setIsAdmin(data.isAdmin);
        setError(null);
      } catch (err) {
        console.error('法人共通SNSリンク取得エラー:', err);
        setError('法人共通SNSリンク情報を読み込めませんでした');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCorporateSnsLinks();
  }, [session]);

  // SNSリンク追加フォームをリセット
  const resetAddForm = () => {
    setSelectedPlatform('');
    setUsername('');
    setUrl('');
    setIsRequired(false);
    setDescription('');
  };

  // SNSリンク追加
  const handleAddSnsLink = async () => {
    if (!selectedPlatform || !url) {
      toast.error('必須項目を入力してください');
      return;
    }

    try {
      const response = await fetch('/api/corporate/sns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: selectedPlatform,
          username,
          url,
          isRequired,
          description: description || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '法人共通SNSリンクの追加に失敗しました');
      }

      const data = await response.json();
      toast.success('法人共通SNSリンクを追加しました');

      // リンク一覧を更新
      setCorporateSnsLinks([...corporateSnsLinks, data.link]);

      // フォームをリセットして閉じる
      resetAddForm();
      setIsAddFormOpen(false);
    } catch (error) {
      console.error('SNSリンク追加エラー:', error);
      toast.error(error instanceof Error ? error.message : '法人共通SNSリンクの追加に失敗しました');
    }
  };

  // SNSリンク編集を開始
  const handleEditLink = (link: CorporateSnsLink) => {
    setEditingLink(link);
    setUsername(link.username || '');
    setUrl(link.url);
    setIsRequired(link.isRequired);
    setDescription(link.description || '');
  };

  // SNSリンク編集を保存
  const handleSaveEdit = async () => {
    if (!editingLink || !url) {
      toast.error('必須項目を入力してください');
      return;
    }

    try {
      const response = await fetch(`/api/corporate/sns/${editingLink.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          url,
          isRequired,
          description: description || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '法人共通SNSリンクの更新に失敗しました');
      }

      const data = await response.json();
      toast.success('法人共通SNSリンクを更新しました');

      // リンク一覧を更新
      setCorporateSnsLinks(
        corporateSnsLinks.map((link) => (link.id === editingLink.id ? data.link : link)),
      );

      // 編集モードを終了
      setEditingLink(null);
    } catch (error) {
      console.error('SNSリンク更新エラー:', error);
      toast.error(error instanceof Error ? error.message : '法人共通SNSリンクの更新に失敗しました');
    }
  };

  // SNSリンク削除確認ダイアログを表示
  const handleDeleteConfirm = (linkId: string) => {
    setDeletingLinkId(linkId);
    setIsDeleteConfirmOpen(true);
  };

  // SNSリンク削除を実行
  const handleDeleteLink = async () => {
    if (!deletingLinkId) return;

    try {
      const response = await fetch(`/api/corporate/sns/${deletingLinkId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '法人共通SNSリンクの削除に失敗しました');
      }

      toast.success('法人共通SNSリンクを削除しました');

      // リンク一覧を更新
      setCorporateSnsLinks(corporateSnsLinks.filter((link) => link.id !== deletingLinkId));

      // ダイアログを閉じる
      setIsDeleteConfirmOpen(false);
      setDeletingLinkId(null);
    } catch (error) {
      console.error('SNSリンク削除エラー:', error);
      toast.error(error instanceof Error ? error.message : '法人共通SNSリンクの削除に失敗しました');
    }
  };

  // SNSリンクの同期
  const handleSyncToUsers = async () => {
    try {
      setIsSyncing(true);
      const response = await fetch('/api/corporate/sns', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'sync',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'SNSリンクの同期に失敗しました');
      }

      const data = await response.json();
      toast.success(data.message || 'SNSリンクを同期しました');
    } catch (error) {
      console.error('SNSリンク同期エラー:', error);
      toast.error(error instanceof Error ? error.message : 'SNSリンクの同期に失敗しました');
    } finally {
      setIsSyncing(false);
    }
  };

  // URLを生成する関数
  const generateUrl = (platform: string, username: string) => {
    const metadata = SNS_METADATA[platform as SnsPlatform];
    if (metadata && metadata.baseUrl) {
      setUrl(`${metadata.baseUrl}${username}`);
    }
  };

  // プラットフォーム選択時のURL生成
  useEffect(() => {
    if (selectedPlatform && username) {
      generateUrl(selectedPlatform, username);
    }
  }, [selectedPlatform, username]);

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
        <div className="flex items-start">
          <HiOutlineExclamation className="h-6 w-6 text-red-600 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-red-800">エラーが発生しました</h3>
            <p className="mt-2 text-red-700">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              再読み込み
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 管理者権限がない場合
  if (!isAdmin) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
        <div className="flex items-start">
          <HiOutlineExclamation className="h-6 w-6 text-yellow-600 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-yellow-800">管理者権限が必要です</h3>
            <p className="mt-2 text-yellow-700">
              法人共通SNS設定の管理には法人管理者権限が必要です。
            </p>
            <Button className="mt-4" onClick={() => router.push('/dashboard/corporate')}>
              管理者ダッシュボードへ戻る
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー部分 */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">法人共通SNS設定</h1>
          <p className="text-gray-500 mt-1">全社員に共通のSNSリンクを設定・管理します</p>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => setIsAddFormOpen(true)} className="flex items-center">
            <HiPlus className="mr-2 h-4 w-4" />
            SNSリンクを追加
          </Button>
          <Button
            variant="outline"
            onClick={handleSyncToUsers}
            disabled={isSyncing || corporateSnsLinks.length === 0}
            className="flex items-center"
          >
            {isSyncing ? (
              <>
                <Spinner size="sm" className="mr-2" />
                同期中...
              </>
            ) : (
              <>
                <HiRefresh className="mr-2 h-4 w-4" />
                ユーザーに同期
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 説明セクション */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
        <div className="flex">
          <HiInformationCircle className="text-blue-500 h-5 w-5 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-blue-800 mb-1">法人共通SNS設定について</h3>
            <p className="text-sm text-blue-700">
              ここで設定したSNSリンクは法人アカウントに所属するすべてのユーザーのプロフィールに表示されます。
              「必須」に設定すると、そのSNSリンクは全ユーザーのプロフィールに自動的に追加され、
              ユーザーが削除できなくなります。
            </p>
          </div>
        </div>
      </div>

      {/* SNSリンク一覧 */}
      {corporateSnsLinks.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  プラットフォーム
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {corporateSnsLinks.map((link) => (
                <tr key={link.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <ImprovedSnsIcon platform={link.platform as SnsPlatform} size={24} />
                      <span className="ml-3 font-medium">
                        {SNS_METADATA[link.platform as SnsPlatform]?.name || link.platform}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <span className="truncate max-w-xs">{link.url}</span>
                        <HiExternalLink className="ml-1 h-4 w-4" />
                      </a>
                      {link.description && (
                        <p className="text-sm text-gray-500 mt-1">{link.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {link.isRequired ? (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        必須
                      </span>
                    ) : (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        任意
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => handleEditLink(link)}
                    >
                      <HiPencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-800"
                      onClick={() => handleDeleteConfirm(link.id)}
                      disabled={link.isRequired} // 必須リンクは削除不可
                    >
                      <HiTrash className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <HiLink className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="mt-4 text-lg font-medium">法人共通SNSリンクがありません</h3>
          <p className="mt-2 text-gray-500 mb-6">
            「SNSリンクを追加」ボタンをクリックして、法人共通のSNSリンクを設定してください。
          </p>
          <Button onClick={() => setIsAddFormOpen(true)}>
            <HiPlus className="mr-2 h-4 w-4" />
            SNSリンクを追加
          </Button>
        </div>
      )}

      {/* SNSリンク追加ダイアログ */}
      <Dialog
        open={isAddFormOpen}
        onOpenChange={(open) => {
          if (!open) resetAddForm();
          setIsAddFormOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>法人共通SNSリンクを追加</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                プラットフォーム <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {SNS_PLATFORMS.map((platform) => {
                  // 既に追加済みのプラットフォームは無効化
                  const isDisabled = corporateSnsLinks.some((link) => link.platform === platform);

                  return (
                    <button
                      key={platform}
                      type="button"
                      className={`p-2 border rounded-md flex flex-col items-center justify-center ${
                        selectedPlatform === platform
                          ? 'border-blue-500 bg-blue-50'
                          : isDisabled
                            ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                      onClick={() => !isDisabled && setSelectedPlatform(platform)}
                      disabled={isDisabled}
                    >
                      <ImprovedSnsIcon platform={platform as SnsPlatform} size={24} />
                      <span className="text-xs mt-1">
                        {SNS_METADATA[platform as SnsPlatform]?.name || platform}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedPlatform && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ユーザー名</label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={`${SNS_METADATA[selectedPlatform as SnsPlatform]?.name || selectedPlatform}のユーザー名`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    説明（任意）
                  </label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="このSNSアカウントの説明"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isRequired"
                    className="h-4 w-4 text-blue-600 rounded"
                    checked={isRequired}
                    onChange={(e) => setIsRequired(e.target.checked)}
                  />
                  <label htmlFor="isRequired" className="ml-2 text-sm text-gray-700">
                    全ユーザーに必須（ユーザーが削除できなくなります）
                  </label>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetAddForm();
                setIsAddFormOpen(false);
              }}
            >
              キャンセル
            </Button>
            <Button type="button" disabled={!selectedPlatform || !url} onClick={handleAddSnsLink}>
              追加
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* SNSリンク編集ダイアログ */}
      <Dialog
        open={!!editingLink}
        onOpenChange={(open) => {
          if (!open) setEditingLink(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {editingLink && (
                <>
                  <ImprovedSnsIcon platform={editingLink.platform as SnsPlatform} size={20} />
                  <span className="ml-2">
                    {SNS_METADATA[editingLink?.platform as SnsPlatform]?.name ||
                      editingLink?.platform}
                    を編集
                  </span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ユーザー名</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ユーザー名"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL <span className="text-red-500">*</span>
              </label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">説明（任意）</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="このSNSアカウントの説明"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="editIsRequired"
                className="h-4 w-4 text-blue-600 rounded"
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
              />
              <label htmlFor="editIsRequired" className="ml-2 text-sm text-gray-700">
                全ユーザーに必須（ユーザーが削除できなくなります）
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <Button type="button" variant="outline" onClick={() => setEditingLink(null)}>
              キャンセル
            </Button>
            <Button type="button" disabled={!url} onClick={handleSaveEdit}>
              更新
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">法人共通SNSリンクを削除</DialogTitle>
          </DialogHeader>

          <div className="mt-4 text-gray-700">
            <p>
              この法人共通SNSリンクを削除してもよろしいですか？ この操作は元に戻すことができません。
            </p>
            <p className="mt-2 text-sm text-gray-500">
              ※すでにユーザーに追加されているSNSリンクは削除されません。
            </p>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteConfirmOpen(false);
                setDeletingLinkId(null);
              }}
            >
              キャンセル
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteLink}>
              削除
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}