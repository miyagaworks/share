// components/corporate/SuspendedBanner.tsx
'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { HiExclamation } from 'react-icons/hi';
import { Button } from '@/components/ui/Button';
// 名前付きエクスポートに変更
export function SuspendedBanner() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [tenantSuspended, setTenantSuspended] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    // テナント情報をフェッチしてステータスを確認
    const checkTenantStatus = async () => {
      if (!session?.user?.id) return;
      try {
        const response = await fetch('/api/corporate/tenant');
        if (!response.ok) return;
        const data = await response.json();
        setTenantSuspended(data.tenant.accountStatus === 'suspended');
        setIsAdmin(data.userRole === 'admin');
      } catch {
      }
    };
    checkTenantStatus();
  }, [session]);
  // 一時停止中でない場合またはすでに設定ページにいる場合は何も表示しない
  if (!tenantSuspended || pathname === '/dashboard/corporate/settings') {
    return null;
  }
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <HiExclamation className="h-6 w-6 text-yellow-500" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            アカウントは現在一時停止中です。設定ページからアカウントを再開できます。
          </p>
          {isAdmin && (
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                onClick={() => router.push('/dashboard/corporate/settings')}
              >
                設定ページに移動
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}