// components/debug/SessionDebug.tsx (一時的なデバッグ用)
'use client';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

export default function SessionDebug() {
  const { data: session, status } = useSession();
  const [testResults, setTestResults] = useState<any>(null);

  const testAPIs = async () => {
    setTestResults({ loading: true });

    const tests = [];

    // 1. セッション情報テスト
    tests.push({
      name: 'Session Status',
      result: { status, hasSession: !!session, sessionUser: session?.user },
    });

    // 2. 通知API テスト
    try {
      const notificationResponse = await fetch('/api/notifications', {
        credentials: 'include',
      });
      tests.push({
        name: 'Notifications API',
        result: {
          status: notificationResponse.status,
          ok: notificationResponse.ok,
          headers: Object.fromEntries(notificationResponse.headers.entries()),
        },
      });
    } catch (error) {
      tests.push({
        name: 'Notifications API',
        result: { error: error instanceof Error ? error.message : String(error) },
      });
    }

    // 3. プロフィールAPI テスト
    try {
      const profileResponse = await fetch('/api/profile', {
        credentials: 'include',
      });
      tests.push({
        name: 'Profile API',
        result: {
          status: profileResponse.status,
          ok: profileResponse.ok,
        },
      });
    } catch (error) {
      tests.push({
        name: 'Profile API',
        result: { error: error instanceof Error ? error.message : String(error) },
      });
    }

    // 4. クッキー確認
    tests.push({
      name: 'Browser Cookies',
      result: {
        allCookies: document.cookie,
        hasSessionCookie: document.cookie.includes('next-auth'),
        hasSecureSessionCookie: document.cookie.includes('__Secure-next-auth'),
      },
    });

    setTestResults(tests);
  };

  // 本番環境では表示しない
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-red-300 rounded-lg p-4 shadow-lg max-w-md z-50">
      <h3 className="text-sm font-bold text-red-600 mb-2">🔧 セッションデバッグ</h3>

      <div className="text-xs space-y-1 mb-3">
        <div>
          Status: <span className="font-mono">{status}</span>
        </div>
        <div>
          User: <span className="font-mono">{session?.user?.email || 'None'}</span>
        </div>
        <div>
          Role: <span className="font-mono">{session?.user?.role || 'None'}</span>
        </div>
      </div>

      <button
        onClick={testAPIs}
        className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
      >
        API テスト実行
      </button>

      {testResults && (
        <div className="mt-3 max-h-40 overflow-y-auto">
          <pre className="text-xs bg-gray-100 p-2 rounded">
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}