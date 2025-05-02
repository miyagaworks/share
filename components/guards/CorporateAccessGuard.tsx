// components/guards/CorporateAccessGuard.tsx
'use client';

import { ReactNode, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Session } from 'next-auth';
import { useSession } from 'next-auth/react';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { HiOutlineExclamation } from 'react-icons/hi';
import { corporateAccessState, checkCorporateAccess } from '@/lib/corporateAccessState';

interface CorporateAccessState {
  hasAccess: boolean | null;
  isAdmin: boolean;
  tenantId?: string | null;
  lastChecked: number;
  userRole?: string | null;
  error?: string | null;
}

// デバッグパネルの詳細情報の型を定義
interface DebugDetails {
  [key: string]: unknown;
}

// DebugPanelのProps型定義
interface DebugPanelProps {
  session: Session | null;
  corporateState: CorporateAccessState;
}

// デバッグフラグを追加
const DEBUG_MODE = process.env.NODE_ENV === 'development'; // 開発時にはtrueに設定

// デバッグパネルコンポーネント
const DebugPanel = ({ session, corporateState }: DebugPanelProps) => {
  const [details, setDetails] = useState<DebugDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchDetails = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      // データベース情報を直接取得
      const response = await fetch('/api/debug/corporate-access', {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      const data = await response.json();
      setDetails(data);
    } catch (err) {
      console.error('デバッグ情報取得エラー:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4 border border-gray-300 rounded p-3 bg-gray-50 text-xs">
      <div className="flex justify-between items-center">
        <button className="text-blue-600 underline" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? 'デバッグ情報を隠す' : 'デバッグ情報を表示'}
        </button>

        <button
          className="bg-gray-200 px-2 py-1 rounded text-xs"
          onClick={fetchDetails}
          disabled={isLoading}
        >
          {isLoading ? '取得中...' : '最新情報を取得'}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-2">
          <h4 className="font-bold mb-1">現在のアクセス状態:</h4>
          <pre className="bg-white p-2 rounded overflow-auto max-h-32 text-xs">
            {JSON.stringify(
              {
                hasAccess: corporateState.hasAccess,
                isAdmin: corporateState.isAdmin,
                tenantId: corporateState.tenantId,
                userRole: corporateState.userRole,
                error: corporateState.error,
              },
              null,
              2,
            )}
          </pre>

          {details && (
            <>
              <h4 className="font-bold mt-3 mb-1">詳細情報:</h4>
              <pre className="bg-white p-2 rounded overflow-auto max-h-64 text-xs">
                {JSON.stringify(details, null, 2)}
              </pre>
            </>
          )}
        </div>
      )}
    </div>
  );
};

interface CorporateAccessGuardProps {
  children: ReactNode;
  // デバッグモード用のプロパティ（開発環境でのみ使用）
  debugMode?: boolean;
}

export function CorporateAccessGuard({
  children,
  // 開発環境またはテスト中は自動的にデバッグモードを有効化
  debugMode = DEBUG_MODE,
}: CorporateAccessGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [renderKey, setRenderKey] = useState(0);
  const [bypassEnabled, setBypassEnabled] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showDetailedError, setShowDetailedError] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // デバッグ用：アクセス状態を手動で更新
  const forceEnableAccess = useCallback(() => {
    console.log('[CorporateAccessGuard] デバッグモード: アクセス権を強制的に有効化');

    // グローバル状態を直接更新
    corporateAccessState.hasAccess = true;
    corporateAccessState.isAdmin = true;
    corporateAccessState.tenantId = 'debug-tenant-id';
    corporateAccessState.userRole = 'admin';
    corporateAccessState.lastChecked = Date.now();
    corporateAccessState.error = null;

    // イベントをディスパッチして他のコンポーネントに通知
    window.dispatchEvent(
      new CustomEvent('corporateAccessChanged', {
        detail: { ...corporateAccessState },
      }),
    );

    setBypassEnabled(true);
    setError(null);
    setErrorDetails(null);
    setRenderKey((prev) => prev + 1);
  }, []);

  // メインの useEffect - 1番目
  useEffect(() => {
    if (status === 'loading') return;

    const initAccess = async () => {
      if (!session) {
        console.log('[CorporateAccessGuard] セッションなし、サインインページへリダイレクト');
        router.push('/auth/signin');
        return;
      }

      try {
        console.log('[CorporateAccessGuard] 法人アクセス権チェック開始');

        // 最初のロードでは常に強制チェック
        const result = await checkCorporateAccess(true);

        console.log('[CorporateAccessGuard] 法人アクセス権を設定:', {
          hasAccess: result.hasAccess,
          tenantId: result.tenantId,
          isAdmin: result.isAdmin,
        });

        if (!result.hasAccess) {
          const errorMessage = result.error || '法人プランにアクセスする権限がありません';
          console.warn('[CorporateAccessGuard] アクセス権なし:', errorMessage);
          setError(errorMessage);
          setErrorDetails(JSON.stringify(result, null, 2));
        } else {
          setError(null);
          setErrorDetails(null);
        }
      } catch (error) {
        console.error('[CorporateAccessGuard] エラー:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        setError('法人アカウント情報の取得中にエラーが発生しました');
        setErrorDetails(errorMessage);
      } finally {
        setIsLoading(false);
        // 状態更新を強制的に反映するために再レンダリング
        setRenderKey((prev) => prev + 1);
        console.log('[CorporateAccessGuard] チェック完了。状態:', {
          hasAccess: corporateAccessState.hasAccess,
          error: corporateAccessState.error,
        });
      }
    };

    initAccess();

    // corporateAccessChangedイベントリスナーを設定
    const handleAccessChange = (event: CustomEvent<typeof corporateAccessState>) => {
      console.log('[CorporateAccessGuard] アクセス状態変更を検知:', event.detail);
      setRenderKey((prev) => prev + 1);

      // エラーメッセージも更新
      if (!event.detail.hasAccess) {
        setError(event.detail.error || '法人プランにアクセスする権限がありません');
      } else {
        setError(null);
      }
    };

    window.addEventListener('corporateAccessChanged', handleAccessChange as EventListener);

    return () => {
      window.removeEventListener('corporateAccessChanged', handleAccessChange as EventListener);
    };
  }, [session, status, router, retryCount]);

  // デバッグモード用の useEffect - 2番目
  useEffect(() => {
    // 中で条件判定する
    if (debugMode && process.env.NODE_ENV === 'development') {
      console.log('[CorporateAccessGuard] デバッグモード：アクセスを自動的に許可します');
      forceEnableAccess();
    }
  }, [debugMode, forceEnableAccess]);

  // ロギング用の useEffect - 3番目
  useEffect(() => {
    console.log('[CorporateAccessGuard] レンダリング実行。状態:', {
      isLoading,
      hasAccess: corporateAccessState.hasAccess,
      renderKey,
      bypassEnabled,
    });
  });

  console.log('[CorporateAccessGuard] 初期状態:', {
    isLoading,
    moduleState: corporateAccessState,
    sessionStatus: status,
    debugMode,
    retryCount,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Spinner size="lg" />
      </div>
    );
  }

  // アクセス拒否画面の条件を変更
  if (!bypassEnabled && corporateAccessState.hasAccess !== true && !debugMode) {
    console.log('[CorporateAccessGuard] アクセス拒否画面表示、エラー:', error);
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

            {/* エラー詳細（開閉可能） */}
            {errorDetails && (
              <div className="mb-4">
                <button
                  className="text-yellow-800 underline text-sm"
                  onClick={() => setShowDetailedError(!showDetailedError)}
                >
                  {showDetailedError ? 'エラー詳細を隠す' : 'エラー詳細を表示する'}
                </button>

                {showDetailedError && (
                  <pre className="mt-2 p-2 bg-yellow-100 rounded overflow-auto text-xs max-h-48">
                    {errorDetails}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button onClick={() => router.push('/dashboard')}>個人ダッシュボードへ</Button>
              <Button variant="outline" onClick={() => router.push('/dashboard/subscription')}>
                利用プランを見る
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  // 強制的にアクセス権をリセットしてAPIを再度呼び出す
                  setIsLoading(true);
                  setRetryCount((prev) => prev + 1);
                  await checkCorporateAccess(true); // forceCheck=true
                  setIsLoading(false);
                  setRenderKey((prev) => prev + 1);
                }}
              >
                ステータスを再確認
              </Button>

              {/* デバッグモードの場合のみ表示 */}
              {(debugMode || process.env.NODE_ENV === 'development') && (
                <>
                  <Button
                    variant="outline"
                    className="bg-gray-100 text-sm"
                    onClick={forceEnableAccess}
                  >
                    開発者モード：アクセスを強制許可
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-gray-100 text-sm"
                    onClick={() => setShowDebugPanel(!showDebugPanel)}
                  >
                    {showDebugPanel ? 'デバッグパネルを閉じる' : 'デバッグパネルを表示'}
                  </Button>
                </>
              )}
            </div>

            {/* デバッグパネル：常に条件なしで表示 */}
            {(debugMode || showDebugPanel) && (
              <DebugPanel session={session} corporateState={corporateAccessState} />
            )}
          </div>
        </div>
      </div>
    );
  }

  // 通常表示時にデバッグ情報を追加
  return (
    <>
      {children}

      {/* デバッグ情報表示（開発環境またはデバッグモード時のみ） */}
      {(process.env.NODE_ENV === 'development' || debugMode) && (
        <div className="mt-4 p-4 border border-yellow-300 rounded bg-yellow-50">
          <h3 className="font-medium mb-2">CorporateAccessGuard デバッグ情報</h3>
          <pre className="bg-white p-2 rounded text-xs mb-3 overflow-auto max-h-40">
            {JSON.stringify(
              {
                hasAccess: corporateAccessState.hasAccess,
                isAdmin: corporateAccessState.isAdmin,
                tenantId: corporateAccessState.tenantId,
                lastChecked: corporateAccessState.lastChecked,
                error: corporateAccessState.error,
                debugMode,
                bypassEnabled,
              },
              null,
              2,
            )}
          </pre>
          <button
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
            onClick={forceEnableAccess}
          >
            アクセスを強制許可
          </button>
        </div>
      )}
    </>
  );
}