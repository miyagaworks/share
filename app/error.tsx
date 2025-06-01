// app/error.tsx
'use client';
import { useEffect } from 'react';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { logger } from '@/lib/utils/logger';
export default function GlobalErrorComponent({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーをロギング
    logger.error('予期しないエラーが発生しました', error);
  }, [error]);
  // 本番環境ではエラーメッセージを表示しない
  const errorDetails = process.env.NODE_ENV === 'production' ? undefined : error.message;
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <ErrorMessage
          message="予期しないエラーが発生しました"
          details={errorDetails}
          onRetry={() => reset()}
          className="mb-4"
        />
        <div className="text-center mt-4">
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            もう一度試す
          </button>
        </div>
      </div>
    </div>
  );
}