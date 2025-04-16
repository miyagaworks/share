// hooks/useCorporateAccess.ts
// 法人アクセス権を確認するためのカスタムフック

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { corporateAccessState, checkCorporateAccess } from '@/lib/corporateAccessState';

interface UseCorporateAccessOptions {
  redirectIfNoAccess?: boolean;
  redirectPath?: string;
  checkOnMount?: boolean;
  forceCheck?: boolean;
}

export function useCorporateAccess({
  redirectIfNoAccess = true,
  redirectPath = '/dashboard',
  checkOnMount = true,
  forceCheck = false,
}: UseCorporateAccessOptions = {}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasCorporateAccess, setHasCorporateAccess] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  // この環境が開発環境かどうかを判断する
  const isDevelopment = process.env.NODE_ENV === 'development';

  // 再レンダリングを強制するための関数
  const [renderTrigger, setRenderTrigger] = useState(0);
  const forceRender = () => setRenderTrigger((prev) => prev + 1);

  useEffect(() => {
    // デバッグログ
    console.log('[useCorporateAccess] フック初期化:', {
      sessionStatus: status,
      redirectIfNoAccess,
      checkOnMount,
      forceCheck,
      currentState: corporateAccessState,
    });

    // グローバル状態変更イベントリスナー
    const handleAccessStateChange = () => {
      console.log('[useCorporateAccess] グローバル状態変更検知:', corporateAccessState);
      setHasCorporateAccess(corporateAccessState.hasAccess === true);
      setError(corporateAccessState.error || null);
      forceRender();
    };

    // イベントリスナーを追加
    if (typeof window !== 'undefined') {
      window.addEventListener('corporateAccessChanged', handleAccessStateChange as EventListener);
    }

    // コンポーネントアンマウント時にリスナーを削除
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(
          'corporateAccessChanged',
          handleAccessStateChange as EventListener,
        );
      }
    };
  }, []);

  // セッション状態が変わった時、またはマウント時にアクセスチェック
  useEffect(() => {
    const checkAccess = async () => {
      console.log('[useCorporateAccess] アクセスチェック開始:', {
        sessionStatus: status,
        checkOnMount,
        forceCheck,
      });

      // セッションがロード中またはチェックしない設定なら終了
      if (status === 'loading' || !checkOnMount) {
        return;
      }

      // ユーザーがログインしていない場合
      if (!session) {
        console.log('[useCorporateAccess] セッションなし');
        setHasCorporateAccess(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        console.log('[useCorporateAccess] corporateAccessState APIを呼び出し中...');

        // キャッシュされた状態があり、force=falseの場合はそれを使用
        if (
          !forceCheck &&
          corporateAccessState.hasAccess !== null &&
          corporateAccessState.lastChecked > 0 &&
          Date.now() - corporateAccessState.lastChecked < 30000 // 30秒未満
        ) {
          console.log('[useCorporateAccess] キャッシュ状態を使用:', corporateAccessState);
          setHasCorporateAccess(corporateAccessState.hasAccess === true);
        } else {
          // APIを呼び出して状態を更新
          const result = await checkCorporateAccess(forceCheck);
          console.log('[useCorporateAccess] API結果:', result);
          setHasCorporateAccess(result.hasAccess === true);
          setError(result.error || null);
        }
      } catch (err) {
        console.error('[useCorporateAccess] エラー:', err);
        setError(err instanceof Error ? err.message : String(err));
        setHasCorporateAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [session, status, checkOnMount, forceCheck, renderTrigger]);

  // アクセス権に基づいてリダイレクト
  useEffect(() => {
    // デバッグモードでは開発環境でリダイレクトをスキップ
    const shouldRedirect = redirectIfNoAccess && !isDevelopment;

    if (!isLoading && hasCorporateAccess === false && shouldRedirect) {
      console.log('[useCorporateAccess] アクセス権なし、リダイレクト:', redirectPath);
      router.push(redirectPath);
    }
  }, [hasCorporateAccess, isLoading, redirectIfNoAccess, redirectPath, router, isDevelopment]);

  // 強制的にアクセスチェックを実行する関数
  const refreshAccess = async () => {
    setIsLoading(true);
    try {
      const result = await checkCorporateAccess(true);
      setHasCorporateAccess(result.hasAccess === true);
      setError(result.error || null);
      return result;
    } catch (err) {
      console.error('[useCorporateAccess] 更新エラー:', err);
      setError(err instanceof Error ? err.message : String(err));
      setHasCorporateAccess(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // デバッグモード用：アクセスを強制許可する関数
  const forceEnableAccess = () => {
    if (!isDevelopment) return false;

    console.log('[useCorporateAccess] デバッグモード：アクセス強制許可');

    // グローバル状態を直接更新
    corporateAccessState.hasAccess = true;
    corporateAccessState.isAdmin = true;
    corporateAccessState.tenantId = 'debug-tenant-id';
    corporateAccessState.lastChecked = Date.now();
    corporateAccessState.error = null;

    // イベントをディスパッチ
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('corporateAccessChanged', {
          detail: { ...corporateAccessState },
        }),
      );
    }

    setHasCorporateAccess(true);
    setError(null);
    return true;
  };

  return {
    isLoading,
    hasCorporateAccess,
    error,
    refreshAccess,
    forceEnableAccess,
    isDevelopment,
    corporateAccessState: { ...corporateAccessState },
  };
}