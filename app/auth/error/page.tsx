'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';

// SearchParamsを取得するコンポーネントを分離
function ErrorContent() {
  // useSearchParamsを正しくインポートして使用
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  // エラータイプに基づいてメッセージを設定
  let errorMessage = '認証中にエラーが発生しました。もう一度お試しください。';
  let errorDetails = 'ブラウザのCookieをクリアして、再度ログインをお試しください。';

  switch (error) {
    case 'Configuration':
      errorMessage = 'サーバー設定エラーが発生しました。';
      errorDetails = 'システム管理者にお問い合わせください。';
      break;
    case 'AccessDenied':
      errorMessage = 'アクセスが拒否されました。';
      errorDetails = 'このアカウントでのアクセス権限がありません。';
      break;
    case 'Verification':
      errorMessage = '認証リンクの検証エラーが発生しました。';
      errorDetails = 'リンクの有効期限が切れているか、すでに使用されている可能性があります。';
      break;
    case 'OAuthSignin':
      errorMessage = 'OAuth認証の開始中にエラーが発生しました。';
      errorDetails = 'ブラウザのCookieが有効になっていることを確認してください。';
      break;
    case 'OAuthCallback':
      errorMessage = 'OAuth認証のコールバック処理中にエラーが発生しました。';
      errorDetails = '認証サービスから適切な応答が得られませんでした。もう一度お試しください。';
      break;
    case 'OAuthCreateAccount':
      errorMessage = 'アカウント作成中にエラーが発生しました。';
      errorDetails = 'このメールアドレスはすでに別の方法で登録されている可能性があります。';
      break;
    case 'OAuthAccountNotLinked':
      errorMessage = 'このメールアドレスは別の認証方法で登録されています。';
      errorDetails = '以前と同じログイン方法を使用してください。';
      break;
    case 'EmailCreateAccount':
      errorMessage = 'アカウント作成中にエラーが発生しました。';
      errorDetails = 'メールアドレスが既に使用されているか、メール送信に問題がありました。';
      break;
    case 'Callback':
      errorMessage = '認証コールバック処理中にエラーが発生しました。';
      errorDetails = 'セッションの確立に問題があります。ブラウザのCookieを確認してください。';
      break;
    case 'CredentialsSignin':
      errorMessage = 'メールアドレスまたはパスワードが正しくありません。';
      errorDetails = '入力情報を確認して再度お試しください。';
      break;
    case 'SessionRequired':
      errorMessage = 'このページにアクセスするにはログインが必要です。';
      errorDetails = 'ログインしてから再度アクセスしてください。';
      break;
  }

  const handleClearSessionAndRedirect = () => {
    // セッション関連のデータをクリア
    if (typeof window !== 'undefined') {
      // LocalStorageとSessionStorageをクリア
      window.localStorage.clear();
      window.sessionStorage.clear();

      // 認証関連のCookieを削除
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      }
    }

    // ログインページにリダイレクト
    window.location.href = '/auth/signin';
  };

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
            <div className="flex items-center mb-2">
              <svg
                className="h-5 w-5 mr-2 text-red-500 flex-shrink-0"
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
              <span className="font-medium">{errorMessage}</span>
            </div>
            <p className="ml-7 text-red-500">{errorDetails}</p>
            {error && <div className="mt-3 text-xs text-gray-500">エラーコード: {error}</div>}
          </div>

          <div className="flex flex-col space-y-4">
            <Button
              className="w-full bg-blue-600 text-white hover:bg-blue-800 transform hover:-translate-y-0.5 transition shadow-md"
              onClick={handleClearSessionAndRedirect}
            >
              セッションをクリアしてログインページに戻る
            </Button>

            <Link
              href="/"
              className="text-center text-blue-600 hover:text-blue-500 hover:underline mt-4"
            >
              トップページに戻る
            </Link>
          </div>

          <div className="mt-8 text-xs text-gray-500 text-center">
            <p>問題が解決しない場合は、別のブラウザを試すか、</p>
            <p>システム管理者にお問い合わせください。</p>
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

export default function ErrorPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ErrorContent />
    </Suspense>
  );
}