// app/dashboard/admin/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Spinner } from '@/components/ui/Spinner';
import {
  HiShieldCheck,
  HiUsers,
  HiCreditCard,
  HiKey,
  HiBell,
  HiOutlineMail,
  HiEye,
} from 'react-icons/hi';
export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    // 管理者チェック
    const checkAdminAccess = async () => {
      if (!session?.user?.id) {
        router.push('/auth/signin');
        return;
      }
      try {
        // 管理者APIを呼び出してチェック
        const response = await fetch('/api/admin/access');
        const data = await response.json();
        if (data.isSuperAdmin) {
          setIsAdmin(true);
        } else {
          // 管理者でない場合はダッシュボードにリダイレクト
          router.push('/dashboard');
        }
      } catch (error) {
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    checkAdminAccess();
  }, [session, router]);
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-2 text-gray-500">管理者権限を確認中...</p>
        </div>
      </div>
    );
  }
  if (!isAdmin) {
    return null; // リダイレクト処理中は表示なし
  }
  // 管理者メニューカード
  const AdminMenuCard = ({
    title,
    icon,
    description,
    onClick,
  }: {
    title: string;
    icon: React.ReactNode;
    description: string;
    onClick: () => void;
  }) => {
    return (
      <div
        className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
        onClick={onClick}
      >
        <div className="flex items-center mb-4">
          <div className="bg-blue-100 p-3 rounded-full mr-3">{icon}</div>
          <h3 className="text-lg font-medium">{title}</h3>
        </div>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    );
  };
  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg p-6 mb-6 text-white">
        <div className="flex items-center">
          <HiShieldCheck className="h-8 w-8 mr-3" />
          <h1 className="text-2xl font-bold">管理者ダッシュボード</h1>
        </div>
        <p className="mt-2 opacity-90">システム管理者専用のダッシュボードです。</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <AdminMenuCard
          title="ユーザー管理"
          icon={<HiUsers className="h-6 w-6 text-blue-600" />}
          description="すべてのユーザーの一覧と管理"
          onClick={() => router.push('/dashboard/admin/users')}
        />
        <AdminMenuCard
          title="プロフィール・QRコード管理"
          icon={<HiEye className="h-6 w-6 text-blue-600" />}
          description="ユーザーの公開プロフィールとQRコードの管理"
          onClick={() => router.push('/dashboard/admin/profiles')}
        />
        <AdminMenuCard
          title="サブスクリプション管理"
          icon={<HiCreditCard className="h-6 w-6 text-blue-600" />}
          description="ユーザーのサブスクリプション状態の管理"
          onClick={() => router.push('/dashboard/admin/subscriptions')}
        />
        <AdminMenuCard
          title="永久利用権管理"
          icon={<HiKey className="h-6 w-6 text-blue-600" />}
          description="永久利用権の付与と管理"
          onClick={() => router.push('/dashboard/admin/permissions')}
        />
        <AdminMenuCard
          title="お知らせ管理"
          icon={<HiBell className="h-6 w-6 text-blue-600" />}
          description="システムお知らせの作成と管理"
          onClick={() => router.push('/dashboard/admin/notifications')}
        />
        <AdminMenuCard
          title="メール配信管理"
          icon={<HiOutlineMail className="h-6 w-6 text-blue-600" />}
          description="ユーザーグループへのメール配信"
          onClick={() => router.push('/dashboard/admin/email')}
        />
      </div>
    </div>
  );
}