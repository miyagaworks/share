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
  HiRefresh,
} from 'react-icons/hi';

// 型定義
interface Department {
  id: string;
  name: string;
  description?: string;
}

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
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CorporateUser | null>(null);
  const [resendingInvites, setResendingInvites] = useState<Record<string, boolean>>({});

  // ユーザー情報と部署情報を取得
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id) return;

      try {
        setIsLoading(true);

        // ユーザー情報取得
        const userResponse = await fetch('/api/corporate/users', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!userResponse.ok) {
          const errorData = await userResponse.json().catch(() => ({}));
          console.error('API error details:', errorData);
          throw new Error(errorData.error || 'ユーザー情報の取得に失敗しました');
        }

        const userData = await userResponse.json();
        setUsers(userData.users || []);
        setIsAdmin(userData.isAdmin);

        // 部署情報取得を改善
        const deptResponse = await fetch('/api/corporate/departments', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!deptResponse.ok) {
          const errorData = await deptResponse.json().catch(() => ({}));
          console.error('部署情報取得エラー:', errorData);
          toast.error('部署情報の取得に失敗しました。一部の機能が制限されます');
        } else {
          const deptData = await deptResponse.json();
          setDepartments(deptData.departments || []);
        }

        setError(null);
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError(err instanceof Error ? err.message : 'データを読み込めませんでした');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [session]);

  // ユーザー招待ダイアログを開く
  const handleOpenInviteDialog = () => {
    router.push('/dashboard/corporate/users/invite');
  };

  // ユーザー編集ダイアログを開く
  const handleEditUser = (user: CorporateUser) => {
    setSelectedUser(user);
    setSelectedRole(user.corporateRole || 'member');
    setSelectedDepartmentId(user.department?.id || '');
    setIsEditRoleDialogOpen(true);
  };

  // ユーザー削除ダイアログを開く
  const handleDeleteUser = (user: CorporateUser) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  // ユーザー情報更新処理
  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      setIsUpdating(true);
      console.log('更新リクエスト:', {
        userId: selectedUser.id,
        role: selectedRole,
        departmentId: selectedDepartmentId || null,
      });

      const response = await fetch(`/api/corporate/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: selectedRole,
          departmentId: selectedDepartmentId || null,
        }),
      });

      const responseData = await response.json();
      console.log('API レスポンス:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || 'ユーザー情報の更新に失敗しました');
      }

      // 成功時の処理
      // ユーザーリストを更新
      setUsers(
        users.map((user) => {
          if (user.id === selectedUser.id) {
            // 部署名を安全に取得
            const dept = departments.find((d) => d.id === selectedDepartmentId);

            // 更新されたユーザー情報
            const updatedUser: CorporateUser = {
              ...user,
              corporateRole: responseData.user.corporateRole,
              department:
                selectedDepartmentId && dept
                  ? { id: selectedDepartmentId, name: dept.name }
                  : undefined,
            };
            return updatedUser;
          }
          return user;
        }),
      );

      toast.success(`${selectedUser.name}の情報を更新しました`);
      setIsEditRoleDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('ユーザー更新エラー:', error);
      toast.error(error instanceof Error ? error.message : 'ユーザー情報の更新に失敗しました');
    } finally {
      setIsUpdating(false);
    }
  };

  // 招待再送信処理
  const handleResendInvitation = async (userId: string) => {
    try {
      // 送信中の状態を更新
      setResendingInvites((prev) => ({ ...prev, [userId]: true }));

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

      // レスポンスのJSONを取得して使用する
      const result = await response.json();

      // resultのmessageを使ってトースト表示（もしAPIから返ってくる場合）
      toast.success(result.message || '招待を再送信しました');

      // 必要に応じてユーザーリストを更新
      setUsers(
        users.map((user) => {
          if (user.id === userId) {
            return {
              ...user,
              isInvited: true,
              invitedAt: new Date().toISOString(), // 最新の招待日時に更新
            };
          }
          return user;
        }),
      );
    } catch (err) {
      console.error('招待再送信エラー:', err);
      toast.error(err instanceof Error ? err.message : '招待の再送信に失敗しました');
    } finally {
      // 送信中の状態を解除
      setResendingInvites((prev) => ({ ...prev, [userId]: false }));
    }
  };

  // 削除処理の実装
  const handleConfirmDelete = async () => {
    if (!selectedUser) return;

    try {
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

      toast.success(`${selectedUser.name}のアカウントを削除しました`);
      setUsers(users.filter((user) => user.id !== selectedUser.id));
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
      case 'restricted':
        return '閲覧のみ';
      default:
        return '一般メンバー';
    }
  };

  // 読み込み中表示
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
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 md:p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start">
          <HiOutlineExclamation className="h-6 w-6 text-red-600 mr-3 mb-2 md:mb-0" />
          <div>
            <h3 className="text-lg font-medium text-red-800">エラーが発生しました</h3>
            <p className="mt-2 text-red-700">{error}</p>
            <Button
              variant="corporateOutline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
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
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 md:p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start">
          <HiOutlineExclamation className="h-6 w-6 text-yellow-600 mr-3 mb-2 md:mb-0" />
          <div>
            <h3 className="text-lg font-medium text-yellow-800">管理者権限が必要です</h3>
            <p className="mt-2 text-yellow-700">ユーザー管理には法人管理者権限が必要です。</p>
            <Button
              className="mt-4"
              variant="corporate"
              onClick={() => router.push('/dashboard/corporate')}
            >
              管理者ダッシュボードへ戻る
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full overflow-hidden px-2 sm:px-4 corporate-theme">
      {/* ヘッダー部分 */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">ユーザー管理</h1>
          <p className="text-gray-500 mt-1">法人アカウントに所属するユーザーを管理します</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant="corporate"
            onClick={handleOpenInviteDialog}
            className="flex items-center"
          >
            <HiPlus className="mr-2 h-4 w-4" />
            ユーザーを招待
          </Button>
        </div>
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
            <h3 className="font-medium text-[#1E3A8A] mb-1">ユーザー管理について</h3>
            <p className="text-sm text-corporate-secondary break-words hyphens-auto">
              法人アカウントに所属するユーザーを管理できます。招待メールを送信してユーザーを追加したり、
              役割や部署を変更したりすることができます。管理者は全ての操作が可能で、一般メンバーは自身のプロフィールのみ編集できます。
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
                            {/* 招待中のユーザーに対しては招待再送ボタンを表示 */}
                            {user.isInvited && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-800 mr-2"
                                onClick={() => handleResendInvitation(user.id)}
                                disabled={resendingInvites[user.id]}
                              >
                                {resendingInvites[user.id] ? (
                                  <Spinner size="sm" className="mr-1" />
                                ) : (
                                  <HiRefresh className="h-4 w-4 mr-1" />
                                )}
                                招待再送
                              </Button>
                            )}

                            {/* 全てのユーザーに対して編集ボタンを表示 */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-800 mr-2"
                              onClick={() => handleEditUser(user)}
                            >
                              <HiPencil className="h-4 w-4" />
                            </Button>

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

          {/* ユーザー一覧 - スマホ表示用カード（改善） */}
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

                <div className="space-y-2 mb-4">
                  <div className="flex items-start">
                    <HiMail className="h-4 w-4 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-900 break-all">{user.email}</span>
                  </div>
                  <div className="flex items-start">
                    <HiOfficeBuilding className="h-4 w-4 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-900">
                      {user.department ? user.department.name : '未所属'}
                    </span>
                  </div>
                  <div className="flex items-start">
                    <HiUserGroup className="h-4 w-4 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
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

                {/* スマホ表示のボタン部分（改善） */}
                <div className="flex items-center justify-end space-x-2 border-t pt-3 mt-2">
                  {/* 招待中のユーザーに対しては招待再送ボタンを表示 */}
                  {user.isInvited && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-200"
                      onClick={() => handleResendInvitation(user.id)}
                      disabled={resendingInvites[user.id]}
                    >
                      {resendingInvites[user.id] ? (
                        <>
                          <Spinner size="sm" className="mr-1" />
                          送信中...
                        </>
                      ) : (
                        <>
                          <HiRefresh className="h-4 w-4 mr-1" />
                          招待再送
                        </>
                      )}
                    </Button>
                  )}

                  {/* 全てのユーザーに対して編集ボタンを表示 */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-200"
                    onClick={() => handleEditUser(user)}
                  >
                    <HiPencil className="h-4 w-4 mr-1" />
                    編集
                  </Button>

                  {/* 管理者の場合は削除ボタンを無効化 */}
                  {user.corporateRole !== 'admin' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200"
                      onClick={() => handleDeleteUser(user)}
                    >
                      <HiTrash className="h-4 w-4 mr-1" />
                      削除
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6 md:p-8 text-center w-full">
          <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <HiUser className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="mt-4 text-lg font-medium">ユーザーが登録されていません</h3>
          <p className="mt-2 text-gray-500 mb-6">
            「ユーザーを招待」ボタンをクリックして、法人アカウントにユーザーを追加してください。
          </p>
          <Button variant="corporate" onClick={handleOpenInviteDialog}>
            <HiPlus className="mr-2 h-4 w-4" />
            ユーザーを招待
          </Button>
        </div>
      )}

      {/* 役割編集ダイアログ（レスポンシブ改善） */}
      <Dialog open={isEditRoleDialogOpen} onOpenChange={setIsEditRoleDialogOpen}>
        <div className="p-4 sm:p-6 w-full max-w-md mx-auto">
          <h2 className="text-xl font-bold mb-4">ユーザー情報を編集</h2>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 mr-3 flex-shrink-0">
                  <HiUserCircle className="h-8 w-8" />
                </div>
                <div className="overflow-hidden">
                  <div className="font-medium truncate">{selectedUser.name}</div>
                  <div className="text-sm text-gray-500 truncate">{selectedUser.email}</div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">役割</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isUpdating}
                >
                  <option value="admin">管理者（全ての権限）</option>
                  <option value="member">メンバー（通常権限）</option>
                  <option value="restricted">制限付き（閲覧のみ）</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">部署</label>
                <select
                  value={selectedDepartmentId}
                  onChange={(e) => setSelectedDepartmentId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isUpdating}
                >
                  <option value="">部署なし</option>
                  {departments && departments.length > 0 ? (
                    departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))
                  ) : (
                    <option disabled>部署情報を読み込めませんでした</option>
                  )}
                </select>
                {departments.length === 0 && (
                  <p className="text-xs text-yellow-600">
                    部署情報を取得できませんでした。部署管理ページで部署を設定してください。
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="corporateOutline"
                  onClick={() => {
                    setIsEditRoleDialogOpen(false);
                    setSelectedUser(null);
                  }}
                  type="button"
                  disabled={isUpdating}
                >
                  キャンセル
                </Button>
                <Button
                  variant="corporate"
                  onClick={handleUpdateUser}
                  type="button"
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      更新中...
                    </>
                  ) : (
                    '更新する'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Dialog>

      {/* 削除確認ダイアログ（レスポンシブ改善） */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <div className="p-4 sm:p-6 w-full max-w-md mx-auto">
          <h2 className="text-xl font-bold mb-4">ユーザーを削除</h2>
          {selectedUser && (
            <>
              <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <HiOutlineExclamation className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-700">
                      <strong className="break-words">{selectedUser.name}</strong>
                      <br />
                      <span className="break-all">({selectedUser.email})</span>
                      <br />
                      を削除します。この操作は元に戻せません。
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                <Button
                  variant="corporateOutline"
                  onClick={() => {
                    setIsDeleteDialogOpen(false);
                    setSelectedUser(null); // 選択ユーザーもクリア
                  }}
                  type="button"
                  className="w-full sm:w-auto"
                >
                  キャンセル
                </Button>
                <Button variant="destructive" onClick={handleConfirmDelete} type="button">
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