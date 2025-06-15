// app/auth/set-password/page.tsx
'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';

const SetPasswordSchema = z
  .object({
    password: z.string().min(8, 'パスワードは8文字以上である必要があります'),
    confirmPassword: z.string().min(8, 'パスワードは8文字以上である必要があります'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  });

type SetPasswordFormData = z.infer<typeof SetPasswordSchema>;

export default function SetPasswordPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<SetPasswordFormData>({
    resolver: zodResolver(SetPasswordSchema),
    mode: 'onChange',
  });

  const password = watch('password');
  const confirmPassword = watch('confirmPassword');

  // ログインしていない場合はログインページにリダイレクト
  if (status === 'loading') {
    return <div className="flex justify-center items-center min-h-screen">読み込み中...</div>;
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  const onSubmit = async (data: SetPasswordFormData) => {
    try {
      setError(null);
      setSuccess(null);
      setIsPending(true);

      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'パスワード設定に失敗しました');
      }

      setSuccess('パスワードが正常に設定されました。今後はメール/パスワードでもログインできます。');

      // 3秒後にダッシュボードにリダイレクト
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('パスワード設定中にエラーが発生しました');
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            パスワードを設定
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Googleアカウントに加えて、メール/パスワードでもログインできるようになります
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200">
              <div className="flex items-center">
                <svg className="h-5 w-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
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
            <div className="rounded-lg bg-green-50 p-4 text-sm text-green-600 border border-green-200">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 mr-2 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
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
            <div>
              <Input
                label="新しいパスワード"
                type="password"
                placeholder="8文字以上のパスワード"
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
                placeholder="パスワードを再入力"
                {...register('confirmPassword')}
                error={errors.confirmPassword?.message}
                disabled={isPending}
                className="bg-white shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Button
              type="submit"
              className={`w-full text-white transition-colors shadow-md ${
                isValid && password && confirmPassword
                  ? 'bg-blue-600 hover:bg-blue-800'
                  : 'bg-blue-300 cursor-not-allowed'
              }`}
              disabled={isPending || !isValid || !password || !confirmPassword}
            >
              {isPending ? (
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
                  設定中...
                </span>
              ) : (
                'パスワードを設定'
              )}
            </Button>

            <Link
              href="/dashboard"
              className="w-full block text-center text-blue-600 hover:text-blue-800 text-sm underline"
            >
              後で設定する（ダッシュボードに戻る）
            </Link>
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>パスワードを設定することで、Googleアカウントが利用できない場合でも</p>
          <p>メールアドレスとパスワードでログインできるようになります。</p>
        </div>
      </div>
    </div>
  );
}