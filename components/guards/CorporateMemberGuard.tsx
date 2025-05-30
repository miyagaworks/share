// components/guards/CorporateMemberGuard.tsx
import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { checkCorporateAccess } from '@/lib/corporateAccess';
import { Spinner } from '@/components/ui/Spinner';

export function CorporateMemberGuard({ children }: { children: ReactNode }) {
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    // セッションがロード中なら待機
    if (status === 'loading') {
      console.log('[CorporateMemberGuard] セッション読み込み中...');
      return;
    }

    // セッションがない場合は認証ページにリダイレクト
    if (status === 'unauthenticated' || !session) {
      console.log('[CorporateMemberGuard] セッションなし - サインインページへリダイレクト');
      router.push('/auth/signin');
      return;
    }

    console.log('[CorporateMemberGuard] セッション確認済み:', {
      userId: session.user?.id,
      email: session.user?.email,
      status,
    });

    const verifyAccess = async () => {
      try {
        console.log('[CorporateMemberGuard] アクセス権検証開始...');
        setError(null); // エラーをクリア

        // ネットワーク接続確認
        if (!navigator.onLine) {
          throw new Error('インターネット接続が利用できません。接続を確認してください。');
        }

        // APIを呼び出して最新の法人アクセス権を確認（キャッシュを使わない）
        const result = await checkCorporateAccess({ force: true });

        console.log('[CorporateMemberGuard] API結果:', result);

        // アクセス権の判定を改善
        const shouldHaveAccess =
          result.hasCorporateAccess === true ||
          result.isAdmin === true ||
          (result.userRole && ['admin', 'member'].includes(result.userRole));

        console.log('[CorporateMemberGuard] アクセス権判定:', {
          hasCorporateAccess: result.hasCorporateAccess,
          isAdmin: result.isAdmin,
          userRole: result.userRole,
          shouldHaveAccess,
        });

        if (shouldHaveAccess) {
          console.log('[CorporateMemberGuard] アクセス権付与');
          setHasAccess(true);
          setRetryCount(0); // リトライカウントをリセット
        } else {
          console.log('[CorporateMemberGuard] アクセス権なし:', result.error);
          setError(result.error || '法人メンバー機能へのアクセス権がありません');

          // 少し待ってからリダイレクト
          setTimeout(() => {
            router.push('/dashboard/corporate');
          }, 2000);
        }
      } catch (error) {
        console.error('[CorporateMemberGuard] エラー:', error);

        const errorMessage = error instanceof Error ? error.message : '不明なエラー';

        // ネットワークエラーの場合はリトライを試行
        if (
          errorMessage.includes('fetch') ||
          errorMessage.includes('network') ||
          errorMessage.includes('インターネット接続') ||
          errorMessage.includes('ERR_INTERNET_DISCONNECTED')
        ) {
          if (retryCount < 3) {
            console.log(`[CorporateMemberGuard] ネットワークエラー - リトライ ${retryCount + 1}/3`);
            setError(`接続エラーが発生しました。再試行中... (${retryCount + 1}/3)`);
            setRetryCount((prev) => prev + 1);

            // 3秒後にリトライ
            setTimeout(() => {
              verifyAccess();
            }, 3000);
            return;
          } else {
            setError('接続エラーが継続しています。ページを再読み込みしてください。');
          }
        } else {
          setError('法人メンバーアクセスの確認中にエラーが発生しました。');
        }

        // エラー後の処理
        setTimeout(() => {
          if (navigator.onLine) {
            router.push('/dashboard/corporate');
          } else {
            // オフラインの場合は再読み込みを促す
            setError('インターネット接続を確認して、ページを再読み込みしてください。');
          }
        }, 5000);
      } finally {
        setIsChecking(false);
      }
    };

    verifyAccess();
  }, [router, status, session, retryCount]);

  // ネットワーク接続状態の監視
  useEffect(() => {
    const handleOnline = () => {
      console.log('[CorporateMemberGuard] ネットワーク接続回復');
      if (error && error.includes('接続')) {
        // 接続が回復したら再チェック
        setIsChecking(true);
        setRetryCount(0);
      }
    };

    const handleOffline = () => {
      console.log('[CorporateMemberGuard] ネットワーク接続切断');
      setError('インターネット接続が切断されました。');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [error]);

  if (isChecking) {
    return (
      <div className="flex flex-col justify-center items-center p-8">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-500 mt-4">
          {retryCount > 0 ? `接続を再試行中... (${retryCount}/3)` : 'アクセス権を確認中...'}
        </span>
        {error && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800 text-sm">{error}</p>
            {error.includes('接続') && (
              <button
                onClick={() => window.location.reload()}
                className="mt-2 px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
              >
                ページを再読み込み
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // アクセス権があれば子コンポーネントを表示
  if (hasAccess) {
    return <>{children}</>;
  }

  // アクセス権がなければリダイレクト待ち画面を表示
  return (
    <div className="flex flex-col justify-center items-center p-8">
      <p className="text-red-500 mb-2">アクセス権がありません。</p>
      <p className="text-gray-500 text-sm">個人ダッシュボードにリダイレクトします...</p>
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}