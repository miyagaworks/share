// app/dashboard/corporate-member/profile/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { HiUser } from 'react-icons/hi';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { MemberProfileForm } from '@/components/corporate/MemberProfileForm';
import { CorporateMemberGuard } from '@/components/guards/CorporateMemberGuard';
import { UserData, ProfileUpdateData } from '@/types/profiles';
// テナント情報の型定義
interface TenantData {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
}
// コンポーネントに渡すテナント情報の型
interface ComponentTenantData {
  id: string;
  name: string;
  logoUrl: string | null;
  corporatePrimary: string | null;
  corporateSecondary: string | null;
}
export default function CorporateMemberProfilePage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [error, setError] = useState<string | null>(null);
  // ✅ CorporateMemberGuardがアクセス制御を行うため、ページレベルのアクセスチェックは削除
  // プロフィールデータの取得のみを実行
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) return;
    fetchUserData();
  }, [session, status]);
  // プロフィールデータの取得
  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/corporate-member/profile');
      if (!response.ok) {
        throw new Error('プロフィール情報の取得に失敗しました');
      }
      const data = await response.json();
      // APIのレスポンスに必要なプロパティが含まれていることを確認
      const userWithRequiredFields = {
        ...data.user,
        nameKana: data.user.nameKana || null, // nullの場合に備えて
      };
      setUserData(userWithRequiredFields);
      setTenantData(data.tenant);
      setError(null);
    } catch {
      setError('プロフィール情報の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };
  // プロフィール更新処理
  const handleProfileUpdate = async (updateData: ProfileUpdateData) => {
    try {
      const response = await fetch('/api/corporate-member/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'プロフィールの更新に失敗しました');
      }
      // 更新成功
      const updatedData = await response.json();
      setUserData(updatedData.user);
      // トースト通知は1回だけ表示（MemberProfileForm内の通知を削除または無効化）
      // toast.success('プロフィールを更新しました'); // <-- この行をコメントアウトまたは削除
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'プロフィールの更新に失敗しました');
      throw error; // 親コンポーネントでもエラーハンドリングできるようにエラーを再スロー
    }
  };
  // テナントデータを変換
  const convertTenantData = (data: TenantData | null): ComponentTenantData | null => {
    if (!data) return null;
    return {
      id: data.id,
      name: data.name,
      logoUrl: data.logoUrl,
      corporatePrimary: data.primaryColor || 'var(--color-corporate-primary)',
      corporateSecondary: data.secondaryColor || 'var(--color-corporate-secondary)',
    };
  };
  return (
    <CorporateMemberGuard>
      <div className="space-y-6 corporate-theme">
        <div className="flex items-center mb-6">
          <HiUser className="h-8 w-8 text-corporate-primary mr-3" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">プロフィール編集</h1>
            <p className="text-muted-foreground">
              法人ブランディングに合わせたプロフィール情報の管理
            </p>
          </div>
        </div>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Spinner size="lg" />
            <p className="mt-4 text-sm text-gray-500">プロフィール情報を読み込んでいます...</p>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <p className="text-red-700">{error}</p>
            <Button variant="corporate" onClick={() => window.location.reload()} className="mt-4">
              再読み込み
            </Button>
          </div>
        ) : (
          <MemberProfileForm
            userData={userData}
            tenantData={convertTenantData(tenantData)}
            isLoading={isLoading}
            onSave={handleProfileUpdate}
          />
        )}
      </div>
    </CorporateMemberGuard>
  );
}