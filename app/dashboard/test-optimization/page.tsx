// app/dashboard/test-optimization/page.tsx (テスト用)
'use client';

import { useDebugDashboardInfo } from '@/hooks/useTestDashboardInfo';
import { Spinner } from '@/components/ui/Spinner';

export default function TestOptimizationPage() {
  const { data, isLoading, error, refetch } = useDebugDashboardInfo();

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">🧪 最適化テスト</h1>
        <div className="flex items-center">
          <Spinner size="md" />
          <span className="ml-3">新しいAPIをテスト中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">🧪 最適化テスト</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">❌ エラーが発生しました</h3>
          <p className="text-red-700 mt-2">{String(error)}</p>
          <button
            onClick={() => refetch()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">🧪 最適化テスト</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">⚠️ データが取得できませんでした</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">🧪 最適化テスト結果</h1>

      {/* 成功メッセージ */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <h3 className="text-green-800 font-medium">✅ 新しいAPIが正常に動作しています！</h3>
        <p className="text-green-700 mt-1">統合ダッシュボードAPIからデータを取得しました</p>
      </div>

      {/* ユーザー情報 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-medium text-gray-900 mb-3">👤 ユーザー情報</h3>
          <div className="space-y-2 text-sm">
            <div>
              <strong>ID:</strong> {data.user.id}
            </div>
            <div>
              <strong>名前:</strong> {data.user.name || '未設定'}
            </div>
            <div>
              <strong>メール:</strong> {data.user.email}
            </div>
            <div>
              <strong>購読状況:</strong> {data.user.subscriptionStatus || '未設定'}
            </div>
          </div>
        </div>

        {/* 権限情報 */}
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-medium text-gray-900 mb-3">🔐 権限情報</h3>
          <div className="space-y-2 text-sm">
            <div>
              <strong>ユーザータイプ:</strong>
              <span
                className={`ml-2 px-2 py-1 rounded text-xs ${
                  data.permissions.userType === 'admin'
                    ? 'bg-red-100 text-red-800'
                    : data.permissions.userType === 'invited-member'
                      ? 'bg-blue-100 text-blue-800'
                      : data.permissions.userType === 'corporate'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                }`}
              >
                {data.permissions.userType}
              </span>
            </div>
            <div>
              <strong>管理者:</strong> {data.permissions.isAdmin ? '✅' : '❌'}
            </div>
            <div>
              <strong>法人アクセス:</strong> {data.permissions.hasCorpAccess ? '✅' : '❌'}
            </div>
            <div>
              <strong>ユーザーロール:</strong> {data.permissions.userRole || '未設定'}
            </div>
          </div>
        </div>

        {/* ナビゲーション情報 */}
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-medium text-gray-900 mb-3">🧭 ナビゲーション</h3>
          <div className="space-y-2 text-sm">
            <div>
              <strong>リダイレクト:</strong> {data.navigation.shouldRedirect ? '✅' : '❌'}
            </div>
            <div>
              <strong>リダイレクト先:</strong> {data.navigation.redirectPath || '未設定'}
            </div>
            <div>
              <strong>メニュー項目数:</strong> {data.navigation.menuItems.length}個
            </div>
          </div>
        </div>
      </div>

      {/* メニュー項目一覧 */}
      <div className="mt-6 bg-white rounded-lg border p-4">
        <h3 className="font-medium text-gray-900 mb-3">📋 メニュー項目</h3>
        <div className="grid gap-2">
          {data.navigation.menuItems.map((item, index) => (
            <div
              key={index}
              className={`flex items-center p-2 rounded ${
                item.isDivider ? 'bg-gray-50 border-t border-gray-200' : 'bg-gray-50'
              }`}
            >
              <span className="text-sm font-mono text-gray-600 w-24">{item.icon}</span>
              <span className="flex-1">{item.title}</span>
              <span className="text-xs text-gray-500">{item.href}</span>
            </div>
          ))}
        </div>
      </div>

      {/* テナント情報（もしあれば） */}
      {data.tenant && (
        <div className="mt-6 bg-white rounded-lg border p-4">
          <h3 className="font-medium text-gray-900 mb-3">🏢 テナント情報</h3>
          <div className="space-y-2 text-sm">
            <div>
              <strong>テナントID:</strong> {data.tenant.id}
            </div>
            <div>
              <strong>テナント名:</strong> {data.tenant.name}
            </div>
            <div>
              <strong>ロゴURL:</strong> {data.tenant.logoUrl || '未設定'}
            </div>
            <div>
              <strong>プライマリカラー:</strong> {data.tenant.primaryColor || '未設定'}
            </div>
          </div>
        </div>
      )}

      {/* 次のステップ */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-blue-800 font-medium">🚀 次のステップ</h3>
        <p className="text-blue-700 mt-1">
          新しいAPIが正常に動作することを確認しました。
          次は既存のダッシュボードレイアウトを段階的に更新します。
        </p>
      </div>
    </div>
  );
}