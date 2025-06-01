// components/guards/CorporateAdminGuard.tsx (新規作成)
'use client';
import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Spinner } from '@/components/ui/Spinner';

interface CorporateAdminGuardProps {
  children: ReactNode;
  fallbackPath?: string;
}

export function CorporateAdminGuard({
  children,
  fallbackPath = '/dashboard',
}: CorporateAdminGuardProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    const verifyAdminAccess = async () => {
      // セッションがロード中なら待機
      if (status === 'loading') {
        return;
      }

      // セッションがない場合は認証ページにリダイレクト
      if (status === 'unauthenticated' || !session) {
        router.push('/auth/signin');
        return;
      }

      try {
        // 🚀 JWT トークンから基本的な権限をチェック
        const userRole = session.user?.role;
        const isAdmin = session.user?.isAdmin;

        // 管理者権限がない場合は即座にリダイレクト
        if (!isAdmin && !['admin', 'super-admin', 'permanent-admin'].includes(userRole || '')) {
          console.log('法人管理者権限なし: フォールバックページにリダイレクト', {
            userRole,
            isAdmin,
            fallbackPath,
          });
          setError('法人管理者権限がありません');
          setTimeout(() => router.push(fallbackPath), 1500);
          return;
        }

        // 🚀 API で詳細な権限をダブルチェック
        const response = await fetch('/api/corporate/access', {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });

        if (response.ok) {
          const data = await response.json();

          if (data.isAdmin && data.hasCorporateAccess) {
            setHasAccess(true);
            console.log('法人管理者権限確認: アクセス許可', {
              userRole,
              tenantId: data.tenantId,
            });
          } else {
            setError('法人管理者権限が確認できませんでした');
            setTimeout(() => router.push(fallbackPath), 1500);
          }
        } else {
          setError('権限確認APIエラー');
          setTimeout(() => router.push(fallbackPath), 1500);
        }
      } catch (error) {
        console.error('法人管理者権限確認エラー:', error);
        setError('権限確認中にエラーが発生しました');
        setTimeout(() => router.push(fallbackPath), 1500);
      } finally {
        setIsChecking(false);
      }
    };

    verifyAdminAccess();
  }, [session, status, router, fallbackPath]);

  if (isChecking) {
    return (
      <div className="flex flex-col justify-center items-center p-8">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-500 mt-4">法人管理者権限を確認中...</span>
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col justify-center items-center p-8">
      <p className="text-red-500 mb-2">法人管理者権限がありません</p>
      <p className="text-gray-500 text-sm">適切なページにリダイレクトします...</p>
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}