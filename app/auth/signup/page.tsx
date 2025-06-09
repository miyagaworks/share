// app/auth/signup/page.tsx (メール保存追加版)
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterSchema } from '@/schemas/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { signIn } from 'next-auth/react';

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isLastNameFilled, setIsLastNameFilled] = useState(false);
  const [isFirstNameFilled, setIsFirstNameFilled] = useState(false);
  const [isLastNameKanaFilled, setIsLastNameKanaFilled] = useState(false);
  const [isFirstNameKanaFilled, setIsFirstNameKanaFilled] = useState(false);
  const [isEmailFilled, setIsEmailFilled] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isPasswordFilled, setIsPasswordFilled] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Google認証を開始する関数
  const handleGoogleSignIn = () => {
    // 利用規約の同意確認
    if (!termsAccepted) {
      setError('Googleで登録する場合も利用規約に同意していただく必要があります');
      return;
    }
    // 同意している場合のみGoogleログインを実行
    signIn('google', { callbackUrl: '/dashboard' });
  };

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      lastName: '',
      firstName: '',
      lastNameKana: '',
      firstNameKana: '',
      email: '',
      password: '',
    },
    mode: 'onChange', // リアルタイムバリデーション
  });

  const watchLastName = watch('lastName');
  const watchFirstName = watch('firstName');
  const watchLastNameKana = watch('lastNameKana');
  const watchFirstNameKana = watch('firstNameKana');
  const watchEmail = watch('email');
  const watchPassword = watch('password');

  // 入力フィールドの状態を監視
  useEffect(() => {
    // 空白を除去した後の各フィールドの値が空でないかを確認
    const lastNameValue = watchLastName?.trim() || '';
    const firstNameValue = watchFirstName?.trim() || '';
    const lastNameKanaValue = watchLastNameKana?.trim() || '';
    const firstNameKanaValue = watchFirstNameKana?.trim() || '';
    const emailValue = watchEmail?.trim() || '';
    const passwordValue = watchPassword || '';

    setIsLastNameFilled(lastNameValue.length > 0);
    setIsFirstNameFilled(firstNameValue.length > 0);
    setIsLastNameKanaFilled(lastNameKanaValue.length > 0);
    setIsFirstNameKanaFilled(firstNameKanaValue.length > 0);
    setIsEmailFilled(emailValue.length > 0);
    setIsPasswordFilled(passwordValue.length > 0);

    // メールアドレスの簡易バリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsEmailValid(emailRegex.test(emailValue));

    // パスワードの長さチェック
    setIsPasswordValid(passwordValue.length >= 8);

    // すべての条件が満たされていればフォームは有効
    const formIsValid =
      lastNameValue.length > 0 &&
      firstNameValue.length > 0 &&
      lastNameKanaValue.length > 0 &&
      firstNameKanaValue.length > 0 &&
      emailValue.length > 0 &&
      emailRegex.test(emailValue) &&
      passwordValue.length >= 8 &&
      !Object.keys(errors).length &&
      termsAccepted;

    setIsFormValid(formIsValid);
  }, [
    watchLastName,
    watchFirstName,
    watchLastNameKana,
    watchFirstNameKana,
    watchEmail,
    watchPassword,
    errors,
    isValid,
    termsAccepted,
  ]);

  // パスワードの表示/非表示を切り替える関数
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const onSubmit = async (data: {
    lastName: string;
    firstName: string;
    lastNameKana: string;
    firstNameKana: string;
    email: string;
    password: string;
  }) => {
    // 利用規約の同意確認
    if (!termsAccepted) {
      setError('利用規約に同意していただく必要があります');
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      setIsPending(true);

      const requestData = {
        lastName: data.lastName,
        firstName: data.firstName,
        lastNameKana: data.lastNameKana,
        firstNameKana: data.firstNameKana,
        email: data.email,
        password: data.password,
      };

      // 🔥 修正: メールアドレスをローカルストレージに保存
      localStorage.setItem('pendingVerificationEmail', data.email);

      // サインアップ処理
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'アカウント登録に失敗しました');
      }

      // アカウント登録成功
      // メール認証が必要な場合
      if (result.requiresEmailVerification) {
        setSuccess(
          'アカウントが作成されました。認証メールを送信しました。メール認証画面に移動します...',
        );

        // 🔥 メールアドレスをURLパラメータで渡す
        setTimeout(() => {
          const encodedEmail = encodeURIComponent(data.email);
          router.push(`/auth/email-verification?email=${encodedEmail}`);
        }, 3000);
      } else {
        // 従来の自動ログイン処理
        setSuccess('アカウントが正常に作成されました。自動的にログインしています...');
        const signInResult = await signIn('credentials', {
          email: data.email,
          password: data.password,
          redirect: false,
        });

        if (signInResult?.error) {
          setError(
            'アカウントは作成されましたが、自動ログインに失敗しました。ログイン画面からログインしてください。',
          );
          setTimeout(() => {
            router.push('/auth/signin');
          }, 3000);
        } else {
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('アカウント登録中にエラーが発生しました');
      }
      setSuccess(null);
    } finally {
      setIsPending(false);
    }
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
        <div className="absolute bottom-6 right-6 flex space-x-2">
          <span
            className="px-2 py-1 backdrop-blur-sm rounded-full text-xs"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
            }}
          >
            簡単設定
          </span>
          <span
            className="px-2 py-1 backdrop-blur-sm rounded-full text-xs"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
            }}
          >
            QRコード共有
          </span>
          <span
            className="px-2 py-1 backdrop-blur-sm rounded-full text-xs"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
            }}
          >
            スマート連携
          </span>
        </div>
      </div>

      {/* 右側：登録フォーム */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="md:hidden flex justify-center mb-8">
              <Image src="/logo_blue.svg" alt="Share Logo" width={90} height={90} priority />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">アカウント作成</h2>
            <p className="mt-2 text-gray-600">
              新しいアカウントを作成して、様々なSNSを管理しましょう
            </p>
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

            {success && (
              <div className="rounded-lg bg-green-50 p-4 text-sm text-green-600 border border-green-200 shadow-sm">
                <div className="flex items-center">
                  <svg
                    className="h-5 w-5 mr-2 text-green-500"
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
                  {success}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* 姓名入力フィールド */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    label="姓"
                    type="text"
                    placeholder="山田"
                    {...register('lastName')}
                    error={errors.lastName?.message}
                    disabled={isPending}
                    className={`bg-white shadow-sm transition-colors ${isLastNameFilled ? 'border-blue-500 focus:border-blue-500' : ''}`}
                  />
                </div>
                <div>
                  <Input
                    label="名"
                    type="text"
                    placeholder="太郎"
                    {...register('firstName')}
                    error={errors.firstName?.message}
                    disabled={isPending}
                    className={`bg-white shadow-sm transition-colors ${isFirstNameFilled ? 'border-blue-500 focus:border-blue-500' : ''}`}
                  />
                </div>
                <div>
                  <Input
                    label="姓（フリガナ）"
                    type="text"
                    placeholder="ヤマダ"
                    {...register('lastNameKana')}
                    error={errors.lastNameKana?.message}
                    disabled={isPending}
                    className={`bg-white shadow-sm transition-colors ${isLastNameKanaFilled ? 'border-blue-500 focus:border-blue-500' : ''}`}
                  />
                </div>
                <div>
                  <Input
                    label="名（フリガナ）"
                    type="text"
                    placeholder="タロウ"
                    {...register('firstNameKana')}
                    error={errors.firstNameKana?.message}
                    disabled={isPending}
                    className={`bg-white shadow-sm transition-colors ${isFirstNameKanaFilled ? 'border-blue-500 focus:border-blue-500' : ''}`}
                  />
                </div>
              </div>

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
                    className="absolute right-3 h-5 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none z-10"
                    onClick={togglePasswordVisibility}
                    tabIndex={-1}
                    style={{
                      top: 'calc(50% + 5px)', // ラベル分を考慮してinputフィールドの中央
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
              </div>

              {/* 利用規約同意チェックボックス */}
              <div className="mt-6">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="terms"
                      name="terms"
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      style={{
                        backgroundColor: '#ffffff',
                        borderColor: '#d1d5db',
                        accentColor: '#2563eb',
                        colorScheme: 'light',
                        filter: 'none',
                        appearance: 'auto',
                        WebkitAppearance: 'checkbox',
                        MozAppearance: 'checkbox',
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-0"
                      disabled={isPending}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="terms" className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">利用規約</span>に同意します
                    </label>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                      <Link
                        href="/legal/terms"
                        target="_blank"
                        className="text-blue-600 hover:text-blue-500 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        利用規約を読む
                      </Link>
                    </p>
                  </div>
                </div>
                {!termsAccepted && (
                  <p className="text-xs text-amber-600 mt-1">
                    登録を続けるには利用規約に同意する必要があります
                  </p>
                )}
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className={`w-full text-white transition-all shadow-md min-h-[48px] md:min-h-0 ${
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
                    登録処理中...
                  </span>
                ) : (
                  '登録する'
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

            <div className="mt-6">
              <Button
                className={`w-full bg-white text-gray-700 border border-gray-300 flex items-center justify-center transform hover:-translate-y-0.5 transition min-h-[48px] md:min-h-0 ${
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
                Googleで登録
              </Button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Googleで登録する場合も利用規約に同意する必要があります
              </p>
            </div>
          </div>

          <div className="text-center text-sm mt-8">
            すでにアカウントをお持ちの場合は{' '}
            <Link
              href="/auth/signin"
              className="font-medium text-blue-600 hover:text-blue-500 hover:underline"
            >
              ログイン
            </Link>{' '}
            してください。
          </div>
        </div>
      </div>
    </div>
  );
}