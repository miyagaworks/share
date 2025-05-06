// app/auth/signin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema } from '@/schemas/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SigninPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isEmailFilled, setIsEmailFilled] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isPasswordFilled, setIsPasswordFilled] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Google認証を開始する関数
  const handleGoogleSignIn = () => {
    if (!termsAccepted) {
      setError('Googleでログインする場合も利用規約に同意していただく必要があります');
      return;
    }

    // 直接next-auth/reactのsignInを使用
    import('next-auth/react').then(({ signIn }) => {
      signIn('google', { callbackUrl: '/dashboard' });
    });
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
      !Object.keys(errors).length;

    setIsFormValid(formIsValid);
  }, [watchEmail, watchPassword, errors, isValid]);

  // signIn関数
  const onSubmit = async (data: { email: string; password: string }) => {
    try {
      setError(null);
      setIsPending(true);

      // 1. 先に直接APIエンドポイントで認証
      const apiResponse = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email.toLowerCase(),
          password: data.password,
        }),
      });

      const apiResult = await apiResponse.json();

      // APIエラーがある場合
      if (!apiResponse.ok || apiResult.error) {
        setError(apiResult.error || 'メールアドレスまたはパスワードが正しくありません。');
        setIsPending(false);
        return;
      }

      // 2. 成功したら、クライアント側のsignIn関数で認証を完了
      const { signIn } = await import('next-auth/react');
      const result = await signIn('credentials', {
        email: data.email.toLowerCase(),
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError('セッションの開始に失敗しました。もう一度お試しください。');
        setIsPending(false);
        return;
      }

      // 3. ダッシュボードにリダイレクト
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      console.error('ログインエラー:', error);
      setError('ログイン処理中にエラーが発生しました。');
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

            <div className="space-y-4">
              <div>
                <Input
                  label="メールアドレス"
                  type="email"
                  placeholder="example@example.com"
                  {...register('email')}
                  error={errors.email?.message}
                  disabled={isPending}
                  className={`bg-white shadow-sm transition-colors ${isEmailFilled && isEmailValid ? 'border-blue-500 focus:border-blue-500' : ''}`}
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
                  />
                  <button
                    type="button"
                    className="absolute right-3 inset-y-0 my-auto h-5 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                    onClick={togglePasswordVisibility}
                    tabIndex={-1}
                    style={{ top: '50%', transform: 'translateY(-50%)', marginTop: '12px' }}
                  >
                    {showPassword ? (
                      // 目を閉じるアイコン (パスワードが表示されている状態)
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
                      // 目を開くアイコン (パスワードが非表示の状態)
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
            </div>

            <div>
              <Button
                type="submit"
                className={`w-full text-white transition-colors shadow-md ${
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

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">または</span>
              </div>
            </div>

            {/* 利用規約同意チェックボックス */}
            <div className="mt-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    disabled={isPending}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="terms" className="text-gray-700">
                    <span className="font-medium">利用規約</span>に同意します
                  </label>
                  <p className="text-gray-500 mt-1">
                    <Link
                      href="/legal/terms"
                      target="_blank"
                      className="text-blue-600 hover:text-blue-500 hover:underline"
                    >
                      利用規約を読む
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <Button
                className={`w-full bg-white text-gray-700 border border-gray-300 flex items-center justify-center transform hover:-translate-y-0.5 transition ${
                  termsAccepted ? 'hover:bg-gray-50 shadow-sm' : 'opacity-50 cursor-not-allowed'
                }`}
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={isPending || !termsAccepted}
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
                Googleでログインする場合も利用規約に同意する必要があります
              </p>
            </div>
          </div>

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
  );
}