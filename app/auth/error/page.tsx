// app/auth/error/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
<<<<<<< HEAD

// SearchParamsを取得するコンポーネント
function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // エラータイプに基づいてメッセージを設定
    switch (error) {
      case 'MissingCSRF':
        setErrorMessage('セッションの有効期限が切れました。再度ログインしてください。');
        break;
      case 'AccessDenied':
        setErrorMessage('アクセスが拒否されました。');
        break;
      case 'Callback':
        setErrorMessage('ログイン処理中にエラーが発生しました。');
        break;
      default:
        setErrorMessage('認証中にエラーが発生しました。もう一度お試しください。');
    }
  }, [error]);

  return (
    <div className="flex min-h-screen">
      {/* 左側：デコレーション部分 */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-700 opacity-20">
          <div className="absolute inset-0 bg-pattern opacity-10"></div>
        </div>
        <div className="z-10 max-w-md text-center">
          <h1 className="text-4xl font-bold text-white mb-6">Share</h1>
          <p className="text-xl text-white/90 mb-8">シンプルにつながる、スマートにシェア。</p>
          <div className="flex flex-col space-y-4 mt-12">
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
              <p className="text-white text-left mb-3">
                「Share」を使えば、あなたのSNSアカウントと連絡先情報をひとつにまとめて、簡単に共有できます。
              </p>
              <p className="text-white/80 text-left">
                QRコードでシェアして、ビジネスでもプライベートでも人とのつながりを簡単に。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 右側：エラーメッセージ */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="md:hidden flex justify-center mb-8">
              <Image src="/logo_blue.svg" alt="Share Logo" width={90} height={90} priority />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">エラーが発生しました</h2>
            <p className="mt-2 text-gray-600">認証処理中に問題が発生しました</p>
          </div>

          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200 shadow-sm mb-6">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 mr-2 text-red-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errorMessage}
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <Button
              className="w-full bg-blue-600 text-white hover:bg-blue-800 transform hover:-translate-y-0.5 transition shadow-md"
              onClick={() => (window.location.href = '/auth/signin')}
            >
              ログインページに戻る
            </Button>

            <Link
              href="/"
              className="text-center text-blue-600 hover:text-blue-500 hover:underline mt-4"
            >
              トップページに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ローディング表示コンポーネント
function LoadingFallback() {
  return (
    <div className="flex min-h-screen justify-center items-center">
      <div className="animate-spin h-10 w-10 border-4 border-blue-600 rounded-full border-t-transparent"></div>
    </div>
  );
}

=======

// エラー内容を表示するコンポーネント
function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // エラータイプに基づいてメッセージを設定
    switch (error) {
      case 'MissingCSRF':
        setErrorMessage('セッションの有効期限が切れました。再度ログインしてください。');
        break;
      case 'AccessDenied':
        setErrorMessage('アクセスが拒否されました。');
        break;
      case 'Callback':
        setErrorMessage('ログイン処理中にエラーが発生しました。');
        break;
      default:
        setErrorMessage('認証中にエラーが発生しました。もう一度お試しください。');
    }
  }, [error]);

  return (
    <div className="flex min-h-screen">
      {/* 左側：デコレーション部分 */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-700 opacity-20">
          <div className="absolute inset-0 bg-pattern opacity-10"></div>
        </div>
        <div className="z-10 max-w-md text-center">
          <h1 className="text-4xl font-bold text-white mb-6">Share</h1>
          <p className="text-xl text-white/90 mb-8">シンプルにつながる、スマートにシェア。</p>
          <div className="flex flex-col space-y-4 mt-12">
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
              <p className="text-white text-left mb-3">
                「Share」を使えば、あなたのSNSアカウントと連絡先情報をひとつにまとめて、簡単に共有できます。
              </p>
              <p className="text-white/80 text-left">
                QRコードでシェアして、ビジネスでもプライベートでも人とのつながりを簡単に。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 右側：エラーメッセージ */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="md:hidden flex justify-center mb-8">
              <Image src="/logo_blue.svg" alt="Share Logo" width={90} height={90} priority />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">エラーが発生しました</h2>
            <p className="mt-2 text-gray-600">認証処理中に問題が発生しました</p>
          </div>

          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200 shadow-sm mb-6">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 mr-2 text-red-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errorMessage}
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <Button
              className="w-full bg-blue-600 text-white hover:bg-blue-800 transform hover:-translate-y-0.5 transition shadow-md"
              onClick={() => (window.location.href = '/auth/signin')}
            >
              ログインページに戻る
            </Button>

            <Link
              href="/"
              className="text-center text-blue-600 hover:text-blue-500 hover:underline mt-4"
            >
              トップページに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ローディング中に表示するコンポーネント
function LoadingFallback() {
  return (
    <div className="flex min-h-screen flex-col justify-center items-center">
      <div className="text-center">
        <p className="text-lg text-gray-600">読み込み中...</p>
      </div>
    </div>
  );
}

// メインのエラーページコンポーネント
>>>>>>> a20d17fb3f2293468ead8460ba8a1d377c3cb583
export default function ErrorPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ErrorContent />
    </Suspense>
  );
}