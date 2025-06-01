// app/auth/change-password/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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
        className={`${sizeClasses[size]} animate-spin text-primary`}
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
export default function ChangePasswordPage() {
  const { status } = useSession();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isOAuthUser, setIsOAuthUser] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      <div className="min-h-screen flex flex-col py-12">
        <div className="container mx-auto px-4">
          <Card className="max-w-md mx-auto p-6">
            <div className="flex justify-center items-center h-48">
              <LoadingSpinner size="lg" />
            </div>
          </Card>
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
    // 基本的な検証
    if (!isOAuthUser && !currentPassword) {
      setError('現在のパスワードを入力してください');
      setLoading(false);
      return;
    }
    if (!newPassword || !confirmPassword) {
      setError('新しいパスワードと確認用パスワードを入力してください');
      setLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('新しいパスワードと確認用パスワードが一致しません');
      setLoading(false);
      return;
    }
    if (newPassword.length < 8) {
      setError('パスワードは8文字以上必要です');
      setLoading(false);
      return;
    }
    try {
      const requestBody = isOAuthUser ? { newPassword } : { currentPassword, newPassword };
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'パスワードの変更に失敗しました');
      }
      // 成功
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      // 3秒後にダッシュボードにリダイレクト
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('パスワードの変更に失敗しました。もう一度お試しください。');
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex flex-col py-12">
      <div className="container mx-auto px-4">
        <Card className="max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold mb-6">
            {isOAuthUser ? 'パスワード設定' : 'パスワード変更'}
          </h1>
          {isOAuthUser && (
            <InfoMessage message="ソーシャルログイン（Google等）でアカウントを作成されたため、まだパスワードが設定されていません。ここでパスワードを設定すると、メールアドレスとパスワードでもログインできるようになります。" />
          )}
          {success ? (
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-md p-4 mb-4">
              <p>
                {isOAuthUser
                  ? 'パスワードが正常に設定されました。'
                  : 'パスワードが正常に変更されました。'}
                ダッシュボードにリダイレクトします...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <ErrorMessage message={error} />}
              {!isOAuthUser && (
                <div>
                  <div className="relative">
                    <label
                      htmlFor="currentPassword"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      現在のパスワード
                    </label>
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      tabIndex={-1}
                      style={{ top: 'calc(50% + 12px)', transform: 'translateY(-50%)' }}
                    >
                      {showCurrentPassword ? (
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
                <div className="relative">
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {isOAuthUser ? '新しいパスワード' : '新しいパスワード'}
                  </label>
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    tabIndex={-1}
                    style={{ top: 'calc(50% + 12px)', transform: 'translateY(-50%)' }}
                  >
                    {showNewPassword ? (
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
                <p className="mt-1 text-xs text-gray-500">8文字以上で入力してください</p>
              </div>
              <div>
                <div className="relative">
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {isOAuthUser ? '新しいパスワード（確認）' : '新しいパスワード（確認）'}
                  </label>
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    style={{ top: 'calc(50% + 12px)', transform: 'translateY(-50%)' }}
                  >
                    {showConfirmPassword ? (
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
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : isOAuthUser ? (
                  'パスワードを設定する'
                ) : (
                  'パスワードを変更する'
                )}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
