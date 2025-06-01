// components/debug/NetworkDiagnostic.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface DiagnosticResult {
  timestamp: string;
  test: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  details?: Record<string, unknown>;
}

export function NetworkDiagnostic() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { data: session, status } = useSession();

  const addResult = (
    test: string,
    status: DiagnosticResult['status'],
    message: string,
    details?: Record<string, unknown>,
  ) => {
    const result: DiagnosticResult = {
      timestamp: new Date().toLocaleTimeString(),
      test,
      status,
      message,
      details,
    };
    setResults((prev) => [...prev, result]);
  };

  const runDiagnostics = React.useCallback(async () => {
    setIsRunning(true);
    setResults([]);

    // 1. ネットワーク連結性テスト
    addResult('network', 'pending', 'ネットワーク接続をテスト中...');
    try {
      if (navigator.onLine) {
        addResult('network', 'success', 'ブラウザはオンライン状態です');
      } else {
        addResult('network', 'error', 'ブラウザはオフライン状態です');
      }
    } catch (err) {
      const errorDetails =
        err instanceof Error
          ? {
              name: err.name,
              message: err.message,
              stack: err.stack,
            }
          : { error: String(err) };
      addResult('network', 'error', 'ネットワーク状態の確認に失敗', errorDetails);
    }

    // 2. セッション状態テスト
    addResult('session', 'pending', 'セッション状態をテスト中...');
    try {
      addResult(
        'session',
        status === 'authenticated' ? 'success' : 'error',
        `セッション状態: ${status}`,
        {
          userId: session?.user?.id,
          email: session?.user?.email,
        },
      );
    } catch (err) {
      const errorDetails =
        err instanceof Error
          ? {
              name: err.name,
              message: err.message,
            }
          : { error: String(err) };
      addResult('session', 'error', 'セッション状態の確認に失敗', errorDetails);
    }

    // 3. Auth APIテスト
    addResult('auth-api', 'pending', 'Auth APIをテスト中...');
    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        addResult('auth-api', 'success', 'Auth APIは正常に応答しています', data);
      } else {
        addResult('auth-api', 'error', `Auth API エラー: ${response.status}`, {
          status: response.status,
          statusText: response.statusText,
        });
      }
    } catch (err) {
      const errorDetails =
        err instanceof Error
          ? {
              name: err.name,
              message: err.message,
            }
          : { error: String(err) };
      addResult('auth-api', 'error', 'Auth APIへの接続に失敗', errorDetails);
    }

    // 4. Corporate Access APIテスト
    addResult('corporate-api', 'pending', 'Corporate Access APIをテスト中...');
    try {
      const response = await fetch('/api/corporate/access', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        addResult('corporate-api', 'success', 'Corporate Access APIは正常に応答しています', data);
      } else {
        addResult('corporate-api', 'error', `Corporate Access API エラー: ${response.status}`, {
          status: response.status,
          statusText: response.statusText,
        });
      }
    } catch (err) {
      const errorDetails =
        err instanceof Error
          ? {
              name: err.name,
              message: err.message,
            }
          : { error: String(err) };
      addResult('corporate-api', 'error', 'Corporate Access APIへの接続に失敗', errorDetails);
    }

    // 5. DNS解決テスト
    addResult('dns', 'pending', 'DNS解決をテスト中...');
    try {
      const response = await fetch('https://dns.google/resolve?name=google.com&type=A');
      if (response.ok) {
        addResult('dns', 'success', 'DNS解決は正常です');
      } else {
        addResult('dns', 'error', 'DNS解決に問題があります');
      }
    } catch (err) {
      const errorDetails =
        err instanceof Error
          ? {
              name: err.name,
              message: err.message,
            }
          : { error: String(err) };
      addResult('dns', 'error', 'DNS解決テストに失敗', errorDetails);
    }

    setIsRunning(false);
  }, [session, status]); // 依存関係を追加

  useEffect(() => {
    // コンポーネントマウント時に自動実行
    runDiagnostics();
  }, [runDiagnostics]); // runDiagnosticsを依存関係に追加

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">ネットワーク診断</h2>
        <button
          onClick={runDiagnostics}
          disabled={isRunning}
          className={`px-4 py-2 rounded-md font-medium ${
            isRunning
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isRunning ? '診断中...' : '再診断'}
        </button>
      </div>

      <div className="space-y-3">
        {results.map((result, index) => (
          <div
            key={index}
            className={`p-4 rounded-md border-l-4 ${
              result.status === 'success'
                ? 'bg-green-50 border-green-400'
                : result.status === 'error'
                  ? 'bg-red-50 border-red-400'
                  : 'bg-yellow-50 border-yellow-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span
                  className={`inline-block w-3 h-3 rounded-full mr-3 ${
                    result.status === 'success'
                      ? 'bg-green-400'
                      : result.status === 'error'
                        ? 'bg-red-400'
                        : 'bg-yellow-400'
                  }`}
                />
                <span className="font-medium text-gray-800">{result.test}</span>
              </div>
              <span className="text-sm text-gray-500">{result.timestamp}</span>
            </div>
            <p className="mt-2 text-gray-700">{result.message}</p>
            {result.details && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                  詳細を表示
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>

      {results.length === 0 && !isRunning && (
        <div className="text-center py-8 text-gray-500">
          診断を開始するには「再診断」ボタンをクリックしてください。
        </div>
      )}
    </div>
  );
}