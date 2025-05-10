// lib/errorHandler.ts

// 接続エラーを追跡するためのグローバル変数
let connectionErrorCount = 0;
const MAX_CONNECTION_ERRORS = 3; // 最大エラー回数
const CONNECTION_ERROR_RESET_TIME = 60000; // リセット時間（1分）

// エラー発生時の処理
export function handleConnectionError(error: unknown): void {
  console.error('Connection error:', error);

  // エラーカウントを増加
  connectionErrorCount++;

  // カウントをリセットするタイマー
  setTimeout(() => {
    connectionErrorCount = Math.max(0, connectionErrorCount - 1);
  }, CONNECTION_ERROR_RESET_TIME);

  // エラーが一定回数を超えたら対処
  if (connectionErrorCount >= MAX_CONNECTION_ERRORS) {
    // ユーザーにリロードを促す、またはリロードする
    if (typeof window !== 'undefined') {
      if (confirm('接続に問題が発生しています。ページを再読み込みしますか？')) {
        window.location.reload();
      }
    }
  }
}

// API呼び出しのラッパー関数
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  fallbackValue: T,
  retryCount = 1,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      // 再試行の場合は少し待機
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }

      // API呼び出し
      return await apiCall();
    } catch (error) {
      lastError = error;
      console.error(`API call failed (attempt ${attempt + 1}/${retryCount + 1}):`, error);
    }
  }

  // すべての試行が失敗した場合
  handleConnectionError(lastError);
  return fallbackValue;
}