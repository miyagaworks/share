// hooks/useCorporateAccess.ts
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  corporateAccessState,
  checkCorporateAccess,
  initializeClientState,
} from '@/lib/corporateAccess';
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
  // 初期化処理
  useEffect(() => {
    // クライアントサイドの状態を初期化
    if (typeof window !== 'undefined') {
      initializeClientState().catch(() => {
        // 初期化エラーは無視（バックグラウンド処理のため）
      });
    }
  }, []);
  // forceRenderをuseCallbackでラップ
  const forceRender = useCallback(() => {
    setRenderTrigger((prev) => prev + 1);
  }, []);
  // アクセスチェックを行う関数（useCallbackでメモ化）
  const checkAccess = useCallback(async () => {
    // APIリクエストが進行中の場合は中止
    if (isApiRequestInProgress) {
      return corporateAccessState; // 現在の状態を返す
    }
    // セッションがロード中の場合は終了
    if (status === 'loading') {
      return corporateAccessState;
    }
    // ユーザーがログインしていない場合
    if (!session) {
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
        setHasCorporateAccess(corporateAccessState.hasAccess === true);
        setIsLoading(false);
        isApiRequestInProgress = false; // APIリクエスト終了をマーク
        return { ...corporateAccessState };
      }
      // APIを呼び出して状態を更新
      // 修正: forceCheck を { force: forceCheck } に変更
      const result = await checkCorporateAccess({ force: forceCheck });
      // 結果を適用
      setHasCorporateAccess(result.hasCorporateAccess === true);
      setError(result.error || null);
      setIsLoading(false);
      isApiRequestInProgress = false; // APIリクエスト終了をマーク
      return result;
    } catch (err) {
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
      // 強制的に再チェック (修正: true を { force: true } に変更)
      const result = await checkCorporateAccess({ force: true });
      // テナントIDが取得できない場合にフォールバック
      if (result.hasCorporateAccess === true && !result.tenant?.id) {
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
      setHasCorporateAccess(result.hasCorporateAccess === true);
      setError(result.error || null);
      // モバイル環境では必要に応じて再試行
      if (isMobile && result.hasCorporateAccess === true) {
        // モバイル環境での初回リロード時に問題が発生する場合に対応
        setTimeout(() => {
          forceRender(); // 強制的に再レンダリング
        }, 500);
      }
      return result;
    } catch (err) {
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
      const newState = customEvent.detail || corporateAccessState;
      setHasCorporateAccess(newState.hasAccess === true);
      setError(newState.error || null);
      forceRender();
    },
    [forceRender],
  );
  // イベントリスナーの設定
  useEffect(() => {
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