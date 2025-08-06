// components/debug/SigninDebugOverlay.tsx
'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export function SigninDebugOverlay() {
  const { data: session, status } = useSession();
  const [sessionApi, setSessionApi] = useState<any>(null);
  const [cookies, setCookies] = useState<string>('');

  useEffect(() => {
    // セッションAPIを直接呼び出し
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        setSessionApi(data);
        // 開発環境でのみログ出力
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Direct session API result:', data);
        }
      })
      .catch((err) => {
        // 開発環境でのみエラーログ出力
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Session API error:', err);
        }
      });

    // Cookieの状態を確認
    if (typeof document !== 'undefined') {
      setCookies(document.cookie);
    }
  }, []);

  // 開発環境でのみログ出力
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 useSession hook status:', status);
      console.log('🎯 useSession hook data:', session);
      console.log('🎯 Direct API call result:', sessionApi);
      console.log('🎯 Document cookies:', cookies);
    }
  }, [status, session, sessionApi, cookies]);

  // 本番環境でのみ表示（一時的） - 開発環境でも表示するよう変更
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        fontSize: '11px',
        zIndex: 10000,
        maxWidth: '400px',
        maxHeight: '300px',
        overflow: 'auto',
        fontFamily: 'monospace',
      }}
    >
      <div>
        <strong>🔍 Authentication Debug (Dev Only)</strong>
      </div>
      <hr style={{ margin: '5px 0', borderColor: '#444' }} />

      <div>
        <strong>useSession Hook:</strong>
      </div>
      <div>Status: {status}</div>
      <div>User: {session?.user?.name || 'None'}</div>
      <div>Email: {session?.user?.email || 'None'}</div>
      <div>Role: {session?.user?.role || 'None'}</div>
      <div>Expires: {session?.expires || 'None'}</div>

      <hr style={{ margin: '5px 0', borderColor: '#444' }} />

      <div>
        <strong>Direct API Call:</strong>
      </div>
      <div>Has Data: {sessionApi ? 'Yes' : 'No'}</div>
      <div>API User: {sessionApi?.user?.name || 'None'}</div>
      <div>API Email: {sessionApi?.user?.email || 'None'}</div>
      <div>API Role: {sessionApi?.user?.role || 'None'}</div>

      <hr style={{ margin: '5px 0', borderColor: '#444' }} />

      <div>
        <strong>Cookies:</strong>
      </div>
      <div>Has session-token: {cookies.includes('session-token') ? 'Yes' : 'No'}</div>
      <div>Has Secure token: {cookies.includes('__Secure-') ? 'Yes' : 'No'}</div>

      <hr style={{ margin: '5px 0', borderColor: '#444' }} />

      <div>
        <strong>Environment:</strong>
      </div>
      <div>URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</div>
      <div>Protocol: {typeof window !== 'undefined' ? window.location.protocol : 'N/A'}</div>

      {session?.user && (
        <div style={{ marginTop: '10px' }}>
          <button
            onClick={() => (window.location.href = '/dashboard')}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '3px',
              cursor: 'pointer',
            }}
          >
            Force Redirect to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}