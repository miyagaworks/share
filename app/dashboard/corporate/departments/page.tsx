// app/dashboard/corporate/departments/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Input } from '@/components/ui/Input';
import { HiPlus, HiPencil, HiTrash, HiOfficeBuilding, HiInformationCircle, HiUsers } from 'react-icons/hi';
import { toast } from 'react-hot-toast';

// 部署情報の型定義
interface Department {
  id: string;
  name: string;
  description: string | null;
  userCount?: number;
}

// テナント情報の型定義
interface TenantData {
  id: string;
  name: string;
  departments: Department[];
  users: Array<{
    id: string;
    name: string | null;
    email: string;
    departmentId: string | null;
  }>;
}

export default function DepartmentsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 部署追加・編集モーダル用の状態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [departmentName, setDepartmentName] = useState('');
  const [departmentDescription, setDepartmentDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // テナント情報を取得
  useEffect(() => {
    const fetchTenantData = async () => {
      if (!session?.user?.id) return;

      try {
        setIsLoading(true);

        // テナント情報取得API
        const response = await fetch('/api/corporate/tenant');

        if (!response.ok) {
          throw new Error('テナント情報の取得に失敗しました');
        }

        const data = await response.json();
        setTenantData(data.tenant);
        setIsAdmin(data.userRole === 'admin');

        // 部署情報を取得
        const deptResponse = await fetch('/api/corporate/departments');

        if (!deptResponse.ok) {
          throw new Error('部署情報の取得に失敗しました');
        }

        const deptData = await deptResponse.json();
        setDepartments(deptData.departments || []);
        setError(null);
      } catch (err) {
        console.error('テナント情報取得エラー:', err);
        setError('テナント情報を読み込めませんでした');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenantData();
  }, [session]);

  // 部署追加モーダルを開く
  const openAddModal = () => {
    setIsEditing(false);
    setEditingDepartment(null);
    setDepartmentName('');
    setDepartmentDescription('');
    setIsModalOpen(true);
  };

  // 部署編集モーダルを開く
  const openEditModal = (department: Department) => {
    setIsEditing(true);
    setEditingDepartment(department);
    setDepartmentName(department.name);
    setDepartmentDescription(department.description || '');
    setIsModalOpen(true);
  };

  // モーダルを閉じる
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // 部署追加・更新処理
  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!departmentName.trim()) {
      toast.error('部署名を入力してください');
      return;
    }

    try {
      setIsSaving(true);

      if (isEditing && editingDepartment) {
        // 部署更新API
        const response = await fetch(`/api/corporate/departments/${editingDepartment.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: departmentName,
            description: departmentDescription || null,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || '部署の更新に失敗しました');
        }

        const data = await response.json();

        // APIから返ってきた値を使用
        const updatedDepartments = departments.map((dept) =>
          dept.id === editingDepartment.id
            ? {
                ...dept,
                name: data.department.name,
                description: data.department.description,
              }
            : dept,
        );
        setDepartments(updatedDepartments);

        toast.success('部署情報を更新しました');
      } else {
        // 部署追加API
        const response = await fetch('/api/corporate/departments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: departmentName,
            description: departmentDescription || null,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || '部署の追加に失敗しました');
        }

        const data = await response.json();

        // 新しい部署を追加
        const newDepartment = {
          id: data.department.id,
          name: data.department.name,
          description: data.department.description,
          userCount: 0,
        };

        setDepartments([...departments, newDepartment]);
        toast.success('部署を追加しました');
      }

      // モーダルを閉じる
      closeModal();
    } catch (err) {
      console.error('部署保存エラー:', err);
      toast.error(err instanceof Error ? err.message : '部署の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // 部署削除処理
  const handleDeleteDepartment = async (department: Department) => {
    if (department.userCount && department.userCount > 0) {
      toast.error(
        'ユーザーが所属している部署は削除できません。先にユーザーを移動または削除してください。',
      );
      return;
    }

    if (
      !confirm(`「${department.name}」部署を削除してもよろしいですか？この操作は元に戻せません。`)
    ) {
      return;
    }

    try {
      // 部署削除API
      const response = await fetch(`/api/corporate/departments/${department.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '部署の削除に失敗しました');
      }

      // 部署リストから削除
      setDepartments(departments.filter((dept) => dept.id !== department.id));
      toast.success('部署を削除しました');
    } catch (err) {
      console.error('部署削除エラー:', err);
      toast.error(err instanceof Error ? err.message : '部署の削除に失敗しました');
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
        <h3 className="text-lg font-medium text-red-800 mb-2">エラーが発生しました</h3>
        <p className="text-red-700">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          再読み込み
        </Button>
      </div>
    );
  }

  // テナントデータがない場合
  if (!tenantData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-yellow-800 mb-2">法人プランが有効ではありません</h3>
        <p className="text-yellow-700">法人プランにアップグレードしてこの機能をご利用ください。</p>
        <Button className="mt-4" onClick={() => router.push('/dashboard/subscription')}>
          プランを見る
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー部分 */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">部署管理</h1>
          <p className="text-gray-500 mt-1">部署を作成・管理し、ユーザーを適切に分類します</p>
        </div>

        {isAdmin && (
          <Button onClick={openAddModal} className="flex items-center">
            <HiPlus className="mr-2 h-4 w-4" />
            部署を追加
          </Button>
        )}
      </div>

      {/* 部署リスト */}
      {departments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <HiOfficeBuilding className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="font-medium">{dept.name}</h3>
                  </div>

                  {isAdmin && (
                    <div className="flex space-x-1">
                      <button
                        onClick={() => openEditModal(dept)}
                        className="text-gray-500 hover:text-blue-600"
                      >
                        <HiPencil className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDepartment(dept)}
                        className="text-gray-500 hover:text-red-600"
                        disabled={dept.userCount ? dept.userCount > 0 : false}
                      >
                        <HiTrash className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-sm text-gray-500 mb-4 min-h-[40px]">
                  {dept.description || '説明なし'}
                </p>

                <div className="flex items-center text-sm">
                  <HiUsers className="h-4 w-4 text-gray-500 mr-1" />
                  <span className="text-gray-500">{dept.userCount || 0}人のユーザー</span>
                </div>
              </div>

              <div className="border-t border-gray-200 bg-gray-50 px-6 py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/dashboard/corporate/users?department=${dept.id}`)}
                >
                  ユーザーを見る
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
          <div className="bg-blue-100 p-3 rounded-full inline-flex mb-4">
            <HiOfficeBuilding className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium mb-2">部署がまだ登録されていません</h3>
          <p className="text-gray-500 mb-6">
            「部署を追加」ボタンをクリックして、最初の部署を作成してください。
          </p>
          {isAdmin && (
            <Button onClick={openAddModal}>
              <HiPlus className="mr-2 h-4 w-4" />
              部署を追加
            </Button>
          )}
        </div>
      )}

      {/* 部署追加/編集モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">
                {isEditing ? '部署を編集' : '新しい部署を追加'}
              </h3>

              <form onSubmit={handleSaveDepartment}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      部署名 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="name"
                      type="text"
                      value={departmentName}
                      onChange={(e) => setDepartmentName(e.target.value)}
                      required
                      placeholder="例: 営業部、マーケティング部、開発部"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      説明（任意）
                    </label>
                    <textarea
                      id="description"
                      value={departmentDescription}
                      onChange={(e) => setDepartmentDescription(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="部署の説明や役割を入力してください"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <Button type="button" variant="outline" onClick={closeModal}>
                    キャンセル
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        保存中...
                      </>
                    ) : (
                      '保存'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 部署管理のヒント */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 w-full">
        <div className="flex flex-row items-start">
          <HiInformationCircle className="text-blue-900 h-5 w-5 flex-shrink-0 mr-2 mt-0.5" />
          <div className="w-full">
            <h3 className="font-medium text-blue-900 mb-1">部署管理について</h3>
            <p className="text-sm text-corporate-secondary break-words hyphens-auto text-justify">
              法人アカウントに所属する部署を管理できます。部署を作成するとユーザーを適切に分類でき、
              組織の構造を明確にすることができます。部署名は簡潔かつ明確にすることをおすすめします。
              ユーザーが所属している部署は削除できません。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}