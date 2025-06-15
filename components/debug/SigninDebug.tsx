// components/debug/SigninDebug.tsx (サインインページ用)
'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function SigninDebug() {
  const { data: session, status } = useSession();
  const [cookies, setCookies] = useState('');

  useEffect(() => {
    setCookies(document.cookie);
  }, []);

  // 本番環境では表示しない
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-yellow-100 border-2 border-yellow-300 rounded-lg p-3 shadow-lg max-w-sm z-50">
      <h3 className="text-xs font-bold text-yellow-800 mb-2">🔧 認証デバッグ</h3>

      <div className="text-xs space-y-1">
        <div>
          <strong>Status:</strong> {status}
        </div>
        <div>
          <strong>Has Session:</strong> {session ? 'Yes' : 'No'}
        </div>
        {session && (
          <>
            <div>
              <strong>User ID:</strong> {session.user?.id || 'None'}
            </div>
            <div>
              <strong>Email:</strong> {session.user?.email || 'None'}
            </div>
            <div>
              <strong>Role:</strong> {session.user?.role || 'None'}
            </div>
          </>
        )}
        <div>
          <strong>Cookies:</strong>
        </div>
        <div className="bg-white p-1 rounded text-xs break-all max-h-20 overflow-y-auto">
          {cookies || 'None'}
        </div>
        <div className="mt-2">
          <strong>NextAuth Cookie:</strong> {cookies.includes('next-auth') ? 'Found' : 'Missing'}
        </div>
      </div>
    </div>
  );
}