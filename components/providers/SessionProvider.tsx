// components/providers/SessionProvider.tsx (修正版)
'use client';
import { SessionProvider as NextAuthSessionProvider, signOut } from 'next-auth/react';
import { ReactNode, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
interface EnhancedSessionProviderProps {
  children: ReactNode;
  // セッションタイムアウト時間（分単位）
  sessionTimeoutMinutes?: number;
  // 警告表示時間（分単位）
  warningBeforeMinutes?: number;
  // 自動ログアウトを有効にするか
  enableAutoLogout?: boolean;
  // 除外パス（自動ログアウトを無効にするパス）
  excludePaths?: string[];
}
export function SessionProvider({
  children,
  sessionTimeoutMinutes = 480, // デフォルト8時間
  warningBeforeMinutes = 5, // デフォルト5分前に警告
  enableAutoLogout = true,
  excludePaths = [],
}: EnhancedSessionProviderProps) {
  const pathname = usePathname();
  const warningShownRef = useRef(false);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef(Date.now());
  // 🚀 現在のパスが除外対象かチェック
  const isExcludedPath = excludePaths.some((path) => pathname?.startsWith(path));
  // 🚀 デザイン・リンク関連ページでは自動ログアウトを無効化
  const isDesignOrLinksPage =
    pathname?.includes('/design') ||
    pathname?.includes('/links') ||
    pathname?.includes('/corporate-member');
  // 🚀 実際の自動ログアウト有効フラグ
  const shouldEnableAutoLogout = enableAutoLogout && !isExcludedPath && !isDesignOrLinksPage;
  useEffect(() => {
    if (!shouldEnableAutoLogout) {
      return;
    }
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
        // 🚀 修正: セッション延長時の処理を最小限に
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        if (response.ok) {
          setupSessionTimeout();
        } else {
          handleAutoLogout();
        }
      } catch (error) {
        handleAutoLogout();
      }
    };
    const handleAutoLogout = async () => {
      try {
        await signOut({
          redirect: true,
          callbackUrl: '/auth/signin?timeout=1',
        });
      } catch (error) {
        window.location.href = '/auth/signin?timeout=1';
      }
    };
    // 🚀 修正: アクティビティ監視を大幅に緩和
    const resetSessionTimer = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;
      // 🔥 5分以上経過した場合のみタイマーリセット（頻度を大幅に削減）
      if (timeSinceLastActivity > 5 * 60 * 1000) {
        lastActivityRef.current = now;
        if (warningShownRef.current) {
          warningShownRef.current = false;
        }
        setupSessionTimeout();
      }
    };
    // 🚀 修正: 監視するイベントを最小限に削減
    const activityEvents = ['click', 'keypress']; // mousedown, mousemove, scroll, touchstart を削除
    const handleUserActivity = () => {
      resetSessionTimer();
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
  }, [sessionTimeoutMinutes, warningBeforeMinutes, shouldEnableAutoLogout, pathname]);
  return (
    <NextAuthSessionProvider
      // 🚀 修正: セッション更新頻度を大幅に削減
      refetchInterval={shouldEnableAutoLogout ? 15 * 60 : 30 * 60} // 15分または30分ごと
      // 🚀 修正: デザイン・リンクページではフォーカス時更新を無効化
      refetchOnWindowFocus={!isDesignOrLinksPage}
    >
      {children}
    </NextAuthSessionProvider>
  );
}