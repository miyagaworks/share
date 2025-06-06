// app/auth/email-verification/page.tsx
'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';

function EmailVerificationContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [userEmail, setUserEmail] = useState<string>('');

  // URLパラメータからメールアドレスを取得
  useEffect(() => {
    const emailFromUrl = searchParams?.get('email');
    if (emailFromUrl) {
      setUserEmail(decodeURIComponent(emailFromUrl));
      return;
    }

    // フォールバック: セッションから取得
    if (session?.user?.email) {
      setUserEmail(session.user.email);
      return;
    }

    // 最後の手段: APIから取得
    const fetchUserEmail = async () => {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          if (data.user?.email) {
            setUserEmail(data.user.email);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user email:', error);
      }
    };

    if (status === 'authenticated') {
      fetchUserEmail();
    }
  }, [searchParams, session, status]);

  // 認証済みの場合はダッシュボードにリダイレクト
  useEffect(() => {
    if (status === 'authenticated') {
      const checkVerificationStatus = async () => {
        try {
          const response = await fetch('/api/user/check-email-verification');
          const data = await response.json();
          if (data.verified) {
            router.push('/dashboard');
          }
        } catch {
          // エラーは無視
        }
      };
      checkVerificationStatus();
    }
  }, [status, router]);

  // カウントダウン開始
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 認証メール再送信
  const handleResendEmail = async () => {
    if (countdown > 0) return;

    if (!userEmail || userEmail.trim() === '') {
      setResendError('メールアドレスが特定できません。ページを再読み込みしてください。');
      return;
    }

    const trimmedEmail = userEmail.trim();

    // 簡易メールバリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setResendError('無効なメールアドレス形式です。');
      return;
    }

    setIsResending(true);
    setResendError(null);
    setResendMessage(null);

    try {
      const response = await fetch('/api/auth/send-verification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await response.json();

      if (response.ok && data && !data.error) {
        setResendMessage('認証メールを再送信しました。メールをご確認ください。');
        setCountdown(60);
      } else {
        const errorMessage = data?.error || data?.message || `サーバーエラー (${response.status})`;
        setResendError(errorMessage);
      }
    } catch (networkError) {
      setResendError('ネットワークエラーが発生しました。');
    } finally {
      setIsResending(false);
    }
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
          <p className="text-xl text-white/90 mb-8">メールアドレスの認証をお待ちください</p>
          <div className="flex flex-col space-y-4 mt-12">
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
              <p className="text-white text-left mb-3">
                「Share」を使えば、あなたのSNSアカウントと連絡先情報をひとつにまとめて、簡単に共有できます。
              </p>
              <p className="text-white/80 text-left">
                認証が完了すると、すべての機能をご利用いただけます。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 右側：認証待ち画面 */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="md:hidden flex justify-center mb-8">
              <Image src="/logo_blue.svg" alt="Share Logo" width={90} height={90} priority />
            </div>
            <div className="mb-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">メールアドレスの認証</h2>
            <p className="mt-2 text-gray-600">登録したメールアドレスに認証リンクを送信しました</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-600 mt-0.5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">認証手順</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>
                      登録されたメールアドレス
                      {userEmail ? (
                        <span className="font-semibold text-blue-800">（{userEmail}）</span>
                      ) : (
                        ''
                      )}
                      をご確認ください
                    </li>
                    <li>「メールアドレスを認証する」ボタンをクリックしてください</li>
                    <li>認証が完了すると、自動的にダッシュボードに移動します</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {resendMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-green-600 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm text-green-700">{resendMessage}</span>
              </div>
            </div>
          )}

          {resendError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-red-600 mr-2"
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
                <span className="text-sm text-red-700">{resendError}</span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <Button
              onClick={handleResendEmail}
              disabled={isResending || countdown > 0}
              className="w-full bg-blue-600 text-white hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isResending ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  送信中...
                </span>
              ) : countdown > 0 ? (
                `認証メールを再送信 (${countdown}秒後に再送信可能)`
              ) : (
                '認証メールを再送信'
              )}
            </Button>

            <div className="text-justify text-sm text-gray-500 space-y-2">
              <p>メールが届かない場合は、迷惑メールフォルダもご確認ください。</p>
              <p>
                メールアドレスを変更したい場合は、
                <Link
                  href="/auth/signin"
                  className="text-blue-600 hover:text-blue-500 hover:underline"
                >
                  ログイン画面
                </Link>
                から再度お試しください。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EmailVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <EmailVerificationContent />
    </Suspense>
  );
}