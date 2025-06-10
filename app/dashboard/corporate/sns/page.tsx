// app/dashboard/corporate/sns/page.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
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
  HiMenuAlt4,
} from 'react-icons/hi';
import { CorporateSnsLink } from './types';
import { CorporateSnsAddForm, CorporateSnsEditForm, CorporateSnsDeleteConfirm } from './components';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// ドラッグアイテムの型定義
interface DragItem {
  id: string;
  index: number;
}

// ドラッグアイテムタイプ
const ITEM_TYPE = 'snsLink';

// ドラッグ可能なSNSリンク項目コンポーネント
const DraggableSnsItem = ({
  link,
  index,
  moveItem,
  isAdmin,
  onEdit,
  onDelete,
  onDragEnd,
}: {
  link: CorporateSnsLink;
  index: number;
  moveItem: (fromIndex: number, toIndex: number) => void;
  isAdmin: boolean;
  onEdit: (link: CorporateSnsLink) => void;
  onDelete: (id: string) => void;
  onDragEnd: () => void;
}) => {
  const ref = useRef<HTMLTableRowElement>(null);

  // ドラッグの設定
  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: { id: link.id, index } as DragItem,
    canDrag: isAdmin, // 管理者のみドラッグ可能
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: () => {
      onDragEnd(); // ドラッグ終了時に呼び出す
    },
  });

  // ドロップの設定
  const [, drop] = useDrop({
    accept: ITEM_TYPE,
    hover: (item: DragItem) => {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      // 自分自身の上にドラッグしている場合は何もしない
      if (dragIndex === hoverIndex) {
        return;
      }

      // ドラッグしている要素の位置を更新
      moveItem(dragIndex, hoverIndex);
      // 監視しているインデックスを更新
      item.index = hoverIndex;
    },
  });

  // ドラッグとドロップの参照を結合
  drag(drop(ref));

  return (
    <tr
      ref={ref}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className={`hover:bg-gray-50 ${isDragging ? 'bg-blue-50' : ''}`}
    >
      {isAdmin && (
        <td className="px-2 text-center cursor-move">
          <HiMenuAlt4 className="mx-auto h-5 w-5 text-gray-400" />
        </td>
      )}
      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <ImprovedSnsIcon platform={link.platform as SnsPlatform} size={24} color="original" />
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
        <div className="flex items-center justify-end gap-2">
          <button
            className="h-[48px] px-3 bg-white border border-blue-200 text-blue-600 rounded-md hover:bg-blue-50 transition-colors text-base sm:text-sm flex items-center justify-center"
            onClick={() => onEdit(link)}
          >
            <HiPencil className="h-4 w-4" />
          </button>
          <button
            className="h-[48px] px-3 bg-white border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition-colors text-base sm:text-sm flex items-center justify-center"
            onClick={() => onDelete(link.id)}
          >
            <HiTrash className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

// ドラッグ可能なSNSリンクカードコンポーネント（モバイル用）
const DraggableSnsCard = ({
  link,
  index,
  moveItem,
  isAdmin,
  onEdit,
  onDelete,
  onDragEnd,
}: {
  link: CorporateSnsLink;
  index: number;
  moveItem: (fromIndex: number, toIndex: number) => void;
  isAdmin: boolean;
  onEdit: (link: CorporateSnsLink) => void;
  onDelete: (id: string) => void;
  onDragEnd: () => void;
}) => {
  const ref = useRef<HTMLTableRowElement>(null);

  // ドラッグの設定
  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: { id: link.id, index } as DragItem,
    canDrag: isAdmin, // 管理者のみドラッグ可能
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: () => {
      onDragEnd(); // ドラッグ終了時に呼び出す
    },
  });

  // ドロップの設定
  const [, drop] = useDrop({
    accept: ITEM_TYPE,
    hover: (item: DragItem) => {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      // 自分自身の上にドラッグしている場合は何もしない
      if (dragIndex === hoverIndex) {
        return;
      }

      // ドラッグしている要素の位置を更新
      moveItem(dragIndex, hoverIndex);
      // 監視しているインデックスを更新
      item.index = hoverIndex;
    },
  });

  // ドラッグとドロップの参照を結合
  drag(drop(ref));

  return (
    <div
      ref={ref}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className={`bg-white rounded-lg border border-gray-200 p-4 w-full ${
        isDragging ? 'bg-blue-50 shadow-lg' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          {isAdmin && (
            <div className="mr-4 cursor-move">
              <HiMenuAlt4 className="h-5 w-5 text-gray-400" />
            </div>
          )}
          <ImprovedSnsIcon platform={link.platform as SnsPlatform} size={24} color="original" />
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
      </div>
      <div className="flex justify-end space-x-2">
        <button
          className="h-[48px] px-3 bg-white border border-blue-200 text-blue-600 rounded-md hover:bg-blue-50 transition-colors text-base sm:text-sm flex items-center justify-center"
          onClick={() => onEdit(link)}
        >
          <HiPencil className="h-4 w-4" />
        </button>
        <button
          className="h-[48px] px-3 bg-white border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition-colors text-base sm:text-sm flex items-center justify-center"
          onClick={() => onDelete(link.id)}
        >
          <HiTrash className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

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
      } catch {
        setError('法人共通SNSリンク情報を読み込めませんでした');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCorporateSnsLinks();
  }, [session]);

  // アイテムの順序を変更する関数
  const moveItem = (fromIndex: number, toIndex: number) => {
    setCorporateSnsLinks((prevLinks) => {
      const updatedLinks = [...prevLinks];
      const [movedItem] = updatedLinks.splice(fromIndex, 1);
      updatedLinks.splice(toIndex, 0, movedItem);
      return updatedLinks;
    });
  };

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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'SNSリンクの同期に失敗しました');
    } finally {
      setIsSyncing(false);
    }
  };

  // ドラッグ終了時に呼び出される関数
  const handleDragEnd = async () => {
    try {
      // APIに新しい順序を送信
      const response = await fetch('/api/corporate/sns', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'reorder',
          data: corporateSnsLinks.map((item) => item.id),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '表示順の更新に失敗しました');
      }

      toast.success('SNSリンクの表示順を更新しました');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '表示順の更新に失敗しました');
      // エラーの場合は元の順序に戻す
      const response = await fetch('/api/corporate/sns');
      if (response.ok) {
        const data = await response.json();
        setCorporateSnsLinks(data.snsLinks || []);
      }
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
            <button
              className="mt-4 h-[48px] px-4 border border-blue-300 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition-colors text-base sm:text-sm flex items-center justify-center"
              onClick={() => window.location.reload()}
            >
              再読み込み
            </button>
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
            <button
              className="mt-4 h-[48px] px-4 bg-[#1E3A8A] text-white rounded-md hover:bg-[#122153] transition-colors text-base sm:text-sm flex items-center justify-center"
              onClick={() => router.push('/dashboard/corporate')}
            >
              管理者ダッシュボードへ戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6 max-w-full overflow-hidden px-2 sm:px-4 corporate-theme">
        {/* ヘッダー部分 */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">法人共通SNS設定</h1>
            <p className="text-gray-500 mt-1">全社員に共通のSNSリンクを設定・管理します</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              className="h-[48px] px-4 bg-[#1E3A8A] text-white rounded-md hover:bg-[#122153] transition-colors text-base sm:text-sm flex items-center justify-center"
              onClick={() => setIsAddFormOpen(true)}
            >
              <HiPlus className="mr-2 h-4 w-4" />
              SNSリンクを追加
            </button>
            <button
              className="h-[48px] px-4 border border-blue-300 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition-colors text-base sm:text-sm flex items-center justify-center"
              onClick={handleSyncToUsers}
              disabled={isSyncing || corporateSnsLinks.length === 0}
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
            </button>
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
                        {isAdmin && (
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                            順序
                          </th>
                        )}
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
                      {corporateSnsLinks.map((link, index) => (
                        <DraggableSnsItem
                          key={link.id}
                          link={link}
                          index={index}
                          moveItem={moveItem}
                          isAdmin={isAdmin}
                          onEdit={handleEditLink}
                          onDelete={handleDeleteConfirm}
                          onDragEnd={handleDragEnd}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* SNSリンク一覧 - スマホ表示用カード */}
            <div className="block sm:hidden space-y-4 w-full">
              {corporateSnsLinks.map((link, index) => (
                <DraggableSnsCard
                  key={link.id}
                  link={link}
                  index={index}
                  moveItem={moveItem}
                  isAdmin={isAdmin}
                  onEdit={handleEditLink}
                  onDelete={handleDeleteConfirm}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </div>

            {/* 説明セクション */}
            <div
              className="mt-6 rounded-md p-4"
              style={{
                backgroundColor: '#1E3A8A10',
                borderColor: '#1E3A8A30',
                borderWidth: '1px',
              }}
            >
              <div className="flex flex-row items-start">
                <HiInformationCircle className="text-[#1E3A8A] h-5 w-5 flex-shrink-0 mr-2 mt-0.5" />
                <div className="w-full">
                  <h3 className="font-medium text-[#1E3A8A] mb-1">法人共通SNS設定について</h3>
                  <p className="text-sm text-corporate-secondary break-words hyphens-auto text-justify">
                    ここで設定したSNSリンクは法人アカウントに所属するすべてのユーザーのプロフィールに表示されます。
                    「必須」に設定すると、そのSNSリンクは全ユーザーのプロフィールに自動的に追加され、
                    ユーザーが削除できなくなります。
                    {isAdmin && (
                      <span className="block mt-2">
                        ドラッグ&ドロップで並び順を変更することができます。順序はプロフィールの表示順に反映されます。
                      </span>
                    )}
                  </p>
                </div>
              </div>
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
            <button
              className="h-[48px] px-4 bg-[#1E3A8A] text-white rounded-md hover:bg-[#122153] transition-colors text-base sm:text-sm flex items-center justify-center mx-auto"
              onClick={() => setIsAddFormOpen(true)}
            >
              <HiPlus className="mr-2 h-4 w-4" />
              SNSリンクを追加
            </button>
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
                  corporateSnsLinks.map((link) =>
                    link.id === updatedLink.id ? updatedLink : link,
                  ),
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
    </DndProvider>
  );
}