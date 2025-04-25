// components/debug/CorporateDebugPanel.tsx

'use client';

import { useEffect, useState } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { corporateAccessState, checkCorporateAccess } from '@/lib/corporateAccessState';

interface DiagnosticInfo {
  user: Record<string, unknown> | null;
  adminOfTenant: Record<string, unknown> | null;
  memberTenant: Record<string, unknown> | null;
  [key: string]: unknown;
}

interface SchemaInfo {
  tenantColumns: Array<{
    column_name: string;
    data_type: string;
    character_maximum_length?: number;
    is_nullable: string;
    column_default?: string;
  }>;
  foreignKeys: Array<{
    table_name: string;
    column_name: string;
    foreign_table_name: string;
    foreign_column_name: string;
  }>;
  [key: string]: unknown;
}

interface TestResult {
  success: boolean;
  error?: string;
  details?: Record<string, unknown>;
}

interface AccessTestResults {
  accessCheck: TestResult;
  tenantCheck: TestResult;
  subscriptionStatus: TestResult;
  [key: string]: unknown;
}

interface DebugRecommendation {
  issue: string;
  severity: 'high' | 'medium' | 'low';
  action: string;
  description: string;
}

interface DebugInfo {
  timestamp: string;
  diagnosticInfo: DiagnosticInfo;
  schemaInfo: SchemaInfo;
  accessTestResults: AccessTestResults;
  recommendations: DebugRecommendation[];
  corporateAccessStateSnapshot: typeof corporateAccessState;
}

interface TableColumn {
  column_name: string;
  data_type: string;
  character_maximum_length?: number;
  is_nullable: string;
  column_default?: string;
}

interface ForeignKey {
  table_name: string;
  column_name: string;
  foreign_table_name: string;
  foreign_column_name: string;
}

export function CorporateDebugPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'diagnostic' | 'schema' | 'tests' | 'recommendations'
  >('overview');
  const [showDebugTools, setShowDebugTools] = useState(true); // デフォルトで表示するよう変更

  const fetchDebugInfo = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('デバッグ情報を取得します...');
      const response = await fetch('/api/debug/corporate-detailed', {
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (!response.ok) {
        throw new Error(`APIエラー: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('デバッグ情報を取得しました', data);
      setDebugInfo(data);
    } catch (err) {
      console.error('デバッグ情報取得エラー:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  // コンポーネントマウント時にデータ取得
  useEffect(() => {
    if (!debugInfo && !isLoading) {
      fetchDebugInfo();
    }
  }, [debugInfo, isLoading]);

  // 深いオブジェクトを扱うための再帰的な展開コンポーネント
  const JsonTreeView = ({ data, level = 0 }: { data: unknown; level?: number }) => {
    if (data === null || data === undefined) return <span className="text-gray-400">null</span>;

    if (typeof data !== 'object') {
      // プリミティブ値の表示
      if (typeof data === 'string')
        return <span className="text-green-600 break-all">&quot;{data}&quot;</span>;
      if (typeof data === 'number') return <span className="text-blue-600">{data}</span>;
      if (typeof data === 'boolean') return <span className="text-purple-600">{String(data)}</span>;
      return <span>{String(data)}</span>;
    }

    // 配列処理
    if (Array.isArray(data)) {
      if (data.length === 0) return <span className="text-gray-400">[]</span>;

      return (
        <div
          className="corporate-debug-json text-xs"
          style={{ marginLeft: Math.min(level * 12, 60) }}
        >
          [
          <div className="ml-2 sm:ml-4">
            {data.map((item, index) => (
              <div key={index} className="flex">
                <JsonTreeView data={item} level={level + 1} />
                {index < data.length - 1 && ','}
              </div>
            ))}
          </div>
          ]
        </div>
      );
    }

    // オブジェクト処理（nullチェック後なので安全）
    const obj = data as Record<string, unknown>;
    const keys = Object.keys(obj);

    if (keys.length === 0) return <span className="text-gray-400">{'{}'}</span>;

    return (
      <div
        className="corporate-debug-json text-xs"
        style={{ marginLeft: Math.min(level * 12, 60) }}
      >
        {'{'}
        <div className="ml-2 sm:ml-4">
          {keys.map((key, index) => (
            <div key={key} className="flex flex-wrap">
              <span className="text-red-600 mr-1">&quot;{key}&quot;:</span>
              <JsonTreeView data={obj[key]} level={level + 1} />
              {index < keys.length - 1 && ','}
            </div>
          ))}
        </div>
        {'}'}
      </div>
    );
  };

  // テスト結果表示コンポーネント
  const TestResultView = ({ test }: { test: TestResult }) => {
    if (!test) return null;

    return (
      <div
        className={`p-2 sm:p-3 rounded-md mb-2 ${test.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}
      >
        <div className="flex items-center">
          <div
            className={`h-2 w-2 sm:h-3 sm:w-3 rounded-full mr-1 sm:mr-2 ${test.success ? 'bg-green-500' : 'bg-red-500'}`}
          ></div>
          <span className="font-medium text-xs sm:text-sm">
            {test.success ? '成功' : `失敗: ${test.error}`}
          </span>
        </div>
        {test.details && (
          <div className="mt-2 text-xs">
            <div className="font-medium mb-1">詳細情報:</div>
            <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-40 corporate-debug-pre break-all">
              {JSON.stringify(test.details, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  // 推奨事項表示コンポーネント
  const RecommendationCard = ({ recommendation }: { recommendation: DebugRecommendation }) => {
    const severityColors = {
      high: 'bg-red-50 border-red-200',
      medium: 'bg-yellow-50 border-yellow-200',
      low: 'bg-blue-50 border-blue-200',
    };

    return (
      <div
        className={`p-2 sm:p-3 rounded-md mb-3 border ${severityColors[recommendation.severity]}`}
      >
        <div className="flex justify-between items-start mb-1">
          <h4 className="font-medium text-xs sm:text-sm">{recommendation.issue}</h4>
          <span
            className={`text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded-full ${
              recommendation.severity === 'high'
                ? 'bg-red-200 text-red-800'
                : recommendation.severity === 'medium'
                  ? 'bg-yellow-200 text-yellow-800'
                  : 'bg-blue-200 text-blue-800'
            }`}
          >
            {recommendation.severity === 'high'
              ? '重要'
              : recommendation.severity === 'medium'
                ? '警告'
                : '情報'}
          </span>
        </div>
        <p className="text-xs sm:text-sm mb-2">{recommendation.description}</p>
        <div className="text-xs sm:text-sm font-medium">推奨アクション:</div>
        <p className="text-xs sm:text-sm">{recommendation.action}</p>
      </div>
    );
  };

  const toggleDebugTools = () => {
    setShowDebugTools(!showDebugTools);
    if (!debugInfo && !showDebugTools) {
      fetchDebugInfo();
    }
  };

  const handleDebugToolAction = async (action: string) => {
    try {
      setIsLoading(true);

      if (action === 'reset-state') {
        // グローバルステートをリセット
        corporateAccessState.hasAccess = null;
        corporateAccessState.isAdmin = false;
        corporateAccessState.tenantId = null;
        corporateAccessState.lastChecked = 0;
        corporateAccessState.error = null;

        window.dispatchEvent(
          new CustomEvent('corporateAccessChanged', {
            detail: { ...corporateAccessState },
          }),
        );

        console.log('corporateAccessStateをリセットしました');
      } else if (action === 'force-access') {
        // アクセスを強制的に有効にする
        corporateAccessState.hasAccess = true;
        corporateAccessState.isAdmin = true;
        corporateAccessState.tenantId = 'debug-tenant-id';
        corporateAccessState.lastChecked = Date.now();
        corporateAccessState.error = null;

        window.dispatchEvent(
          new CustomEvent('corporateAccessChanged', {
            detail: { ...corporateAccessState },
          }),
        );

        console.log('corporateAccessStateをデバッグモードで有効化しました');
      }

      // デバッグ情報を更新
      await fetchDebugInfo();
    } catch (err) {
      console.error('デバッグアクション実行エラー:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  // ユーザー情報表示の型安全な処理
  const userInfo = debugInfo?.diagnosticInfo?.user as Record<string, unknown> | null;

  // 強調表示された現在の状態表示（追加）
  const AccessStatusBadge = () => {
    let statusColor = 'bg-gray-200 text-gray-800';
    let statusText = '未チェック';

    if (corporateAccessState.hasAccess === true) {
      statusColor = 'bg-green-200 text-green-800';
      statusText = 'アクセス許可';
    } else if (corporateAccessState.hasAccess === false) {
      statusColor = 'bg-red-200 text-red-800';
      statusText = 'アクセス拒否';
    }

    return (
      <div
        className={`text-xs font-medium px-1 sm:px-2 py-0.5 sm:py-1 rounded-full inline-flex items-center ml-2 ${statusColor}`}
      >
        <span
          className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full mr-0.5 sm:mr-1 ${corporateAccessState.hasAccess === true ? 'bg-green-600' : corporateAccessState.hasAccess === false ? 'bg-red-600' : 'bg-gray-500'}`}
        ></span>
        <span className="text-xs whitespace-nowrap">{statusText}</span>
      </div>
    );
  };

  return (
    <div className="my-0 mx-0 w-full border border-gray-300 rounded-lg bg-white overflow-hidden max-w-full">
      {/* デバッグパネルヘッダー */}
      <div
        className="bg-gray-100 px-3 sm:px-4 py-2 sm:py-3 flex justify-between items-center cursor-pointer border-b border-gray-300"
        onClick={toggleDebugTools}
      >
        <div className="flex items-center overflow-hidden">
          <div className="h-3 w-3 flex-shrink-0 rounded-full bg-blue-500 mr-2"></div>
          <h3 className="font-medium text-sm sm:text-base whitespace-nowrap overflow-hidden text-ellipsis">
            法人アクセス診断ツール
          </h3>
          <AccessStatusBadge />
        </div>
        <div className="ml-2 flex-shrink-0">
          {showDebugTools ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </div>

      {/* デバッグパネル本体 */}
      {showDebugTools && (
        <div className="p-2 sm:p-4 overflow-x-auto">
          {/* アクションボタン */}
          <div className="flex flex-wrap gap-1 sm:gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDebugInfo}
              disabled={isLoading}
              className="text-xs sm:text-sm py-1 px-2"
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" className="mr-1 sm:mr-2" />
                  診断中...
                </>
              ) : (
                '詳細診断を実行'
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDebugToolAction('reset-state')}
              disabled={isLoading}
              className="text-xs sm:text-sm py-1 px-2"
            >
              状態をリセット
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDebugToolAction('force-access')}
              disabled={isLoading}
              className="text-xs sm:text-sm py-1 px-2"
            >
              アクセスを強制許可
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                setIsLoading(true);
                try {
                  await checkCorporateAccess(true);
                  fetchDebugInfo();
                } catch (err) {
                  console.error('アクセスチェックエラー:', err);
                  setError(err instanceof Error ? err.message : String(err));
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
              className="text-xs sm:text-sm py-1 px-2"
            >
              API再チェック実行
            </Button>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-2 sm:p-3 mb-4">
              <p className="text-red-600 text-xs sm:text-sm">{error}</p>
            </div>
          )}

          {/* 現在のグローバル状態表示 */}
          <div className="mb-4">
            <h4 className="text-xs sm:text-sm font-medium mb-1">現在のグローバル状態:</h4>
            <pre className="bg-gray-50 p-2 rounded-md text-xs overflow-auto max-h-24 corporate-debug-pre">
              {JSON.stringify(corporateAccessState, null, 2)}
            </pre>
          </div>

          {/* タブ切り替え */}
          {debugInfo && (
            <>
              <div className="border-b border-gray-200 mb-4 overflow-x-auto">
                <div className="flex flex-nowrap -mb-px">
                  {['overview', 'diagnostic', 'schema', 'tests', 'recommendations'].map((tab) => (
                    <button
                      key={tab}
                      className={`mr-2 sm:mr-4 py-1 sm:py-2 px-1 border-b-2 text-xs sm:text-sm font-medium whitespace-nowrap ${
                        activeTab === tab
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                      onClick={() =>
                        setActiveTab(
                          tab as 'overview' | 'diagnostic' | 'schema' | 'tests' | 'recommendations',
                        )
                      }
                    >
                      {tab === 'overview'
                        ? '概要'
                        : tab === 'diagnostic'
                          ? '診断情報'
                          : tab === 'schema'
                            ? 'スキーマ'
                            : tab === 'tests'
                              ? 'テスト結果'
                              : '推奨事項'}
                    </button>
                  ))}
                </div>
              </div>

              {/* タブコンテンツ */}
              <div className="mt-4">
                {/* 概要タブ */}
                {activeTab === 'overview' && (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-50 p-2 sm:p-3 rounded-md">
                        <h4 className="text-xs sm:text-sm font-medium mb-2">診断概要</h4>
                        <div className="text-xs sm:text-sm">
                          <div className="flex justify-between mb-1">
                            <span>診断実行日時:</span>
                            <span>{new Date(debugInfo.timestamp).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between mb-1">
                            <span>アクセス権チェック:</span>
                            <span
                              className={
                                debugInfo.accessTestResults.accessCheck.success
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }
                            >
                              {debugInfo.accessTestResults.accessCheck.success ? '成功' : '失敗'}
                            </span>
                          </div>
                          <div className="flex justify-between mb-1">
                            <span>テナント情報:</span>
                            <span
                              className={
                                debugInfo.accessTestResults.tenantCheck.success
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }
                            >
                              {debugInfo.accessTestResults.tenantCheck.success ? '成功' : '失敗'}
                            </span>
                          </div>
                          <div className="flex justify-between mb-1">
                            <span>サブスクリプション:</span>
                            <span
                              className={
                                debugInfo.accessTestResults.subscriptionStatus.success
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }
                            >
                              {debugInfo.accessTestResults.subscriptionStatus.success
                                ? '成功'
                                : '失敗'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-2 sm:p-3 rounded-md">
                        <h4 className="text-xs sm:text-sm font-medium mb-2">ユーザー情報</h4>
                        {userInfo ? (
                          <div className="text-xs sm:text-sm">
                            <div className="flex justify-between mb-1">
                              <span>ユーザーID:</span>
                              <span className="font-mono text-xs break-all">
                                {String(userInfo.id || '')}
                              </span>
                            </div>
                            <div className="flex justify-between mb-1">
                              <span>メール:</span>
                              <span className="break-all">{String(userInfo.email || '')}</span>
                            </div>
                            <div className="flex justify-between mb-1">
                              <span>法人ロール:</span>
                              <span>{String(userInfo.corporateRole || 'なし')}</span>
                            </div>
                            <div className="flex justify-between mb-1">
                              <span>テナントID:</span>
                              <span className="font-mono text-xs break-all">
                                {String(userInfo.tenantId || 'なし')}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs sm:text-sm text-gray-500">
                            ユーザー情報がありません
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 推奨事項のサマリー */}
                    <div className="bg-gray-50 p-2 sm:p-3 rounded-md mb-4">
                      <h4 className="text-xs sm:text-sm font-medium mb-2">
                        重要な推奨事項 (
                        {debugInfo.recommendations.filter((r) => r.severity === 'high').length})
                      </h4>
                      {debugInfo.recommendations.filter((r) => r.severity === 'high').length > 0 ? (
                        <div className="space-y-2">
                          {debugInfo.recommendations
                            .filter((r) => r.severity === 'high')
                            .map((rec, index) => (
                              <div key={index} className="flex items-start">
                                <span className="h-2 w-2 rounded-full bg-red-500 mt-1 mr-2 flex-shrink-0"></span>
                                <span className="text-xs sm:text-sm break-words">
                                  {rec.issue}: {rec.action}
                                </span>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="text-xs sm:text-sm text-green-600">
                          重要な問題は見つかりませんでした
                        </div>
                      )}
                    </div>

                    <div className="bg-blue-50 p-2 sm:p-3 rounded-md">
                      <div className="flex items-start">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 mr-2 flex-shrink-0"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <div>
                          <p className="text-xs sm:text-sm text-blue-800">
                            詳細な診断情報を確認するには、各タブを切り替えてください。特に「推奨事項」タブには具体的な解決策が記載されています。
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 診断情報タブ */}
                {activeTab === 'diagnostic' && (
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium mb-2">ユーザー情報</h4>
                    <div className="bg-gray-50 p-2 rounded-md mb-4 overflow-auto max-h-64 text-xs">
                      <JsonTreeView data={debugInfo.diagnosticInfo.user} />
                    </div>

                    <h4 className="text-xs sm:text-sm font-medium mb-2">テナント情報 (管理者)</h4>
                    <div className="bg-gray-50 p-2 rounded-md mb-4 overflow-auto max-h-64 text-xs">
                      {debugInfo.diagnosticInfo.adminOfTenant ? (
                        <JsonTreeView data={debugInfo.diagnosticInfo.adminOfTenant} />
                      ) : (
                        <div className="p-2 text-gray-500">管理者テナント情報がありません</div>
                      )}
                    </div>

                    <h4 className="text-xs sm:text-sm font-medium mb-2">テナント情報 (メンバー)</h4>
                    <div className="bg-gray-50 p-2 rounded-md mb-4 overflow-auto max-h-64 text-xs">
                      {debugInfo.diagnosticInfo.memberTenant ? (
                        <JsonTreeView data={debugInfo.diagnosticInfo.memberTenant} />
                      ) : (
                        <div className="p-2 text-gray-500">メンバーテナント情報がありません</div>
                      )}
                    </div>
                  </div>
                )}

                {/* スキーマタブ */}
                {activeTab === 'schema' && (
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium mb-2">
                      CorporateTenantテーブルのカラム情報
                    </h4>
                    <div className="bg-white border rounded-md overflow-hidden mb-4">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm corporate-debug-table">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-2 sm:px-3 py-1 sm:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                カラム名
                              </th>
                              <th className="px-2 sm:px-3 py-1 sm:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                データ型
                              </th>
                              <th className="px-2 sm:px-3 py-1 sm:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Null許可
                              </th>
                              <th className="px-2 sm:px-3 py-1 sm:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                デフォルト値
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {(debugInfo?.schemaInfo?.tenantColumns || []).map(
                              (column: TableColumn, index: number) => (
                                <tr
                                  key={index}
                                  className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                                >
                                  <td className="px-2 sm:px-3 py-1 sm:py-2 font-mono text-xs">
                                    {column.column_name}
                                  </td>
                                  <td className="px-2 sm:px-3 py-1 sm:py-2">
                                    {column.data_type}
                                    {column.character_maximum_length
                                      ? `(${column.character_maximum_length})`
                                      : ''}
                                  </td>
                                  <td className="px-2 sm:px-3 py-1 sm:py-2">
                                    {column.is_nullable === 'YES' ? '○' : '×'}
                                  </td>
                                  <td className="px-2 sm:px-3 py-1 sm:py-2 font-mono text-xs">
                                    {column.column_default || '-'}
                                  </td>
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <h4 className="text-xs sm:text-sm font-medium mb-2">テーブル間の関連</h4>
                    <div className="bg-white border rounded-md overflow-hidden mb-4">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm corporate-debug-table">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-2 sm:px-3 py-1 sm:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                テーブル
                              </th>
                              <th className="px-2 sm:px-3 py-1 sm:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                カラム
                              </th>
                              <th className="px-2 sm:px-3 py-1 sm:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                参照先テーブル
                              </th>
                              <th className="px-2 sm:px-3 py-1 sm:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                参照先カラム
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {(debugInfo?.schemaInfo?.foreignKeys || []).map(
                              (relation: ForeignKey, index: number) => (
                                <tr
                                  key={index}
                                  className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                                >
                                  <td className="px-2 sm:px-3 py-1 sm:py-2 font-mono text-xs">
                                    {relation.table_name}
                                  </td>
                                  <td className="px-2 sm:px-3 py-1 sm:py-2 font-mono text-xs">
                                    {relation.column_name}
                                  </td>
                                  <td className="px-2 sm:px-3 py-1 sm:py-2 font-mono text-xs">
                                    {relation.foreign_table_name}
                                  </td>
                                  <td className="px-2 sm:px-3 py-1 sm:py-2 font-mono text-xs">
                                    {relation.foreign_column_name}
                                  </td>
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* テスト結果タブ */}
                {activeTab === 'tests' && (
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium mb-2">アクセス権チェック</h4>
                    <TestResultView test={debugInfo.accessTestResults.accessCheck} />

                    <h4 className="text-xs sm:text-sm font-medium mb-2">テナント情報チェック</h4>
                    <TestResultView test={debugInfo.accessTestResults.tenantCheck} />

                    <h4 className="text-xs sm:text-sm font-medium mb-2">
                      サブスクリプションチェック
                    </h4>
                    <TestResultView test={debugInfo.accessTestResults.subscriptionStatus} />
                  </div>
                )}

                {/* 推奨事項タブ */}
                {activeTab === 'recommendations' && (
                  <div>
                    {debugInfo.recommendations.length > 0 ? (
                      <>
                        <h4 className="text-xs sm:text-sm font-medium mb-2">重要な推奨事項</h4>
                        {debugInfo.recommendations
                          .filter((r) => r.severity === 'high')
                          .map((rec, index) => (
                            <RecommendationCard key={`high-${index}`} recommendation={rec} />
                          ))}

                        <h4 className="text-xs sm:text-sm font-medium mb-2">警告</h4>
                        {debugInfo.recommendations
                          .filter((r) => r.severity === 'medium')
                          .map((rec, index) => (
                            <RecommendationCard key={`medium-${index}`} recommendation={rec} />
                          ))}

                        <h4 className="text-xs sm:text-sm font-medium mb-2">情報</h4>
                        {debugInfo.recommendations
                          .filter((r) => r.severity === 'low')
                          .map((rec, index) => (
                            <RecommendationCard key={`low-${index}`} recommendation={rec} />
                          ))}
                      </>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-md p-3">
                        <div className="flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-green-500 mr-2"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <p className="text-green-700 text-xs sm:text-sm">
                            問題は見つかりませんでした。すべてのチェックが正常に完了しました。
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 最初の実行またはローディング中 */}
                {!debugInfo && !error && (
                  <div className="text-center py-4 sm:py-6">
                    {isLoading ? (
                      <div className="flex flex-col items-center">
                        <Spinner size="lg" />
                        <p className="mt-2 text-xs sm:text-sm text-gray-600">診断情報を取得中...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mb-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <p className="text-xs sm:text-sm text-gray-600">
                          「詳細診断を実行」ボタンをクリックして診断を開始してください
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}