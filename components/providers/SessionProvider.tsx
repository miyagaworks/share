// components/providers/SessionProvider.tsx
'use client';

import { SessionProvider as NextAuthSessionProvider, signOut } from 'next-auth/react';
import { ReactNode, useEffect, useRef } from 'react';

interface EnhancedSessionProviderProps {
  children: ReactNode;
  // セッションタイムアウト時間（分単位）
  sessionTimeoutMinutes?: number;
  // 警告表示時間（分単位）
  warningBeforeMinutes?: number;
  // 自動ログアウトを有効にするか
  enableAutoLogout?: boolean;
}

export function SessionProvider({
  children,
  sessionTimeoutMinutes = 480, // デフォルト8時間
  warningBeforeMinutes = 5, // デフォルト5分前に警告
  enableAutoLogout = true,
}: EnhancedSessionProviderProps) {
  const warningShownRef = useRef(false);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enableAutoLogout) return;

    const setupSessionTimeout = () => {
      // 既存のタイマーをクリア
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      if (warningTimeoutIdRef.current) clearTimeout(warningTimeoutIdRef.current);

      // 警告表示のタイマー
      const warningTime = (sessionTimeoutMinutes - warningBeforeMinutes) * 60 * 1000;
      warningTimeoutIdRef.current = setTimeout(() => {
        if (!warningShownRef.current) {
          warningShownRef.current = true;
          showSessionWarning();
        }
      }, warningTime);

      // 自動ログアウトのタイマー
      const logoutTime = sessionTimeoutMinutes * 60 * 1000;
      timeoutIdRef.current = setTimeout(() => {
        handleAutoLogout();
      }, logoutTime);
    };

    const showSessionWarning = () => {
      const remainingMinutes = warningBeforeMinutes;
      const shouldContinue = confirm(
        `セッションが${remainingMinutes}分後に期限切れになります。\n` +
          `続行しますか？\n\n` +
          `「OK」をクリックするとセッションが延長されます。\n` +
          `「キャンセル」をクリックするか、何もしないとログアウトされます。`,
      );

      if (shouldContinue) {
        // セッション更新
        extendSession();
        warningShownRef.current = false;
      } else {
        // 即座にログアウト
        handleAutoLogout();
      }
    };

    const extendSession = async () => {
      try {
        // セッションを更新するために、session APIを呼び出し
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          // セッションが正常に更新された場合、タイマーをリセット
          setupSessionTimeout();
          console.log('セッションが延長されました');
        } else {
          // セッション更新に失敗した場合はログアウト
          handleAutoLogout();
        }
      } catch (error) {
        console.error('セッション延長エラー:', error);
        handleAutoLogout();
      }
    };

    const handleAutoLogout = async () => {
      try {
        console.log('セッションタイムアウトによる自動ログアウト');
        await signOut({
          redirect: true,
          callbackUrl: '/auth/signin?timeout=1',
        });
      } catch (error) {
        console.error('自動ログアウトエラー:', error);
        // フォールバック: 強制的にリロード
        window.location.href = '/auth/signin?timeout=1';
      }
    };

    // ユーザーアクティビティを監視してセッションを延長
    const resetSessionTimer = () => {
      if (warningShownRef.current) {
        warningShownRef.current = false;
      }
      setupSessionTimeout();
    };

    // ユーザーアクティビティのイベントリスナー
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    // アクティビティの頻度を制限するためのスロットル機能
    let lastActivity = Date.now();
    const activityThrottle = 30 * 1000; // 30秒

    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastActivity > activityThrottle) {
        lastActivity = now;
        resetSessionTimer();
        console.log('ユーザーアクティビティ検出 - セッションタイマーリセット');
      }
    };

    // イベントリスナーを追加
    activityEvents.forEach((event) => {
      document.addEventListener(event, handleUserActivity, true);
    });

    // 初回タイマー設定
    setupSessionTimeout();

    // クリーンアップ
    return () => {
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      if (warningTimeoutIdRef.current) clearTimeout(warningTimeoutIdRef.current);

      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleUserActivity, true);
      });
    };
  }, [sessionTimeoutMinutes, warningBeforeMinutes, enableAutoLogout]);

  return (
    <NextAuthSessionProvider
      // セッション更新間隔を設定（5分ごと）
      refetchInterval={5 * 60}
      // フォーカス時にセッションを再取得
      refetchOnWindowFocus={true}
    >
      {children}
    </NextAuthSessionProvider>
  );
}