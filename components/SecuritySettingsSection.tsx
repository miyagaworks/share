// components/SecuritySettingsSection.tsx
// プロフィールページ用セキュリティ設定セクション
'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { Button } from '@/components/ui/Button';
import { HiShieldCheck, HiKey, HiCheckCircle } from 'react-icons/hi';

export function SecuritySettingsSection() {
  const { data: session } = useSession();
  const [passwordStatus, setPasswordStatus] = useState<{
    hasPassword: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSecurityStatus = async () => {
      if (!session?.user?.id) return;

      try {
        const response = await fetch('/api/user/check-password');
        if (response.ok) {
          const data = await response.json();
          setPasswordStatus(data);
        }
      } catch (error) {
        console.error('Security status check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSecurityStatus();
  }, [session]);

  if (isLoading) {
    return (
      <DashboardCard
        title="セキュリティ設定"
        description="アカウントのセキュリティ設定を管理します"
        className="mt-6"
      >
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      title="セキュリティ設定"
      description="アカウントのセキュリティ設定を管理します"
      className="mt-6"
    >
      <div className="space-y-4">
        {/* 認証方法の状況表示 */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <HiShieldCheck className="h-5 w-5 mr-2 text-gray-600" />
            現在の認証方法
          </h4>

          <div className="space-y-3">
            {/* Google認証 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium">Google認証</span>
              </div>
              <div className="flex items-center text-green-600">
                <HiCheckCircle className="h-4 w-4 mr-1" />
                <span className="text-xs">有効</span>
              </div>
            </div>

            {/* パスワード認証 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div
                  className={`w-3 h-3 rounded-full mr-3 ${
                    passwordStatus?.hasPassword ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                ></div>
                <span className="text-sm font-medium">メール/パスワード認証</span>
              </div>
              <div
                className={`flex items-center ${
                  passwordStatus?.hasPassword ? 'text-green-600' : 'text-gray-500'
                }`}
              >
                {passwordStatus?.hasPassword ? (
                  <>
                    <HiCheckCircle className="h-4 w-4 mr-1" />
                    <span className="text-xs">有効</span>
                  </>
                ) : (
                  <span className="text-xs">未設定</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* パスワード設定/変更 */}
        <div className="border rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 flex items-center mb-2">
                <HiKey className="h-5 w-5 mr-2 text-gray-600" />
                {passwordStatus?.hasPassword ? 'パスワード変更' : 'パスワード設定'}
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                {passwordStatus?.hasPassword
                  ? 'セキュリティを保つため、定期的にパスワードを変更することをお勧めします。'
                  : 'パスワードを設定すると、Googleアカウントが利用できない場合でもメールアドレスとパスワードでログインできます。'}
              </p>

              {!passwordStatus?.hasPassword && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                  <div className="flex">
                    <HiShieldCheck className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-blue-800 font-medium mb-1">推奨設定</p>
                      <p className="text-blue-700">
                        複数の認証方法を設定することで、より安全で便利にアカウントを利用できます。
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-3">
            <Link href="/auth/set-password">
              <Button variant="outline" className="flex items-center">
                <HiKey className="h-4 w-4 mr-2" />
                {passwordStatus?.hasPassword ? 'パスワードを変更' : 'パスワードを設定'}
              </Button>
            </Link>

            {passwordStatus?.hasPassword && (
              <Link href="/auth/forgot-password">
                <Button variant="ghost" className="text-gray-600">
                  パスワードをお忘れの場合
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* セキュリティのヒント */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">セキュリティのヒント</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• 8文字以上の複雑なパスワードを使用してください</li>
            <li>• 他のサービスとは異なるパスワードを設定してください</li>
            <li>• 定期的にパスワードを変更することをお勧めします</li>
          </ul>
        </div>
      </div>
    </DashboardCard>
  );
}