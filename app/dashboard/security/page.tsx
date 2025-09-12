// app/dashboard/security/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { HiShieldCheck, HiKey, HiCheck, HiExclamation } from 'react-icons/hi';
import { Spinner } from '@/components/ui/Spinner';

export default function SecurityPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [hasGoogleAuth, setHasGoogleAuth] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      if (!session?.user?.id) return;

      try {
        // 既存のパスワードチェックと統合
        const response = await fetch('/api/user/auth-methods');
        if (response.ok) {
          const data = await response.json();
          setHasPassword(data.hasPassword);
          setHasGoogleAuth(data.hasGoogleAuth);
        }
      } catch (error) {
        console.error('Auth status check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, [session]);

  useEffect(() => {
    const checkPasswordStatus = async () => {
      if (!session?.user?.id) return;

      try {
        const response = await fetch('/api/user/check-password');
        if (response.ok) {
          const data = await response.json();
          setHasPassword(data.hasPassword);
        }
      } catch (error) {
        console.error('Password status check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkPasswordStatus();
  }, [session]);

  const handleSetPassword = () => {
    router.push('/auth/set-password');
  };

  const handleChangePassword = () => {
    router.push('/auth/change-password');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-500">読み込み中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">セキュリティ設定</h1>
          <p className="text-muted-foreground">アカウントのセキュリティを管理します</p>
        </div>
      </div>

      {/* パスワード設定状態 */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <HiKey className="h-5 w-5 text-gray-700 mr-2" />
            <h2 className="text-lg font-semibold">パスワード管理</h2>
          </div>
        </div>

        <div className="p-6">
          {hasPassword === false ? (
            // パスワード未設定の場合
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <HiExclamation className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    パスワードが設定されていません
                  </h3>
                  <p className="mt-2 text-sm text-blue-700 text-justify">
                    現在Googleアカウントでログインしています。パスワードを設定すると、
                    メール/パスワードでもログインできるようになり、より安全にアカウントを利用できます。
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // パスワード設定済みの場合
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <HiCheck className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">パスワード設定済み</h3>
                  <p className="mt-2 text-sm text-green-700 text-justify">
                    パスワードが設定されています。メール/パスワードでログインできます。
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-center mt-4">
            {hasPassword === false ? (
              <button
                onClick={handleSetPassword}
                className="inline-flex items-center justify-center 
                 w-full sm:w-auto sm:min-w-[180px] 
                 px-5 sm:px-6 py-4 sm:py-3.5 
                 bg-blue-600 text-white 
                 text-base sm:text-base font-medium 
                 rounded-md hover:bg-blue-700 active:bg-blue-800 
                 transition-all duration-150 transform hover:scale-[1.02] 
                 shadow-md hover:shadow-lg"
              >
                <HiKey className="h-5 w-5 mr-2" />
                パスワードを設定
              </button>
            ) : (
              <button
                onClick={handleChangePassword}
                className="inline-flex items-center justify-center 
                 w-full sm:w-auto sm:min-w-[180px] 
                 px-5 sm:px-6 py-4 sm:py-3.5 
                 bg-blue-600 text-white 
                 text-base sm:text-base font-medium 
                 rounded-md hover:bg-blue-700 active:bg-blue-800 
                 transition-all duration-150 transform hover:scale-[1.02] 
                 shadow-md hover:shadow-lg"
              >
                <HiKey className="h-5 w-5 mr-2" />
                パスワードを変更
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ログイン方法 */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <HiShieldCheck className="h-5 w-5 text-gray-700 mr-2" />
            <h2 className="text-lg font-semibold">ログイン方法</h2>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {' '}
          {/* ← ここを修正：モバイルでパディングを調整 */}
          <div className="space-y-3">
            {/* Google認証 - 実際に連携されている場合のみ表示 */}
            {hasGoogleAuth && (
              <div className="flex items-center justify-between p-3 sm:p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="flex items-center flex-1 min-w-0 mr-2">
                  <svg className="w-5 h-5 mr-2 sm:mr-3 flex-shrink-0" viewBox="0 0 24 24">
                    {/* Google icon SVG paths */}
                  </svg>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                      Google アカウント
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">連携済み</p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-200">
                    <svg className="w-3 h-3 mr-0.5 sm:mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    有効
                  </span>
                </div>
              </div>
            )}

            {/* メール/パスワード認証 */}
            <div className="flex items-center justify-between p-3 sm:p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex items-center flex-1 min-w-0 mr-2">
                <HiKey className="h-5 w-5 text-gray-600 mr-2 sm:mr-3 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                    メール / パスワード
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">
                    {hasPassword ? 'パスワードでログインできます' : 'パスワードを設定してください'}
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0">
                {hasPassword ? (
                  <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-200">
                    <svg className="w-3 h-3 mr-0.5 sm:mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    有効
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 bg-gray-50 text-gray-600 text-xs font-semibold rounded-full border border-gray-200">
                    <svg className="w-3 h-3 mr-0.5 sm:mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    未設定
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* セキュリティのヒント */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">セキュリティのヒント</h3>
        <ul className="space-y-2 text-sm text-gray-600 text-justify">
          <li className="flex items-start">
            <span className="text-blue-500 mr-2">•</span>
            パスワードは8文字以上で、英数字を組み合わせた強力なものを設定してください。
          </li>
          <li className="flex items-start">
            <span className="text-blue-500 mr-2">•</span>
            定期的にパスワードを変更することをお勧めします。
          </li>
          <li className="flex items-start">
            <span className="text-blue-500 mr-2">•</span>
            他のサービスと同じパスワードの使用は避けてください。
          </li>
        </ul>
      </div>
    </div>
  );
}