// hooks/useCorporateAccess.ts

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { corporateAccessState, checkCorporateAccess } from '@/lib/corporateAccessState';

interface UseCorporateAccessOptions {
  redirectIfNoAccess?: boolean;
  redirectPath?: string;
  checkOnMount?: boolean;
  forceCheck?: boolean;
}

// モバイル環境検出のシンプルな実装
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

// APIリクエストを行っている途中かどうかを追跡
let isApiRequestInProgress = false;

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
  const isDevelopment = false; // 本番環境では常にfalse

  // モバイル環境かどうかを判断する
  const isMobile = isMobileDevice();

  // 再レンダリングを強制するための関数
  const [renderTrigger, setRenderTrigger] = useState(0);

  // forceRenderをuseCallbackでラップ
  const forceRender = useCallback(() => {
    setRenderTrigger((prev) => prev + 1);
  }, []);

  // アクセスチェックを行う関数（useCallbackでメモ化）
  const checkAccess = useCallback(async () => {
    // APIリクエストが進行中の場合は中止
    if (isApiRequestInProgress) {
      console.log('[useCorporateAccess] APIリクエストが既に進行中なのでスキップ');
      return corporateAccessState; // 現在の状態を返す
    }

    console.log('[useCorporateAccess] アクセスチェック開始:', {
      sessionStatus: status,
      checkOnMount,
      forceCheck,
      isMobile,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'SSR',
    });

    // セッションがロード中の場合は終了
    if (status === 'loading') {
      return corporateAccessState;
    }

    // ユーザーがログインしていない場合
    if (!session) {
      console.log('[useCorporateAccess] セッションなし');
      setHasCorporateAccess(false);
      setIsLoading(false);
      return corporateAccessState;
    }

    setIsLoading(true);
    isApiRequestInProgress = true; // APIリクエストの開始をマーク

    // キャッシュの有効期限を拡大（特にモバイル環境）
    const CACHE_DURATION = isMobile ? 30 * 1000 : 60 * 1000; // モバイルは30秒、デスクトップは60秒

    try {
      // より厳格なキャッシュ判定
      if (
        !forceCheck &&
        corporateAccessState.hasAccess !== null &&
        corporateAccessState.lastChecked > 0 &&
        corporateAccessState.tenantId &&
        corporateAccessState.tenantId.length > 0 &&
        Date.now() - corporateAccessState.lastChecked < CACHE_DURATION
      ) {
        console.log('[useCorporateAccess] キャッシュ状態を使用:', corporateAccessState);
        setHasCorporateAccess(corporateAccessState.hasAccess === true);
        setIsLoading(false);
        isApiRequestInProgress = false; // APIリクエスト終了をマーク
        return { ...corporateAccessState };
      }

      // APIを呼び出して状態を更新
      const result = await checkCorporateAccess(forceCheck); // forceCheckを使用
      console.log('[useCorporateAccess] API結果:', result);

      // 結果を適用
      setHasCorporateAccess(result.hasAccess === true);
      setError(result.error || null);

      setIsLoading(false);
      isApiRequestInProgress = false; // APIリクエスト終了をマーク
      return result;
    } catch (err) {
      console.error('[useCorporateAccess] エラー:', err);
      setError(err instanceof Error ? err.message : String(err));
      setHasCorporateAccess(false);
      setIsLoading(false);
      isApiRequestInProgress = false; // APIリクエスト終了をマーク
      return corporateAccessState;
    }
  }, [session, status, forceCheck, checkOnMount, isMobile]);

  // 強制的にアクセスチェックを実行する関数
  const refreshAccess = useCallback(async () => {
    setIsLoading(true);
    try {
      // isMobileフラグをログに記録
      console.log('[useCorporateAccess] アクセス強制更新開始:', {
        isMobile,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'SSR',
      });

      // 強制的に再チェック (モバイルフラグを渡す)
      const result = await checkCorporateAccess(true);
      console.log('[useCorporateAccess] 強制更新結果:', result);

      // テナントIDが取得できない場合にフォールバック
      if (result.hasAccess === true && !result.tenantId) {
        console.log('[useCorporateAccess] 強制更新後もテナントIDなし');

        // 環境に関わらずフォールバックを使用
        corporateAccessState.tenantId = 'fallback-tenant-id';

        // イベントをディスパッチ
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('corporateAccessChanged', {
              detail: { ...corporateAccessState },
            }),
          );
        }
      }

      setHasCorporateAccess(result.hasAccess === true);
      setError(result.error || null);

      // モバイル環境では必要に応じて再試行
      if (isMobile && result.hasAccess === true) {
        console.log('[useCorporateAccess] モバイル環境での強制更新完了');

        // モバイル環境での初回リロード時に問題が発生する場合に対応
        setTimeout(() => {
          forceRender(); // 強制的に再レンダリング
        }, 500);
      }

      return result;
    } catch (err) {
      console.error('[useCorporateAccess] 更新エラー:', err);
      setError(err instanceof Error ? err.message : String(err));
      setHasCorporateAccess(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isMobile, forceRender]);

  // グローバル状態変更時のイベントハンドラ
  const handleAccessStateChange = useCallback(
    (event: Event) => {
      const customEvent = event as CustomEvent<typeof corporateAccessState>;
      console.log(
        '[useCorporateAccess] グローバル状態変更検知:',
        customEvent.detail || corporateAccessState,
      );

      const newState = customEvent.detail || corporateAccessState;
      setHasCorporateAccess(newState.hasAccess === true);
      setError(newState.error || null);
      forceRender();
    },
    [forceRender],
  );

  // イベントリスナーの設定
  useEffect(() => {
    console.log('[useCorporateAccess] フック初期化:', {
      sessionStatus: status,
      redirectIfNoAccess,
      checkOnMount,
      forceCheck,
      currentState: corporateAccessState,
      isMobile,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'SSR',
    });

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
  }, [status, redirectIfNoAccess, checkOnMount, forceCheck, handleAccessStateChange, isMobile]);

  // セッション状態が変わった時、またはマウント時にアクセスチェック
  useEffect(() => {
    if (checkOnMount) {
      checkAccess();
    }
  }, [checkAccess, checkOnMount, renderTrigger]);

  // アクセス権に基づいてリダイレクト
  useEffect(() => {
    // 本番環境では、iPhoneで強制リダイレクトを避ける
    const shouldRedirect =
      !isLoading &&
      hasCorporateAccess === false &&
      redirectIfNoAccess &&
      !(isMobile && isDevelopment); // モバイル環境かつ開発中の場合はリダイレクトしない

    if (shouldRedirect) {
      console.log('[useCorporateAccess] アクセス権なし、リダイレクト:', redirectPath);
      router.push(redirectPath);
    }
  }, [
    hasCorporateAccess,
    isLoading,
    redirectIfNoAccess,
    redirectPath,
    router,
    isMobile,
    isDevelopment,
  ]);

  // モバイル環境では自動的にフォールバックを有効化
  useEffect(() => {
    const checkAndApplyFallback = () => {
      if (isMobile && corporateAccessState.hasAccess === true && !corporateAccessState.tenantId) {
        console.log('[useCorporateAccess] モバイル環境でテナントIDがない、フォールバック設定');

        corporateAccessState.tenantId = 'fallback-tenant-id';

        // イベントをディスパッチ
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('corporateAccessChanged', {
              detail: { ...corporateAccessState },
            }),
          );
        }

        forceRender();
      }
    };

    // 初回実行
    checkAndApplyFallback();

    // モバイル環境ではintervalを設定して定期的にチェック
    let intervalId: NodeJS.Timeout | null = null;
    if (isMobile) {
      intervalId = setInterval(checkAndApplyFallback, 2000); // 2秒ごとにチェック
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isMobile, forceRender]); // 依存配列を修正

  return {
    isLoading,
    hasCorporateAccess,
    error,
    refreshAccess,
    isDevelopment,
    corporateAccessState: { ...corporateAccessState },
    isMobile,
  };
}