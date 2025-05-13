// components/admin/GrantPermanentAccess.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from 'react-hot-toast';

export default function GrantPermanentAccess() {
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
  } | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId.trim()) {
      setResult({ success: false, error: 'ユーザーIDを入力してください' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/grant-permanent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: userId.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || '永久利用権を付与しました',
        });
        // 成功通知
        toast.success('永久利用権を付与しました');
        // フォームをリセット
        setUserId('');
        // 管理画面を更新
        router.refresh();
      } else {
        setResult({
          success: false,
          error: data.error || '処理中にエラーが発生しました',
        });
        // エラー通知
        toast.error(data.error || '処理中にエラーが発生しました');
      }
    } catch (err) {
      setResult({
        success: false,
        error: 'APIリクエスト中にエラーが発生しました',
      });
      console.error('永久利用権付与エラー:', err);
      toast.error('APIリクエスト中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold mb-4">永久利用権の付与</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
            ユーザーID
          </label>
          <input
            type="text"
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="付与するユーザーのIDを入力"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-gray-500">
            永久利用権を付与すると、ユーザーは法人機能にアクセスできるようになります。
          </p>
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Spinner size="sm" className="mr-2" />
              処理中...
            </>
          ) : (
            '永久利用権を付与'
          )}
        </Button>
      </form>

      {result && (
        <div
          className={`mt-4 p-3 rounded-md ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}
        >
          {result.success ? result.message : result.error}
        </div>
      )}
    </div>
  );
}