// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // auth関連のURLは処理しない
  if (pathname.startsWith('/auth') || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // ダッシュボードへのアクセスを制御
  if (pathname.startsWith('/dashboard')) {
    // secretパラメータを追加
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

    // このリダイレクトロジックが問題の原因 - 削除または変更する
    // if (pathname === '/dashboard') {
    //   // ユーザータイプ判定用のAPI Routeにリダイレクト
    //   // この方法ではミドルウェアでPrismaを使わず、代わりにAPI Routeで処理する
    //   return NextResponse.rewrite(new URL('/api/auth/dashboard-redirect', request.url));
    // }

    console.log('認証済みユーザー: アクセス許可');
  }

  return NextResponse.next();
}

// ミドルウェアを適用するパスを設定
export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
};