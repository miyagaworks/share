// app/auth/invite/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { signIn } from 'next-auth/react';

// useSearchParamsを使用するコンテンツコンポーネント
function InvitePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // 名前関連のステートを追加
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastNameKana, setLastNameKana] = useState('');
  const [firstNameKana, setFirstNameKana] = useState('');
  const [email, setEmail] = useState('');
  // userIdは実際に使用する場合のみコメントを外してください
  // const [userId, setUserId] = useState('');

  // トークンの検証
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsValid(false);
        setError('招待リンクが無効です');
        setIsLoading(false);
        return;
      }

      try {
        // トークンを検証し、関連するユーザー情報を取得
        const response = await fetch(`/api/auth/verify-reset-token?token=${token}`);

        if (!response.ok) {
          const data = await response.json();
          setIsValid(false);
          setError(data.message || '招待リンクが無効または期限切れです');
          setIsLoading(false);
          return;
        }

        // 有効なトークンの場合、関連するユーザー情報を取得
        const userResponse = await fetch(`/api/corporate/users/invite/info?token=${token}`);
        const userData = await userResponse.json();

        if (!userResponse.ok) {
          setIsValid(false);
          setError('ユーザー情報の取得に失敗しました');
          setIsLoading(false);
          return;
        }

        // ユーザー情報をセット
        setEmail(userData.email || '');

        // 名前情報がある場合は分割して設定
        if (userData.name) {
          const nameParts = userData.name.split(' ');
          if (nameParts.length >= 2) {
            setLastName(nameParts[0] || '');
            setFirstName(nameParts[1] || '');
          } else {
            // 分割できない場合は姓のみにセット
            setLastName(userData.name);
          }
        }

        // ここでuserIdを設定するため、setUserIdを使用
        // setUserId(userData.userId || '');
        setIsValid(true);
        setIsLoading(false);
      } catch (error) {
        console.error('招待検証エラー:', error);
        setIsValid(false);
        setError('招待の検証中にエラーが発生しました');
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  // フォーム送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    if (password.length < 8) {
      setError('パスワードは8文字以上必要です');
      return;
    }

    setIsLoading(true);

    try {
      // パスワードを設定し、招待を完了する
      const response = await fetch('/api/corporate/users/invite/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
          // 姓名とフリガナを個別に送信
          lastName,
          firstName,
          lastNameKana,
          firstNameKana,
          // フルネームも念のため送信
          name: `${lastName} ${firstName}`.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '招待の受け入れに失敗しました');
      }

      // 招待完了後、自動ログイン
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error('自動ログインに失敗しました');
      }

      // ダッシュボードへリダイレクト
      router.push('/dashboard/corporate');
    } catch (error) {
      console.error('招待受け入れエラー:', error);
      setError(error instanceof Error ? error.message : '招待の受け入れに失敗しました');
      setIsLoading(false);
    }
  };

  // ローディング表示
  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 flex-col justify-center items-center p-12 relative overflow-hidden"></div>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-4">招待を確認中...</h2>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 無効なトークンの場合
  if (!isValid) {
    return (
      <div className="flex min-h-screen">
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 flex-col justify-center items-center p-12 relative overflow-hidden"></div>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-4">無効な招待リンク</h2>
            <p className="text-gray-600 mb-8">{error || '招待リンクが無効か期限切れです。'}</p>
            <Link
              href="/auth/signin"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-800 transition-colors"
            >
              ログインページへ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 有効なトークンの場合、アカウント設定フォームを表示
  return (
    <div className="flex min-h-screen">
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 flex-col justify-center items-center p-12 relative overflow-hidden"></div>
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Image
              src="/logo_blue.svg"
              alt="Share Logo"
              width={90}
              height={90}
              className="mx-auto"
              priority
            />
            <h2 className="text-3xl mt-8 font-bold text-gray-900">招待を受け入れる</h2>
            <p className="mt-2 text-gray-600">アカウント情報を入力して設定を完了してください</p>
          </div>

          {error && (
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
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                label="メールアドレス"
                type="email"
                value={email}
                disabled
                className="bg-gray-50"
              />
              <p className="mt-1 text-xs text-gray-500">招待時のメールアドレスが設定されています</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  label="姓"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="bg-white"
                  placeholder="山田"
                />
              </div>
              <div>
                <Input
                  label="名"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="bg-white"
                  placeholder="太郎"
                />
              </div>
              <div>
                <Input
                  label="姓（フリガナ）"
                  type="text"
                  value={lastNameKana}
                  onChange={(e) => setLastNameKana(e.target.value)}
                  required
                  className="bg-white"
                  placeholder="ヤマダ"
                />
              </div>
              <div>
                <Input
                  label="名（フリガナ）"
                  type="text"
                  value={firstNameKana}
                  onChange={(e) => setFirstNameKana(e.target.value)}
                  required
                  className="bg-white"
                  placeholder="タロウ"
                />
              </div>
            </div>

            <div>
              <Input
                label="パスワード"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white"
                placeholder="********"
              />
              <p className="mt-1 text-xs text-gray-500">8文字以上で入力してください</p>
            </div>

            <div>
              <Input
                label="パスワード（確認）"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-white"
                placeholder="********"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 text-white hover:bg-blue-800 transform hover:-translate-y-0.5 transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
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
                  処理中...
                </span>
              ) : (
                'アカウント設定を完了する'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

// メインコンポーネント - Suspenseでラップ
export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen">
          <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 flex-col justify-center items-center p-12 relative overflow-hidden"></div>
          <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-6 py-12 bg-white">
            <div className="w-full max-w-md text-center">
              <div className="mb-8">
                <div className="w-[90px] h-[90px] mx-auto bg-gray-200 animate-pulse rounded-md"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded-md w-3/4 mx-auto mb-4 animate-pulse"></div>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <InvitePageContent />
    </Suspense>
  );
}