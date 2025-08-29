// components/admin/GrantPermanentAccess.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from 'react-hot-toast';
import { PermanentPlanType, PLAN_TYPE_DISPLAY_NAMES } from '@/lib/corporateAccess';
import { HiUsers, HiSearch } from 'react-icons/hi';

// ユーザー検索結果の型定義
interface SearchResult {
  id: string;
  name: string | null;
  email: string;
}

export default function GrantPermanentAccess() {
  const [userId, setUserId] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchResult | null>(null);
  const [planType, setPlanType] = useState<PermanentPlanType>(PermanentPlanType.STARTER); // 🔥 デフォルトをSTARTERに
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
    planType?: PermanentPlanType;
    planName?: string;
  } | null>(null);
  const router = useRouter();

  // ユーザー検索関数
  const searchUsers = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch('/api/admin/permissions');
      if (response.ok) {
        const data = await response.json();
        const users = data.users || [];

        // トライアル期間中のユーザーのみをフィルタリング
        const trialUsers = users.filter((user: any) => !user.isPermanentUser);

        // 検索クエリでさらにフィルタリング
        const filteredUsers = trialUsers.filter((user: any) => {
          const searchTerm = query.toLowerCase();
          return (
            (user.name && user.name.toLowerCase().includes(searchTerm)) ||
            (user.nameKana && user.nameKana.toLowerCase().includes(searchTerm)) ||
            user.email.toLowerCase().includes(searchTerm)
          );
        });

        setSearchResults(filteredUsers);
      } else {
        console.error('ユーザー検索エラー');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('ユーザー検索エラー:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // ユーザー選択
  const selectUser = (user: SearchResult) => {
    setSelectedUser(user);
    setUserId(user.id);
    setUserQuery(user.name || user.email);
    setSearchResults([]);
  };

  // ユーザー検索のクリア
  const clearUserSelection = () => {
    setSelectedUser(null);
    setUserId('');
    setUserQuery('');
    setSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser || !userId.trim()) {
      setResult({ success: false, error: 'ユーザーを選択してください' });
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
        body: JSON.stringify({
          userId: userId.trim(),
          planType,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || '永久利用権を付与しました',
          planType: data.planType,
          planName: data.planName,
        });

        toast.success(`${data.planName || '永久利用権'}を付与しました`);
        clearUserSelection();
        router.refresh();
      } else {
        setResult({
          success: false,
          error: data.error || '処理中にエラーが発生しました',
        });
        toast.error(data.error || '処理中にエラーが発生しました');
      }
    } catch {
      setResult({
        success: false,
        error: 'APIリクエスト中にエラーが発生しました',
      });
      toast.error('APIリクエスト中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <HiUsers className="h-5 w-5 mr-2 text-blue-600" />
        永久利用権の付与
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ユーザー検索・選択 */}
        <div>
          <label htmlFor="userSearch" className="block text-sm font-medium text-gray-700 mb-1">
            対象ユーザー
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <HiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="userSearch"
              value={userQuery}
              onChange={(e) => {
                setUserQuery(e.target.value);
                searchUsers(e.target.value);
                if (!e.target.value) {
                  clearUserSelection();
                }
              }}
              placeholder="ユーザー名またはメールアドレスで検索"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />

            {/* 検索結果ドロップダウン */}
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => selectUser(user)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                  >
                    <div className="text-sm font-medium text-gray-900">
                      {user.name || '名前未設定'}
                    </div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </button>
                ))}
              </div>
            )}

            {/* 検索中のスピナー */}
            {isSearching && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Spinner size="sm" />
              </div>
            )}
          </div>

          {/* 選択されたユーザーの表示 */}
          {selectedUser && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-blue-900">
                    選択中: {selectedUser.name || '名前未設定'}
                  </div>
                  <div className="text-xs text-blue-700">{selectedUser.email}</div>
                </div>
                <button
                  type="button"
                  onClick={clearUserSelection}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  変更
                </button>
              </div>
            </div>
          )}
        </div>

        {/* プラン種別選択 */}
        <div>
          <label htmlFor="planType" className="block text-sm font-medium text-gray-700 mb-1">
            プラン種別
          </label>
          <select
            id="planType"
            value={planType}
            onChange={(e) => setPlanType(e.target.value as PermanentPlanType)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          >
            {Object.entries(PLAN_TYPE_DISPLAY_NAMES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* プラン説明 */}
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
          <p className="mb-2">
            <strong>選択中のプラン:</strong> {PLAN_TYPE_DISPLAY_NAMES[planType]}
          </p>
          <div className="space-y-1 text-xs">
            {planType === PermanentPlanType.PERSONAL && <p>• 個人機能のみ利用可能</p>}
            {planType === PermanentPlanType.STARTER && ( // 🔥 BUSINESS を STARTER に修正
              <>
                <p>• 法人機能利用可能</p>
                <p>• 最大10名まで</p>
              </>
            )}
            {planType === PermanentPlanType.BUSINESS && ( // 🔥 BUSINESS_PLUS を BUSINESS に修正
              <>
                <p>• 法人機能利用可能</p>
                <p>• 最大30名まで</p>
              </>
            )}
            {planType === PermanentPlanType.ENTERPRISE && (
              <>
                <p>• 法人機能利用可能</p>
                <p>• 最大50名まで</p>
              </>
            )}
          </div>
        </div>

        {/* 重要な注意事項 */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
          <div className="text-sm text-yellow-700">
            <p className="font-medium">重要:</p>
            <p>永久利用権はトライアル期間中のユーザーのみに付与できます。</p>
          </div>
        </div>

        <Button type="submit" disabled={isLoading || !selectedUser} className="w-full">
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

      {/* 結果表示 */}
      {result && (
        <div
          className={`mt-4 p-3 rounded-md ${
            result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {result.success ? (
            <>
              <p>{result.message}</p>
              {result.planName && <p className="mt-1 font-medium">プラン種別: {result.planName}</p>}
            </>
          ) : (
            result.error
          )}
        </div>
      )}
    </div>
  );
}