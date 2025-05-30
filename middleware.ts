// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { checkEmailVerification } from './middleware/emailVerificationHandler';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // auth関連のURLは処理しない
  if (pathname.startsWith('/auth') || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // ダッシュボードへのアクセスを制御
  if (pathname.startsWith('/dashboard')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production',
      cookieName: 'next-auth.session-token',
    });

    // 未認証ユーザーはログインページへリダイレクト
    if (!token) {
      console.log('未認証ユーザー: ログインページにリダイレクト');
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    // セッション有効期限チェック
    const now = Math.floor(Date.now() / 1000);
    if (token.exp && token.exp < now) {
      console.log('セッション期限切れ: ログインページにリダイレクト');
      // 期限切れのトークンを削除するためのレスポンスを作成
      const response = NextResponse.redirect(new URL('/auth/signin?expired=1', request.url));

      // セッションCookieを削除
      response.cookies.delete('next-auth.session-token');
      response.cookies.delete('next-auth.callback-url');
      response.cookies.delete('next-auth.csrf-token');

      return response;
    }

    // 非アクティブ時間チェック（オプション）
    const lastActivity = (token.lastActivity as number) || 0;
    const timeSinceLastActivity = now - lastActivity;
    const maxInactiveTime = 2 * 60 * 60; // 2時間の非アクティブでログアウト

    if (timeSinceLastActivity > maxInactiveTime) {
      console.log('非アクティブタイムアウト: ログインページにリダイレクト');
      const response = NextResponse.redirect(new URL('/auth/signin?inactive=1', request.url));

      // セッションCookieを削除
      response.cookies.delete('next-auth.session-token');
      response.cookies.delete('next-auth.callback-url');
      response.cookies.delete('next-auth.csrf-token');

      return response;
    }

    // 🔥 追加: メール認証チェック
    const emailVerificationResult = await checkEmailVerification(request);
    if (emailVerificationResult.url !== request.url) {
      return emailVerificationResult;
    }

    console.log('認証済みユーザー: アクセス許可', {
      userId: token.sub,
      sessionExpiry: token.exp ? new Date(token.exp * 1000).toISOString() : 'なし',
      lastActivity: lastActivity ? new Date(lastActivity * 1000).toISOString() : 'なし',
    });
  }

  return NextResponse.next();
}

// ミドルウェアを適用するパスを設定
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth/:path*',
    // APIルートも監視対象に追加（必要に応じて）
    '/api/corporate/:path*',
    '/api/corporate-member/:path*',
    '/api/profile/:path*',
  ],
};