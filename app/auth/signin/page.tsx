// app/auth/signin/page.tsx (UIレイアウト改善版 - 利用規約チェック削除)
'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema } from '@/schemas/auth';
import { signIn, getSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import RecaptchaWrapper from '@/components/RecaptchaWrapper';

// 折りたたみアイコンコンポーネント
function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// SessionTimeoutMessageの内部実装
function SessionTimeoutMessageInner() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<{
    title: string;
    message: string;
    icon: string;
  } | null>(null);

  useEffect(() => {
    const timeoutReason =
      searchParams?.get('timeout') ||
      searchParams?.get('expired') ||
      searchParams?.get('inactive') ||
      searchParams?.get('security');

    if (!timeoutReason) return;

    const getMessage = () => {
      switch (timeoutReason) {
        case '1':
        case 'timeout':
          return {
            title: 'セッションタイムアウト',
            message: 'セッションがタイムアウトしました。再度ログインしてください。',
            icon: '⏰',
          };
        case 'expired':
          return {
            title: 'セッション期限切れ',
            message: 'セッションの有効期限が切れました。再度ログインしてください。',
            icon: '⏰',
          };
        case 'inactive':
          return {
            title: '非アクティブタイムアウト',
            message: '長時間非アクティブだったため、セキュリティ上の理由でログアウトしました。',
            icon: '🔒',
          };
        case 'security':
          return {
            title: 'セキュリティログアウト',
            message: 'セキュリティ上の理由でログアウトしました。再度ログインしてください。',
            icon: '🔒',
          };
        default:
          return {
            title: 'セッション終了',
            message: '再度ログインしてください。',
            icon: 'ℹ️',
          };
      }
    };

    setMessage(getMessage());
  }, [searchParams]);

  if (!message) return null;

  return (
    <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 mb-6 shadow-sm">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-xl" role="img" aria-label={message.title}>
            {message.icon}
          </span>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">{message.title}</h3>
          <div className="mt-1 text-sm text-yellow-700">
            <p>{message.message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function VerificationMessageInner() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  useEffect(() => {
    const errorType = searchParams?.get('error');
    const messageType = searchParams?.get('message');

    if (errorType) {
      switch (errorType) {
        case 'invalid_token':
          setMessage({
            title: '認証エラー',
            message: '無効な認証リンクです。新しい認証メールをリクエストしてください。',
            type: 'error',
          });
          break;
        case 'token_expired':
          setMessage({
            title: '認証リンク期限切れ',
            message:
              '認証リンクの有効期限が切れています。新しい認証メールをリクエストしてください。',
            type: 'error',
          });
          break;
        case 'verification_failed':
          setMessage({
            title: '認証失敗',
            message: 'メール認証中にエラーが発生しました。再度お試しください。',
            type: 'error',
          });
          break;
        case 'google_signin_failed':
          setMessage({
            title: 'Googleログインエラー',
            message: 'Googleログインに失敗しました。再度お試しください。',
            type: 'error',
          });
          break;
      }
    } else if (messageType) {
      switch (messageType) {
        case 'email_verified':
          setMessage({
            title: 'メール認証完了',
            message: 'メールアドレスの認証が完了しました。ログインしてください。',
            type: 'success',
          });
          break;
        case 'already_verified':
          setMessage({
            title: 'すでに認証済み',
            message: 'このメールアドレスは既に認証済みです。ログインしてください。',
            type: 'info',
          });
          break;
      }
    }
  }, [searchParams]);

  if (!message) return null;

  const bgColor =
    message.type === 'success'
      ? 'bg-green-50 border-green-200'
      : message.type === 'error'
        ? 'bg-red-50 border-red-200'
        : 'bg-blue-50 border-blue-200';

  const textColor =
    message.type === 'success'
      ? 'text-green-800'
      : message.type === 'error'
        ? 'text-red-800'
        : 'text-blue-800';

  const iconColor =
    message.type === 'success'
      ? 'text-green-600'
      : message.type === 'error'
        ? 'text-red-600'
        : 'text-blue-600';

  return (
    <div className={`rounded-lg ${bgColor} p-4 mb-6 shadow-sm`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {message.type === 'success' ? (
            <svg
              className={`h-5 w-5 ${iconColor}`}
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
          ) : message.type === 'error' ? (
            <svg
              className={`h-5 w-5 ${iconColor}`}
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
          ) : (
            <svg
              className={`h-5 w-5 ${iconColor}`}
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
          )}
        </div>
        <div className="ml-3">
          <h3 className={`text-sm font-medium ${textColor}`}>{message.title}</h3>
          <div className={`mt-1 text-sm ${textColor.replace('800', '700')}`}>
            <p>{message.message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Suspenseでラップしたコンポーネント
function VerificationMessage() {
  return (
    <Suspense fallback={null}>
      <VerificationMessageInner />
    </Suspense>
  );
}

function SessionTimeoutMessage() {
  return (
    <Suspense fallback={null}>
      <SessionTimeoutMessageInner />
      <VerificationMessage />
    </Suspense>
  );
}

export default function SigninPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isEmailFilled, setIsEmailFilled] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isPasswordFilled, setIsPasswordFilled] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);

  // 🎨 新機能: 折りたたみ状態の管理
  const [isEmailFormExpanded, setIsEmailFormExpanded] = useState(false);

  // Google認証を開始する関数
  const handleGoogleSignIn = async () => {
    if (!recaptchaToken) {
      setError('Googleでログインする場合もreCAPTCHAを完了してください');
      return;
    }

    try {
      setError(null);
      setIsPending(true);

      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Google signin started');
      }

      const result = await signIn('google', {
        redirect: false,
        callbackUrl: '/dashboard',
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('Google signin result:', result);
      }

      if (result?.error) {
        console.error('Google signin error:', result.error);

        // 🔧 エラーメッセージを詳細に判定
        if (result.error.includes('このメールアドレスは登録されていません')) {
          setError('このメールアドレスは登録されていません。まず新規登録を行ってください。');
        } else if (
          result.error.includes('メール/パスワードで登録') ||
          result.error.includes('CredentialsSignin')
        ) {
          setError(
            'このメールアドレスはメール/パスワードで登録されています。下記のフォームからメールアドレスとパスワードでログインしてください。',
          );
        } else {
          setError('Googleログインでエラーが発生しました。再度お試しください。');
        }
        setIsPending(false);
        return;
      }

      if (result?.ok && result?.url) {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Google signin successful, redirecting...');
        }
        window.location.href = result.url;
      } else if (result?.ok) {
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Google signin exception:', error);
      setError('Googleログインでエラーが発生しました。再度お試しください。');
      setIsPending(false);
    }
  };

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onChange',
  });

  const watchEmail = watch('email');
  const watchPassword = watch('password');

  // 入力フィールドの状態を監視
  useEffect(() => {
    const emailValue = watchEmail?.trim() || '';
    const passwordValue = watchPassword || '';

    setIsEmailFilled(emailValue.length > 0);
    setIsPasswordFilled(passwordValue.length > 0);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsEmailValid(emailRegex.test(emailValue));
    setIsPasswordValid(passwordValue.length >= 8);

    const formIsValid =
      emailValue.length > 0 &&
      emailRegex.test(emailValue) &&
      passwordValue.length >= 8 &&
      !Object.keys(errors).length &&
      !!recaptchaToken &&
      recaptchaLoaded;

    setIsFormValid(formIsValid);
  }, [watchEmail, watchPassword, errors, isValid, recaptchaToken, recaptchaLoaded]);

  // reCAPTCHA確認時の処理
  const handleRecaptchaChange = (token: string | null) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔒 reCAPTCHA Token changed:', token ? 'Token received' : 'Token cleared');
    }
    setRecaptchaToken(token);
    setRecaptchaLoaded(true);

    if (!token) {
      setError('reCAPTCHAの認証に失敗しました。再度お試しください。');
    } else {
      if (error && error.includes('reCAPTCHA')) {
        setError(null);
      }
    }
  };

  const onSubmit = async (data: { email: string; password: string }) => {
    if (!recaptchaToken) {
      setError('reCAPTCHAを完了してください');
      return;
    }

    try {
      setError(null);
      setIsPending(true);

      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Credentials signin started');
      }

      const result = await signIn('credentials', {
        email: data.email.toLowerCase(),
        password: data.password,
        recaptchaToken: recaptchaToken,
        redirect: false,
        callbackUrl: '/dashboard',
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Credentials signin result:', result);
      }

      if (result?.error) {
        if (result.error === 'CredentialsSignin') {
          setError(
            'メールアドレスまたはパスワードが正しくありません。Googleで登録した場合は「Googleでログイン」をご利用ください。',
          );
        } else {
          setError('ログインに失敗しました。再度お試しください。');
        }
        setRecaptchaToken(null);
        setRecaptchaLoaded(false);
      } else if (result?.ok) {
        const session = await getSession();
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Session after credentials signin:', session);
        }

        if (session?.user) {
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Session confirmed, redirecting to dashboard');
          }
          window.location.href = '/dashboard';
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ No session found after successful signin');
          }
          setError('ログイン後のセッション確認に失敗しました。再度お試しください。');
        }
      }
    } catch (error) {
      console.error('💥 Credentials signin exception:', error);
      setError('ログイン処理中にエラーが発生しました。');
      setRecaptchaToken(null);
      setRecaptchaLoaded(false);
    } finally {
      setIsPending(false);
    }
  };

  // パスワードの表示/非表示を切り替える関数
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex min-h-screen">
      {/* 左側：デコレーション部分 */}
      <div
        className="hidden md:flex md:w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
          color: '#ffffff',
        }}
      >
        <div className="absolute inset-0 opacity-20" style={{ backgroundColor: '#1d4ed8' }}>
          <div className="absolute inset-0 bg-pattern opacity-10"></div>
        </div>
        <div className="z-10 max-w-md text-center" style={{ color: '#ffffff' }}>
          <h1 className="text-4xl font-bold mb-6" style={{ color: '#ffffff' }}>
            Share
          </h1>
          <p className="text-xl mb-8" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            シンプルにつながる、スマートにシェア。
          </p>
          <div className="flex flex-col space-y-4 mt-12">
            <div
              className="backdrop-blur-sm p-6 rounded-xl"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            >
              <p className="text-left mb-3" style={{ color: '#ffffff' }}>
                「Share」を使えば、あなたのSNSアカウントと連絡先情報をひとつにまとめて、簡単に共有できます。
              </p>
              <p className="text-left" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                QRコードでシェアして、ビジネスでもプライベートでも人とのつながりをもっと簡単に。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 右側：ログインフォーム */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="md:hidden flex justify-center mb-8">
              <Image src="/logo_blue.svg" alt="Share Logo" width={90} height={90} priority />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">ログイン</h2>
            <p className="mt-2 text-gray-600">ログインしてSNS情報を管理しましょう</p>
          </div>

          {/* Suspenseでラップしたセッションタイムアウトメッセージ */}
          <SessionTimeoutMessage />

          {/* 🎨 新レイアウト: Googleログインを最優先 */}
          <div className="space-y-6">
            {/* エラー表示 */}
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200 shadow-sm">
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
                  {error}
                </div>
              </div>
            )}

            {/* reCAPTCHA */}
            <div>
              <RecaptchaWrapper
                onVerify={handleRecaptchaChange}
                onExpired={() => {
                  setRecaptchaToken(null);
                  setRecaptchaLoaded(false);
                }}
                action="login"
              />
            </div>

            {/* 🎨 メイン: Googleログインボタン（最優先） */}
            <div>
              <Button
                className={`w-full bg-white text-gray-700 border border-gray-300 flex items-center justify-center transform hover:-translate-y-0.5 transition min-h-[48px] md:min-h-0 ${
                  recaptchaToken ? 'hover:bg-gray-50 shadow-sm' : 'opacity-50 cursor-not-allowed'
                }`}
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={isPending || !recaptchaToken}
              >
                <Image
                  src="/google-logo.svg"
                  alt="Google"
                  width={20}
                  height={20}
                  className="mr-2"
                />
                Googleでログイン
              </Button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                推奨：Googleアカウントで簡単ログイン
              </p>
            </div>

            {/* 🎨 折りたたみ式: メール/パスワード認証 */}
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">または</span>
                </div>
              </div>

              {/* 折りたたみトリガーボタン */}
              <div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-gray-50 text-gray-700 border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition min-h-[48px] md:min-h-0"
                  onClick={() => setIsEmailFormExpanded(!isEmailFormExpanded)}
                  disabled={isPending}
                >
                  <span>メール/パスワードでログイン</span>
                  <ChevronIcon isOpen={isEmailFormExpanded} />
                </Button>
              </div>

              {/* 🎨 展開可能なメール/パスワードフォーム */}
              <div
                className={`space-y-4 transition-all duration-300 ease-in-out overflow-hidden ${
                  isEmailFormExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Input
                      label="メールアドレス"
                      type="email"
                      placeholder="example@example.com"
                      {...register('email')}
                      error={errors.email?.message}
                      disabled={isPending}
                      className={`bg-white shadow-sm transition-colors ${isEmailFilled && isEmailValid ? 'border-blue-500 focus:border-blue-500' : ''}`}
                      autoComplete="email"
                    />
                    {isEmailFilled && !isEmailValid && !errors.email?.message && (
                      <p className="text-xs text-amber-600 mt-1">
                        有効なメールアドレスを入力してください
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="relative">
                      <Input
                        label="パスワード"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="********"
                        {...register('password')}
                        error={errors.password?.message}
                        disabled={isPending}
                        className={`bg-white shadow-sm transition-colors ${isPasswordFilled && isPasswordValid ? 'border-blue-500 focus:border-blue-500' : ''}`}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-8 h-5 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none z-10"
                        onClick={togglePasswordVisibility}
                        tabIndex={-1}
                        style={{
                          top: 'calc(50% + 3px)',
                          transform: 'translateY(-50%)',
                        }}
                      >
                        {showPassword ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        )}
                      </button>
                    </div>
                    {isPasswordFilled && !isPasswordValid && !errors.password?.message && (
                      <p className="text-xs text-amber-600 mt-1">
                        パスワードは8文字以上である必要があります
                      </p>
                    )}
                    <div className="flex justify-end mt-1">
                      <Link
                        href="/auth/forgot-password"
                        className="text-sm text-blue-600 hover:text-blue-500 hover:underline"
                      >
                        パスワードをお忘れの方
                      </Link>
                    </div>
                  </div>

                  {/* メール/パスワードログインボタン */}
                  <div>
                    <Button
                      type="submit"
                      className={`w-full text-white transition-colors shadow-md min-h-[48px] md:min-h-0 ${
                        isFormValid
                          ? 'bg-blue-600 hover:bg-blue-800 transform hover:-translate-y-0.5'
                          : 'bg-blue-300 hover:bg-blue-400'
                      }`}
                      disabled={isPending || !isFormValid}
                    >
                      {isPending ? (
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
                          ログイン中...
                        </span>
                      ) : (
                        'ログイン'
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>

            {/* 新規登録リンク */}
            <div className="text-center text-sm mt-8">
              アカウントをお持ちでない場合は{' '}
              <Link
                href="/auth/signup"
                className="font-medium text-blue-600 hover:text-blue-500 hover:underline"
              >
                新規登録
              </Link>{' '}
              してください。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}