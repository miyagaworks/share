// app/auth/reset-password/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// フォームのバリデーションスキーマ
const ResetPasswordSchema = z
  .object({
    password: z.string().min(8, 'パスワードは8文字以上である必要があります'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof ResetPasswordSchema>;

// ローディング表示用のコンポーネント
function LoadingFallback() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="text-center">
        <svg
          className="animate-spin h-12 w-12 text-blue-600 mx-auto"
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
        <p className="mt-4 text-gray-600">読み込み中...</p>
      </div>
    </div>
  );
}

// useSearchParamsを使用するコンテンツコンポーネント
function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isTokenChecking, setIsTokenChecking] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    mode: 'onChange', // リアルタイムバリデーション
  });

  // トークンの有効性をチェック
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsValidToken(false);
        setIsTokenChecking(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify-reset-token?token=${token}`);
        setIsValidToken(response.ok);
      } catch (error) {
        console.error('トークン検証エラー:', error);
        setIsValidToken(false);
      } finally {
        setIsTokenChecking(false);
      }
    };

    verifyToken();
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;

    try {
      setError(null);
      setSuccess(null);
      setIsPending(true);

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        setError(responseData.message || 'パスワードのリセット中にエラーが発生しました。');
        return;
      }

      setSuccess('パスワードが正常にリセットされました。新しいパスワードでログインしてください。');

      // 数秒後にログインページにリダイレクト
      setTimeout(() => {
        router.push('/auth/signin');
      }, 3000);
    } catch (error) {
      console.error('パスワードリセットエラー:', error);
      setError('リクエスト処理中にエラーが発生しました。');
    } finally {
      setIsPending(false);
    }
  };

  // トークンチェック中はローディング表示
  if (isTokenChecking) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-blue-600 mx-auto"
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
          <p className="mt-4 text-gray-600">トークンを確認中...</p>
        </div>
      </div>
    );
  }

  // トークンが無効な場合
  if (!isValidToken) {
    return (
      <div className="flex min-h-screen">
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 flex-col justify-center items-center p-12 relative"></div>
        <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-6 py-12 bg-white">
          <div className="w-full max-w-md text-center">
            <div className="mb-8">
              <Image
                src="/logo_blue.svg"
                alt="Share Logo"
                width={90}
                height={90}
                className="mx-auto"
                priority
              />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">無効なリンク</h2>
            <p className="text-gray-600 mb-8">
              パスワードリセット用のリンクが無効か期限切れです。再度パスワードリセットをリクエストしてください。
            </p>
            <Link
              href="/auth/forgot-password"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-800 transition-colors"
            >
              パスワードリセットを再リクエスト
            </Link>
          </div>
        </div>
      </div>
    );
  }

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

      {/* 右側：パスワードリセットフォーム */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="md:hidden flex justify-center mb-8">
              <Image src="/logo_blue.svg" alt="Share Logo" width={90} height={90} priority />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">新しいパスワード設定</h2>
            <p className="mt-2 text-gray-600">新しいパスワードを入力してください。</p>
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

            <div>
              <Input
                label="新しいパスワード"
                type="password"
                placeholder="********"
                {...register('password')}
                error={errors.password?.message}
                disabled={isPending}
                className="bg-white shadow-sm"
              />
            </div>

            <div>
              <Input
                label="パスワード確認"
                type="password"
                placeholder="********"
                {...register('confirmPassword')}
                error={errors.confirmPassword?.message}
                disabled={isPending}
                className="bg-white shadow-sm"
              />
            </div>

            <div>
              <Button
                type="submit"
                className={`w-full text-white transition-colors shadow-md ${
                  isValid
                    ? 'bg-blue-600 hover:bg-blue-800 transform hover:-translate-y-0.5'
                    : 'bg-blue-300 hover:bg-blue-400'
                }`}
                disabled={isPending || !isValid}
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
                    設定中...
                  </span>
                ) : (
                  'パスワードを変更'
                )}
              </Button>
            </div>
          </form>

          <div className="text-center text-sm mt-8">
            <Link
              href="/auth/signin"
              className="font-medium text-blue-600 hover:text-blue-500 hover:underline"
            >
              ログイン画面に戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// メインのエクスポート関数
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}