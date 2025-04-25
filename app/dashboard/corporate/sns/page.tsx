// app/dashboard/corporate/sns/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Dialog } from '@/components/ui/Dialog';
import { ImprovedSnsIcon } from '@/components/shared/ImprovedSnsIcon';
import { SNS_METADATA, type SnsPlatform } from '@/types/sns';
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
import { CorporateSnsLink } from './types';
import { CorporateSnsAddForm, CorporateSnsEditForm, CorporateSnsDeleteConfirm } from './components';

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

  // SNSリンク編集を開始
  const handleEditLink = (link: CorporateSnsLink) => {
    setEditingLink(link);
  };

  // SNSリンク削除確認ダイアログを表示
  const handleDeleteConfirm = (linkId: string) => {
    // 削除するリンクのオブジェクトを検索
    const targetLink = corporateSnsLinks.find((link) => link.id === linkId);
    if (!targetLink) {
      toast.error('リンクが見つかりません');
      return;
    }

    setDeletingLinkId(linkId);
    setIsDeleteConfirmOpen(true);
  };

  // 削除成功時のコールバック
  const handleDeleteSuccess = (deletedId: string) => {
    setCorporateSnsLinks(corporateSnsLinks.filter((link) => link.id !== deletedId));
    setIsDeleteConfirmOpen(false);
    setDeletingLinkId(null);
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
    <div className="space-y-6 max-w-full overflow-hidden px-2 sm:px-4">
      {/* ヘッダー部分 */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">法人共通SNS設定</h1>
          <p className="text-gray-500 mt-1">全社員に共通のSNSリンクを設定・管理します</p>
        </div>

        <div className="flex gap-2 flex-wrap">
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
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 w-full">
        <div className="flex flex-col sm:flex-row">
          <HiInformationCircle className="text-blue-500 h-5 w-5 flex-shrink-0 mb-2 sm:mb-0 sm:mr-2 sm:mt-1" />
          <div className="w-full">
            <h3 className="font-medium text-blue-800 mb-1">法人共通SNS設定について</h3>
            <p className="text-sm text-blue-700 break-words hyphens-auto">
              ここで設定したSNSリンクは法人アカウントに所属するすべてのユーザーのプロフィールに表示されます。
              「必須」に設定すると、そのSNSリンクは全ユーザーのプロフィールに自動的に追加され、
              ユーザーが削除できなくなります。
            </p>
          </div>
        </div>
      </div>

      {/* SNSリンク一覧 - PC表示用テーブル */}
      {corporateSnsLinks.length > 0 ? (
        <>
          <div className="hidden sm:block w-full">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        プラットフォーム
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        URL
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ステータス
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {corporateSnsLinks.map((link) => (
                      <tr key={link.id} className="hover:bg-gray-50">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <ImprovedSnsIcon platform={link.platform as SnsPlatform} size={24} />
                            <span className="ml-3 font-medium">
                              {SNS_METADATA[link.platform as SnsPlatform]?.name || link.platform}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <div>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center"
                            >
                              <span className="truncate block max-w-[150px] sm:max-w-[200px] md:max-w-xs">
                                {link.url}
                              </span>
                              <HiExternalLink className="ml-1 h-4 w-4 flex-shrink-0" />
                            </a>
                            {link.description && (
                              <p className="text-sm text-gray-500 mt-1 truncate max-w-[150px] sm:max-w-[200px] md:max-w-xs">
                                {link.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
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
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-800 mr-2"
                            onClick={() => handleEditLink(link)}
                          >
                            <HiPencil className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-800"
                            onClick={() => handleDeleteConfirm(link.id)}
                          >
                            <HiTrash className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* SNSリンク一覧 - スマホ表示用カード */}
          <div className="block sm:hidden space-y-4 w-full">
            {corporateSnsLinks.map((link) => (
              <div key={link.id} className="bg-white rounded-lg border border-gray-200 p-4 w-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <ImprovedSnsIcon platform={link.platform as SnsPlatform} size={24} />
                    <span className="ml-3 font-medium">
                      {SNS_METADATA[link.platform as SnsPlatform]?.name || link.platform}
                    </span>
                  </div>
                  <div>
                    {link.isRequired ? (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        必須
                      </span>
                    ) : (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        任意
                      </span>
                    )}
                  </div>
                </div>
                <div className="mb-3">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-start"
                  >
                    <span className="text-sm break-all mr-1">{link.url}</span>
                    <HiExternalLink className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  </a>
                  {link.description && (
                    <p className="text-sm text-gray-500 mt-1 break-words">{link.description}</p>
                  )}
                </div>
                <div className="flex justify-end space-x-2">
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
                  >
                    <HiTrash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center w-full">
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
      <Dialog open={isAddFormOpen} onOpenChange={setIsAddFormOpen}>
        {isAddFormOpen && (
          <CorporateSnsAddForm
            existingLinks={corporateSnsLinks}
            onCancel={() => setIsAddFormOpen(false)}
            onSuccess={(newLink) => {
              setCorporateSnsLinks([...corporateSnsLinks, newLink]);
              setIsAddFormOpen(false);
            }}
          />
        )}
      </Dialog>

      {/* SNSリンク編集ダイアログ */}
      <Dialog open={!!editingLink} onOpenChange={(open) => !open && setEditingLink(null)}>
        {editingLink && (
          <CorporateSnsEditForm
            link={editingLink}
            onCancel={() => setEditingLink(null)}
            onSuccess={(updatedLink) => {
              setCorporateSnsLinks(
                corporateSnsLinks.map((link) => (link.id === updatedLink.id ? updatedLink : link)),
              );
              setEditingLink(null);
            }}
          />
        )}
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog
        open={isDeleteConfirmOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingLinkId(null);
          }
          setIsDeleteConfirmOpen(open);
        }}
      >
        {deletingLinkId && (
          <CorporateSnsDeleteConfirm
            linkId={deletingLinkId}
            isRequired={
              corporateSnsLinks.find((link) => link.id === deletingLinkId)?.isRequired || false
            }
            onCancel={() => {
              setIsDeleteConfirmOpen(false);
              setDeletingLinkId(null);
            }}
            onSuccess={handleDeleteSuccess}
          />
        )}
      </Dialog>
    </div>
  );
}