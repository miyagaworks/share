// app/dashboard/admin/permissions/fix-permanent-button.tsx
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { HiRefresh } from 'react-icons/hi';
import { toast } from 'react-hot-toast';

// APIレスポンスの型定義
interface ErrorResult {
  userId: string;
  email: string;
  error: string;
}

interface SuccessResult {
  userId: string;
  email: string;
  tenantId: string;
  departmentId: string;
  stripeCustomerId: string | null;
  status: string;
}

interface FixPermanentUsersResponse {
  success: boolean;
  totalUsers: number;
  successCount: number;
  errorCount: number;
  results?: SuccessResult[];
  errors?: ErrorResult[];
  error?: string;
}

export default function FixPermanentUsersButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FixPermanentUsersResponse | null>(null);

  const handleFixPermanentUsers = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      setResult(null);

      const response = await fetch('/api/admin/fix-permanent-users', {
        method: 'POST',
      });

      // responseが正常なJSONかをチェック
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // JSONではないレスポンスを処理
        await response.text();
        toast.error('APIからの応答が不正です: JSONではありません');
        setIsLoading(false);
        return;
      }

      const data: FixPermanentUsersResponse = await response.json();

      if (response.ok) {
        setResult(data);
        if (data.success) {
          toast.success(
            `${data.totalUsers}人中${data.successCount}人の永久利用権ユーザーデータを修正しました。`,
          );
        } else {
          toast.error('処理中にエラーが発生しました: ' + (data.error || '不明なエラー'));
        }
      } else {
        // APIからのエラーレスポンスを表示
        toast.error('APIエラー: ' + (data.error || `ステータスコード ${response.status}`));
      }
    } catch {
      toast.error('リクエスト中にエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="inline-block">
      <Button
        onClick={handleFixPermanentUsers}
        disabled={isLoading}
        variant="outline"
        size="sm"
        className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
      >
        <HiRefresh className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        データ修正
      </Button>

      {result && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">データ修正結果</h3>
            <div className="space-y-2 mb-4">
              <p>対象ユーザー: {result.totalUsers}人</p>
              <p className="text-green-600">成功: {result.successCount}人</p>
              {result.errorCount > 0 && (
                <p className="text-red-600">エラー: {result.errorCount}人</p>
              )}
            </div>

            {result.errorCount > 0 && result.errors && (
              <div className="mt-4">
                <p className="font-medium text-red-600 mb-2">エラー詳細:</p>
                <div className="max-h-32 overflow-y-auto bg-red-50 p-2 rounded">
                  <ul className="list-disc pl-5 text-sm">
                    {result.errors.map((error: ErrorResult, index: number) => (
                      <li key={index} className="text-red-600">
                        {error.email}: {error.error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <Button onClick={() => setResult(null)}>閉じる</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}