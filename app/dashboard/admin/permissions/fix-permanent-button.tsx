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
      // 👇 API URLの修正（末尾のスラッシュを追加）
      const response = await fetch('/api/admin/fix-permanent-users/');
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
      toast.error(
        'リクエスト中にエラーが発生しました。',
      );
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="mb-6">
      <Button
        onClick={handleFixPermanentUsers}
        disabled={isLoading}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        <HiRefresh className={`mr-2 h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
        永久利用権ユーザーのデータを修正
      </Button>
      {result && (
        <div className="mt-4 p-4 rounded-lg bg-gray-50 border border-gray-200">
          <h3 className="text-lg font-medium mb-2">処理結果</h3>
          <p>対象ユーザー: {result.totalUsers}人</p>
          <p>成功: {result.successCount}人</p>
          <p>エラー: {result.errorCount}人</p>
          {result.errorCount > 0 && result.errors && (
            <div className="mt-2">
              <p className="font-medium text-red-600">エラー詳細:</p>
              <ul className="list-disc pl-5 mt-1">
                {result.errors.map((error: ErrorResult, index: number) => (
                  <li key={index} className="text-sm text-red-600">
                    {error.email}: {error.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}