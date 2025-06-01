// components/subscription/CorporateSubscriptionRedirect.tsx
// この新しいコンポーネントは法人プラン申し込み完了後の処理を担当します
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/Spinner';
interface CorporateSubscriptionRedirectProps {
  subscriptionId: string;
  tenantId: string;
}
export default function CorporateSubscriptionRedirect({
  subscriptionId,
  tenantId,
}: CorporateSubscriptionRedirectProps) {
  const router = useRouter();
  const [redirectStatus, setRedirectStatus] = useState<'pending' | 'complete' | 'error'>('pending');
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    // 申し込み後の設定ページにリダイレクトするまでに少し待機
    const redirectTimeout = setTimeout(() => {
      try {
        // オンボーディングページへリダイレクト
        setRedirectStatus('complete'); // ステータスを更新
        router.push('/dashboard/corporate/onboarding');
      } catch {
        setError('ページの移動に失敗しました。ダッシュボードから法人設定を行ってください。');
        setRedirectStatus('error'); // エラー状態に更新
      }
    }, 3000);
    return () => clearTimeout(redirectTimeout);
  }, [router, subscriptionId, tenantId]);
  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 my-6">
        <h3 className="text-lg font-medium text-yellow-800 mb-2">エラーが発生しました</h3>
        <p className="text-yellow-700">{error}</p>
        <button
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          onClick={() => router.push('/dashboard/corporate')}
        >
          ダッシュボードへ移動
        </button>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 my-6 text-center">
      <div className="flex flex-col items-center">
        <Spinner size="lg" className="mb-4" />
        <h2 className="text-xl font-semibold mb-2">法人プランの設定を完了しています</h2>
        <p className="text-gray-600 mb-4">
          まもなく初期設定ページに移動します。しばらくお待ちください...
        </p>
        {/* redirectStatusの表示 (オプション) */}
        <span className="text-xs text-gray-400">ステータス: {redirectStatus}</span>
      </div>
    </div>
  );
}