// components/providers/SessionProvider.tsx (シンプル化版)
'use client';
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider
      // 基本設定のみ
      basePath="/api/auth"
      refetchInterval={0} // 自動更新を無効化
      refetchOnWindowFocus={false} // フォーカス時更新を無効化
    >
      {children}
    </NextAuthSessionProvider>
  );
}