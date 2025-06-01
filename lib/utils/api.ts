// lib/utils/api.ts
import { logger } from './logger';
interface ApiOptions extends RequestInit {
  noCache?: boolean;
  timeout?: number;
}
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  status?: number;
  error?: string;
  errorDetails?: unknown;
}
/**
 * 共通APIクライアント
 * エラーハンドリングとロギングを統合
 */
export const api = {
  async get<T>(url: string, options: ApiOptions = {}): Promise<ApiResponse<T>> {
    return request<T>(url, { ...options, method: 'GET' });
  },
  async post<T>(url: string, data: unknown, options: ApiOptions = {}): Promise<ApiResponse<T>> {
    return request<T>(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  },
  async put<T>(url: string, data: unknown, options: ApiOptions = {}): Promise<ApiResponse<T>> {
    return request<T>(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  },
  async delete<T>(url: string, options: ApiOptions = {}): Promise<ApiResponse<T>> {
    return request<T>(url, { ...options, method: 'DELETE' });
  },
};
// 内部実装
async function request<T>(url: string, options: ApiOptions = {}): Promise<ApiResponse<T>> {
  const { noCache, timeout = 30000, ...fetchOptions } = options;
  // キャッシュ制御
  if (noCache) {
    fetchOptions.headers = {
      ...fetchOptions.headers,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    };
  }
  // リクエスト識別子（デバッグ用）
  const requestId = Math.random().toString(36).substring(2, 10);
  try {
    logger.debug(`API ${fetchOptions.method} リクエスト開始 [${requestId}]`, {
      url,
      options: { ...fetchOptions, body: undefined },
    });
    // タイムアウト処理
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    // レスポンスログ
    logger.debug(`API レスポンス [${requestId}]`, {
      url,
      status: response.status,
      statusText: response.statusText,
    });
    if (!response.ok) {
      // エラーレスポンスの詳細ログ
      const errorText = await response.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch {
        // テキスト形式のエラー - 変数は使用しないので削除
      }
      logger.warn(`API エラーレスポンス [${requestId}]`, {
        url,
        status: response.status,
        statusText: response.statusText,
        error: errorJson || errorText,
      });
      return {
        success: false,
        status: response.status,
        error: errorJson?.error || errorJson?.message || response.statusText,
        errorDetails: errorJson || errorText,
      };
    }
    // 成功レスポンスの処理
    const data = (await response.json()) as T;
    return {
      success: true,
      status: response.status,
      data,
    };
  } catch (error) {
    // ネットワークエラーなどの例外
    const isAbortError = error instanceof Error && error.name === 'AbortError';
    logger.error(
      isAbortError ? `API タイムアウト [${requestId}]` : `API リクエスト例外 [${requestId}]`,
      error,
      { url, method: fetchOptions.method },
    );
    return {
      success: false,
      error: isAbortError
        ? 'リクエストがタイムアウトしました'
        : error instanceof Error
          ? error.message
          : '不明なエラーが発生しました',
      errorDetails: error,
    };
  }
}