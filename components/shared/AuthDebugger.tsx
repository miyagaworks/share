// components/shared/AuthDebugger.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export function AuthDebugger() {
  const { data: session, status } = useSession();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    console.log('認証状態:', { session, status });
  }, [session, status]);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setVisible(!visible)}
        className="bg-black bg-opacity-50 text-white rounded-full p-2"
      >
        認証
      </button>

      {visible && (
        <div className="mt-2 p-3 bg-black bg-opacity-70 text-white rounded-lg text-xs max-w-xs">
          <p>認証状態: {status}</p>
          {session ? (
            <>
              <p>ユーザーID: {session.user?.id}</p>
              <p>名前: {session.user?.name}</p>
              <p>メール: {session.user?.email}</p>
              <p>ロール: {session.user?.role || 'なし'}</p>
            </>
          ) : (
            <p>セッションなし</p>
          )}
        </div>
      )}
    </div>
  );
}