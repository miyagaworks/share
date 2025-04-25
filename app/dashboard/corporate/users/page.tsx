// app/dashboard/corporate/users/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Dialog } from '@/components/ui/Dialog';
import { toast } from 'react-hot-toast';
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiUser,
  HiUserGroup,
  HiMail,
  HiOutlineExclamation,
  HiInformationCircle,
  HiUserCircle,
  HiOfficeBuilding,
} from 'react-icons/hi';

// 型定義（実際のプロジェクトの型に合わせて調整してください）
interface CorporateUser {
  id: string;
  name: string;
  email: string;
  corporateRole?: string;
  department?: {
    id: string;
    name: string;
  };
  isAdmin: boolean;
  isInvited?: boolean;
  invitedAt?: string;
  createdAt: string;
}

export default function CorporateUsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<CorporateUser[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // ユーザー情報を取得
  useEffect(() => {
    const fetchUsers = async () => {
      if (!session?.user?.id) return;

      try {
        setIsLoading(true);

        // 前のコード: const response = await fetch('/api/corporate/users');
        // エラーの詳細を取得するために修正
        const response = await fetch('/api/corporate/users', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        // エラーレスポンスの詳細な処理
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API error details:', errorData);
          throw new Error(errorData.error || 'ユーザー情報の取得に失敗しました');
        }

        const data = await response.json();
        setUsers(data.users || []);
        setIsAdmin(data.isAdmin);
        setError(null);
      } catch (err) {
        console.error('ユーザー情報取得エラー:', err);
        setError(err instanceof Error ? err.message : 'ユーザー情報を読み込めませんでした');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [session]);

  // ユーザー招待ダイアログを開く
  const handleOpenInviteDialog = () => {
    // モックのトースト通知ではなく、実際に遷移するように修正
    router.push('/dashboard/corporate/users/invite');
  };

  // ユーザー編集ダイアログを開く
  const handleEditUser = (user: CorporateUser) => {
    toast.success(`${user.name}の編集ダイアログを開きます（実装予定）`);
  };

  // ユーザー削除ダイアログを開く
  const handleDeleteUser = (user: CorporateUser) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  // 招待再送信処理
  const handleResendInvitation = async (userId: string) => {
    try {
      // 処理中の表示などがあれば追加

      // APIを呼び出す
      const response = await fetch(`/api/corporate/users/${userId}/resend-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '招待の再送信に失敗しました');
      }

      // 成功メッセージを表示
      toast.success('招待を再送信しました');
    } catch (err) {
      console.error('招待再送信エラー:', err);
      toast.error(err instanceof Error ? err.message : '招待の再送信に失敗しました');
    }
  };

  // 削除ボタン
  const [selectedUser, setSelectedUser] = useState<CorporateUser | null>(null);

  // 削除処理の実装
  const handleConfirmDelete = async () => {
    if (!selectedUser) return;

    try {
      // 削除処理開始
      const response = await fetch(`/api/corporate/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ユーザーの削除に失敗しました');
      }

      // 成功時の処理
      toast.success(`${selectedUser.name}のアカウントを削除しました`);

      // ユーザーリストから削除
      setUsers(users.filter((user) => user.id !== selectedUser.id));

      // ダイアログを閉じる
      setIsDeleteDialogOpen(false);
    } catch (err) {
      console.error('ユーザー削除エラー:', err);
      toast.error(err instanceof Error ? err.message : 'ユーザーの削除に失敗しました');
    }
  };

  // 役割名の表示
  const getRoleName = (role?: string) => {
    switch (role) {
      case 'admin':
        return '管理者';
      case 'member':
        return '一般メンバー';
      case 'viewer':
        return '閲覧のみ';
      default:
        return '一般メンバー';
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
            <p className="mt-2 text-yellow-700">ユーザー管理には法人管理者権限が必要です。</p>
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
          <h1 className="text-2xl font-bold">ユーザー管理</h1>
          <p className="text-gray-500 mt-1">法人アカウントに所属するユーザーを管理します</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleOpenInviteDialog} className="flex items-center">
            <HiPlus className="mr-2 h-4 w-4" />
            ユーザーを招待
          </Button>
        </div>
      </div>

      {/* 説明セクション */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 w-full">
        <div className="flex flex-col sm:flex-row">
          <HiInformationCircle className="text-blue-500 h-5 w-5 flex-shrink-0 mb-2 sm:mb-0 sm:mr-2 sm:mt-1" />
          <div className="w-full">
            <h3 className="font-medium text-blue-800 mb-1">ユーザー管理について</h3>
            <p className="text-sm text-blue-700 break-words hyphens-auto text-justify">
              法人アカウントに所属するユーザーを管理できます。招待メールを送信してユーザーを追加したり、
              役割を変更したりすることができます。管理者は全ての操作が可能で、一般メンバーは自身のプロフィールのみ編集できます。
            </p>
          </div>
        </div>
      </div>

      {/* ユーザー一覧 - PC表示用テーブル */}
      {users.length > 0 ? (
        <>
          <div className="hidden sm:block w-full">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ユーザー
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        メール
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        部署
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        役割
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        状態
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                              <HiUserCircle className="h-8 w-8" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 truncate max-w-[150px] sm:max-w-[200px]">
                            {user.email}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {user.department ? user.department.name : '未所属'}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.corporateRole === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {getRoleName(user.corporateRole)}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          {user.isInvited ? (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              招待中
                            </span>
                          ) : (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              アクティブ
                            </span>
                          )}
                        </td>
                        {/* PC表示のボタン部分 */}
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end">
                            {user.isInvited ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-800 mr-2"
                                onClick={() => handleResendInvitation(user.id)}
                              >
                                招待再送
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-800 mr-2"
                                onClick={() => handleEditUser(user)}
                              >
                                <HiPencil className="h-4 w-4" />
                              </Button>
                            )}
                            {/* 管理者の場合は削除ボタンを無効化 */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`${
                                user.corporateRole === 'admin'
                                  ? 'text-gray-400 cursor-not-allowed'
                                  : 'text-red-600 hover:text-red-800'
                              }`}
                              onClick={() =>
                                user.corporateRole !== 'admin' && handleDeleteUser(user)
                              }
                              title={
                                user.corporateRole === 'admin' ? '管理者は削除できません' : '削除'
                              }
                            >
                              <HiTrash className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ユーザー一覧 - スマホ表示用カード */}
          <div className="block sm:hidden space-y-4 w-full">
            {users.map((user) => (
              <div key={user.id} className="bg-white rounded-lg border border-gray-200 p-4 w-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                      <HiUserCircle className="h-8 w-8" />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    </div>
                  </div>
                  <div>
                    {user.isInvited ? (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        招待中
                      </span>
                    ) : (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        アクティブ
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1 mb-3">
                  <div className="flex items-start">
                    <HiMail className="h-4 w-4 text-gray-500 mt-0.5 mr-2" />
                    <span className="text-sm text-gray-900 break-all">{user.email}</span>
                  </div>
                  <div className="flex items-start">
                    <HiOfficeBuilding className="h-4 w-4 text-gray-500 mt-0.5 mr-2" />
                    <span className="text-sm text-gray-900">
                      {user.department ? user.department.name : '未所属'}
                    </span>
                  </div>
                  <div className="flex items-start">
                    <HiUserGroup className="h-4 w-4 text-gray-500 mt-0.5 mr-2" />
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.corporateRole === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {getRoleName(user.corporateRole)}
                    </span>
                  </div>
                </div>

                {/* スマホ表示のボタン部分 */}
                <div className="flex items-center justify-end space-x-2">
                  {user.isInvited ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => handleResendInvitation(user.id)}
                    >
                      招待再送
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => handleEditUser(user)}
                    >
                      <HiPencil className="h-4 w-4" />
                    </Button>
                  )}

                  {/* 管理者の場合は削除ボタンを無効化 */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`${
                      user.corporateRole === 'admin'
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-red-600 hover:text-red-800'
                    }`}
                    onClick={() => user.corporateRole !== 'admin' && handleDeleteUser(user)}
                    title={user.corporateRole === 'admin' ? '管理者は削除できません' : '削除'}
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
            <HiUser className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="mt-4 text-lg font-medium">ユーザーが登録されていません</h3>
          <p className="mt-2 text-gray-500 mb-6">
            「ユーザーを招待」ボタンをクリックして、法人アカウントにユーザーを追加してください。
          </p>
          <Button onClick={handleOpenInviteDialog}>
            <HiPlus className="mr-2 h-4 w-4" />
            ユーザーを招待
          </Button>
        </div>
      )}

      {/* 各種ダイアログは実際の実装に合わせて作成してください */}
      {/* 例: ユーザー招待ダイアログ */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">ユーザーを招待</h2>
          <p>招待ダイアログの内容（実装予定）</p>
          <Button className="mt-4" onClick={() => setIsInviteDialogOpen(false)}>
            閉じる
          </Button>
        </div>
      </Dialog>

      {/* 役割編集ダイアログ */}
      <Dialog open={isEditRoleDialogOpen} onOpenChange={setIsEditRoleDialogOpen}>
        {/* 役割編集ダイアログの内容はここに実装 */}
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">ユーザーを削除</h2>
          {selectedUser && (
            <>
              <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <HiOutlineExclamation className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-700">
                      <strong>{selectedUser.name}</strong> ({selectedUser.email}) を削除します。
                      <br />
                      この操作は元に戻せません。
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleteDialogOpen(false);
                    setSelectedUser(null); // 選択ユーザーもクリア
                  }}
                  type="button"
                >
                  キャンセル
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleConfirmDelete}
                  type="button"
                >
                  削除する
                </Button>
              </div>
            </>
          )}
        </div>
      </Dialog>
    </div>
  );
}