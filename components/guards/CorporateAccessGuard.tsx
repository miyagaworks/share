// components/guards/CorporateAccessGuard.tsx
'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { HiOutlineExclamation } from 'react-icons/hi';

interface CorporateAccessGuardProps {
  children: ReactNode;
}

export function CorporateAccessGuard({ children }: CorporateAccessGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasCorporateAccess, setHasCorporateAccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkCorporateAccess = async () => {
      if (status === 'loading') return;

      if (!session) {
        router.push('/auth/signin');
        return;
      }

      try {
        setIsLoading(true);
        // テナント情報が存在するかチェック
        const response = await fetch('/api/corporate/access');

        if (response.ok) {
          const data = await response.json();
          if (data.hasCorporateAccess) {
            // テナント情報が取得できた場合は法人アカウント
            setHasCorporateAccess(true);
            setError(null);
          } else {
            // アクセス権がない場合
            setHasCorporateAccess(false);
            setError(data.error || '法人プランにアクセスする権限がありません');
          }
        } else {
          // エラーの場合は法人アカウントではない
          setHasCorporateAccess(false);
          const errorData = await response.json();
          setError(errorData.error || '法人テナント情報の取得に失敗しました');
          console.log('法人テナント情報が見つかりません - アクセス拒否');
        }
      } catch (error) {
        console.error('法人アカウントチェックエラー:', error);
        setHasCorporateAccess(false);
        setError('法人アカウント情報の取得中にエラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    };

    checkCorporateAccess();
  }, [session, status, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!hasCorporateAccess) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
        <div className="flex items-start">
          <HiOutlineExclamation className="h-6 w-6 text-yellow-600 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-medium text-yellow-800 mb-2">
              法人プランへのアクセス権がありません
            </h3>
            <p className="text-yellow-700 mb-4">
              {error || 'この機能を利用するには法人プランへのアップグレードが必要です。'}
              個人ダッシュボードに戻るか、利用プランページで法人プランにアップグレードしてください。
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => router.push('/dashboard')}>個人ダッシュボードへ</Button>
              <Button variant="outline" onClick={() => router.push('/dashboard/subscription')}>
                利用プランを見る
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 法人アクセス権があれば子コンポーネントを表示
  return <>{children}</>;
}