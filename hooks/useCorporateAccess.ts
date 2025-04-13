// hooks/useCorporateAccess.ts
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface UseCorporateAccessOptions {
  redirectTo?: string;
  redirectIfNoAccess?: boolean;
}

interface CorporateAccessResult {
  isLoading: boolean;
  hasCorporateAccess: boolean;
  isAdmin: boolean;
  error: string | null;
}

export function useCorporateAccess(options: UseCorporateAccessOptions = {}): CorporateAccessResult {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCorporateAccess, setHasCorporateAccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  const { redirectTo = '/dashboard', redirectIfNoAccess = true } = options;

  useEffect(() => {
    const checkAccess = async () => {
      if (status === 'loading') return;

      if (!session) {
        router.push('/auth/signin');
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch('/api/corporate/access');
        const data = await response.json();

        if (response.ok && data.hasCorporateAccess) {
          setHasCorporateAccess(true);
          setIsAdmin(!!data.isAdmin);
          setError(null);
        } else {
          setHasCorporateAccess(false);
          setError(data.error || '法人アクセス権がありません');

          // リダイレクトオプションが有効な場合
          if (redirectIfNoAccess) {
            router.push(redirectTo);
          }
        }
      } catch (err) {
        console.error('法人アクセス権チェックエラー:', err);
        setHasCorporateAccess(false);
        setError('法人アクセス権の確認中にエラーが発生しました');

        // エラー時もリダイレクトオプションが有効ならリダイレクト
        if (redirectIfNoAccess) {
          router.push(redirectTo);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [session, status, router, redirectTo, redirectIfNoAccess]);

  return {
    isLoading,
    hasCorporateAccess,
    isAdmin,
    error,
  };
}