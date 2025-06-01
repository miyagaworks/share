// app/auth/email-verification/page.tsx (修正版)
'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';

export default function EmailVerificationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [userEmail, setUserEmail] = useState<string>('');
  const [verificationStatus, setVerificationStatus] = useState<
    'loading' | 'pending' | 'verified' | 'error'
  >('loading');

  // URLパラメータからの初期メッセージを取得
  useEffect(() => {
    const email = searchParams.get('email');
    const message = searchParams.get('message');

    if (email) {
      setUserEmail(email);
    }

    if (message === 'registration_success') {
      setResendMessage('アカウントが作成されました。認証メールを送信しました。');
    }
  }, [searchParams]);

  // 🔥 修正: ユーザーのメールアドレスを取得（複数の方法を試行）
  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        // 1. セッションからメールアドレスを取得
        if (session?.user?.email) {
          setUserEmail(session.user.email);
          setVerificationStatus('pending');
          return;
        }

        // 2. セッションが不完全な場合、プロフィールAPIから取得
        if (status === 'authenticated') {
          try {
            const response = await fetch('/api/profile');
            if (response.ok) {
              const data = await response.json();
              if (data.user?.email) {
                setUserEmail(data.user.email);
                setVerificationStatus('pending');
                return;
              }
            }
          } catch (profileError) {
            console.debug('Profile API failed:', profileError);
            // プロフィールAPI失敗は無視して次の方法を試す
          }
        }

        // 3. 認証ステータス確認APIを呼んで情報を取得
        try {
          const response = await fetch('/api/user/check-email-verification');
          if (response.ok) {
            const data = await response.json();
            if (data.email) {
              setUserEmail(data.email);
              if (data.verified) {
                setVerificationStatus('verified');
                // 既に認証済みの場合はダッシュボードにリダイレクト
                setTimeout(() => {
                  router.push('/dashboard');
                }, 2000);
              } else {
                setVerificationStatus('pending');
              }
              return;
            }
          }
        } catch (checkError) {
          console.debug('Check verification API failed:', checkError);
        }

        // 4. ローカルストレージから取得（フォールバック）
        const storedEmail = localStorage.getItem('pendingVerificationEmail');
        if (storedEmail) {
          setUserEmail(storedEmail);
          setVerificationStatus('pending');
          return;
        }

        // 5. どの方法でもメールアドレスが取得できない場合
        setVerificationStatus('error');
      } catch (error) {
        console.error('Failed to fetch user email:', error);
        setVerificationStatus('error');
      }
    };

    // セッションが読み込み中でない場合のみ実行
    if (status !== 'loading') {
      fetchUserEmail();
    }
  }, [session, status, router]);

  // 🔥 修正: 認証状況の定期チェック
  useEffect(() => {
    if (verificationStatus === 'pending' && userEmail) {
      const checkInterval = setInterval(async () => {
        try {
          const response = await fetch('/api/user/check-email-verification');
          if (response.ok) {
            const data = await response.json();
            if (data.verified) {
              setVerificationStatus('verified');
              setResendMessage('メールアドレスの認証が完了しました！ダッシュボードに移動します...');
              clearInterval(checkInterval);

              // 3秒後にダッシュボードにリダイレクト
              setTimeout(() => {
                router.push('/dashboard');
              }, 3000);
            }
          }
        } catch (error) {
          console.debug('Check verification failed:', error);
        }
      }, 5000); // 5秒ごとにチェック

      return () => clearInterval(checkInterval);
    }
  }, [verificationStatus, userEmail, router]);

  // カウントダウン
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 未認証の場合はログイン画面にリダイレクト
  useEffect(() => {
    if (status === 'unauthenticated') {
      // メールアドレスをローカルストレージに保存してからリダイレクト
      if (userEmail) {
        localStorage.setItem('pendingVerificationEmail', userEmail);
      }
      router.push('/auth/signin?error=authentication_required');
    }
  }, [status, router, userEmail]);

  // ローディング中
  if (status === 'loading' || verificationStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 未認証の場合（リダイレクト処理中）
  if (status === 'unauthenticated') {
    return null;
  }

  // エラー状態
  if (verificationStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">エラーが発生しました</h2>
          <p className="text-gray-600 mb-6">
            メール認証の状態を確認できませんでした。
            <br />
            お手数ですが、再度ログインをお試しください。
          </p>
          <Link
            href="/auth/signin"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ログイン画面に戻る
          </Link>
        </div>
      </div>
    );
  }

  // 認証メール再送信
  const handleResendEmail = async () => {
    if (countdown > 0) return;

    setIsResending(true);
    setResendError(null);
    setResendMessage(null);

    try {
      const response = await fetch('/api/auth/send-verification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        if (data.alreadyVerified) {
          setResendMessage('メールアドレスは既に認証済みです。ダッシュボードに移動します...');
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        } else {
          setResendMessage('認証メールを再送信しました。メールをご確認ください。');
          setCountdown(60); // 60秒のクールダウン
        }
      } else {
        setResendError(data.error || '再送信に失敗しました。');
      }
    } catch (error) {
      console.error('Resend email error:', error);
      setResendError('再送信中にエラーが発生しました。');
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
          <p className="text-xl text-white/90 mb-8">
            {verificationStatus === 'verified'
              ? '認証が完了しました！'
              : 'メールアドレスの認証をお待ちください'}
          </p>
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
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  verificationStatus === 'verified' ? 'bg-green-100' : 'bg-blue-100'
                }`}
              >
                {verificationStatus === 'verified' ? (
                  <svg
                    className="w-10 h-10 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-10 h-10 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              {verificationStatus === 'verified' ? '認証完了' : 'メールアドレスの認証'}
            </h2>
            <p className="mt-2 text-gray-600">
              {verificationStatus === 'verified'
                ? 'メールアドレスの認証が完了しました'
                : '登録したメールアドレスに認証リンクを送信しました'}
            </p>
          </div>

          {verificationStatus === 'pending' && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-blue-600 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
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
                          登録されたメールアドレス（
                          {userEmail ? (
                            <span className="font-semibold text-blue-800">{userEmail}</span>
                          ) : (
                            <span className="text-gray-500">取得中...</span>
                          )}
                          ）をご確認ください
                        </li>
                        <li>「メールアドレスを認証する」ボタンをクリックしてください</li>
                        <li>認証が完了すると、自動的にダッシュボードに移動します</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {resendMessage && (
            <div
              className={`border rounded-lg p-4 mb-6 ${
                verificationStatus === 'verified'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-green-50 border-green-200'
              }`}
            >
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-green-600 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
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
                <svg className="h-5 w-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
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

          {verificationStatus === 'pending' && (
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

              <div className="text-center text-sm text-gray-500 space-y-2">
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
          )}

          {verificationStatus === 'verified' && (
            <div className="text-center">
              <Link
                href="/dashboard"
                className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                ダッシュボードに移動
              </Link>
            </div>
          )}

          {/* 🔥 デバッグ情報（開発環境のみ表示） */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-gray-100 rounded-lg">
              <h4 className="text-sm font-medium text-gray-800 mb-2">デバッグ情報:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p>Session Status: {status}</p>
                <p>Session Email: {session?.user?.email || 'なし'}</p>
                <p>Fetched Email: {userEmail || 'なし'}</p>
                <p>User ID: {session?.user?.id || 'なし'}</p>
                <p>Verification Status: {verificationStatus}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}