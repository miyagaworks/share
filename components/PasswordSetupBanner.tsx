// components/PasswordSetupBanner.tsx
// ダッシュボード用パスワード設定案内バナー
'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { HiShieldCheck, HiX, HiKey } from 'react-icons/hi';

interface PasswordSetupBannerProps {
  className?: string;
}

export function PasswordSetupBanner({ className }: PasswordSetupBannerProps) {
  const { data: session } = useSession();
  const [showBanner, setShowBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkPasswordStatus = async () => {
      if (!session?.user?.id) return;

      // localStorage で一度閉じたバナーかチェック
      const dismissedKey = `password-banner-dismissed-${session.user.id}`;
      if (localStorage.getItem(dismissedKey)) {
        setDismissed(true);
        setIsLoading(false);
        return;
      }

      try {
        // ユーザーのパスワード設定状況をチェック
        const response = await fetch('/api/user/check-password');
        if (response.ok) {
          const data = await response.json();
          // パスワードが設定されていない場合のみバナー表示
          setShowBanner(!data.hasPassword);
        }
      } catch (error) {
        console.error('Password status check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkPasswordStatus();
  }, [session]);

  const handleDismiss = () => {
    if (session?.user?.id) {
      const dismissedKey = `password-banner-dismissed-${session.user.id}`;
      localStorage.setItem(dismissedKey, 'true');
    }
    setDismissed(true);
  };

  if (isLoading || !showBanner || dismissed) {
    return null;
  }

  return (
    <div className={`rounded-lg bg-blue-50 border border-blue-200 p-4 mb-6 shadow-sm ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <HiShieldCheck className="h-6 w-6 text-blue-600" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-blue-800">セキュリティを強化しませんか？</h3>
          <div className="mt-2 text-sm text-blue-700">
            <p>
              現在Googleアカウントでログインしています。パスワードを設定すると、
              メール/パスワードでもログインできるようになり、より安全にアカウントを利用できます。
            </p>
          </div>
          <div className="mt-4 flex items-center space-x-3">
            <Link
              href="/auth/set-password"
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              <HiKey className="h-4 w-4 mr-2" />
              パスワードを設定
            </Link>
            <button
              onClick={handleDismiss}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              後で設定する
            </button>
          </div>
        </div>
        <div className="ml-3 flex-shrink-0">
          <button
            onClick={handleDismiss}
            className="inline-flex rounded-md p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-100 transition-colors"
          >
            <span className="sr-only">バナーを閉じる</span>
            <HiX className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}