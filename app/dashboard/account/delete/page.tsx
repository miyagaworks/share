// app/dashboard/account/delete/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
// カスタムエラーメッセージコンポーネント
function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-4">
      <p className="text-sm">{message}</p>
    </div>
  );
}
// カスタム情報メッセージコンポーネント
function InfoMessage({ message }: { message: string }) {
  return (
    <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-md p-4 mb-4">
      <p className="text-sm">{message}</p>
    </div>
  );
}
// カスタムローディングスピナーコンポーネント
function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };
  return (
    <div className="flex justify-center">
      <svg
        className={`${sizeClasses[size]} animate-spin text-white`}
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
    </div>
  );
}
export default function DeleteAccountPage() {
  const { status } = useSession();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOAuthUser, setIsOAuthUser] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // ユーザー情報を取得してOAuthユーザーかどうかを判断
  useEffect(() => {
    if (status === 'authenticated') {
      // ユーザー情報APIを呼び出す
      const checkUserPassword = async () => {
        try {
          const response = await fetch('/api/user/check-password');
          const data = await response.json();
          setIsOAuthUser(!data.hasPassword);
        } catch {
        }
      };
      checkUserPassword();
    }
  }, [status]);
  // 認証チェック
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center h-48">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    );
  }
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    // 確認テキスト検証
    if (confirmText !== '削除します') {
      setError('確認テキストが正しくありません');
      setLoading(false);
      return;
    }
    // 通常ユーザーの場合のみパスワード検証
    if (!isOAuthUser && !password) {
      setError('パスワードを入力してください');
      setLoading(false);
      return;
    }
    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'アカウントの削除に失敗しました');
      }
      // 成功したらログアウトしてホームページへ
      await signOut({ callbackUrl: '/' });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('アカウントの削除に失敗しました。もう一度お試しください。');
      }
      setLoading(false);
    }
  };
  // パスワードの表示/非表示を切り替える関数
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  // パンくずリストは不要なので、シンプルなレイアウトを使用
  return (
    <div className="min-h-screen flex flex-col pt-24 pb-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6 text-center">アカウント削除</h1>
        <Card className="mb-6 p-6 border-red-200 bg-red-50">
          <h2 className="text-xl font-semibold text-red-700 mb-4">警告: アカウント削除について</h2>
          <div className="space-y-3 text-gray-800">
            <p>
              アカウントを削除すると、以下のデータが<strong>完全に削除</strong>
              され、復元することはできません:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>プロフィール情報</li>
              <li>登録したSNSリンク</li>
              <li>カスタムリンク</li>
              <li>支払い情報（サブスクリプションは自動的にキャンセルされます）</li>
              <li>共有ページへのアクセス</li>
            </ul>
            <p className="font-medium">
              この操作は取り消すことができません。十分にご注意ください。
            </p>
          </div>
        </Card>
        <Card className="p-6">
          {error && <ErrorMessage message={error} />}
          {isOAuthUser && (
            <InfoMessage message="ソーシャルログイン（Google等）でアカウントを作成されたため、アカウント削除にパスワードは必要ありません。" />
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isOAuthUser && (
              <div>
                <div className="relative">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    パスワードを入力して確認
                  </label>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="現在のパスワード"
                    required={!isOAuthUser}
                  />
                  <button
                    type="button"
                    className="absolute right-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                    onClick={togglePasswordVisibility}
                    tabIndex={-1}
                    style={{ top: 'calc(50% + 12px)', transform: 'translateY(-50%)' }}
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
              </div>
            )}
            <div>
              <label htmlFor="confirmText" className="block text-sm font-medium text-gray-700 mb-1">
                確認のため「削除します」と入力してください
              </label>
              <Input
                id="confirmText"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="削除します"
                required
              />
            </div>
            <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="w-full sm:w-auto"
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                variant="default"
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
                disabled={loading || confirmText !== '削除します'}
              >
                {loading ? <LoadingSpinner size="sm" /> : 'アカウントを完全に削除する'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
