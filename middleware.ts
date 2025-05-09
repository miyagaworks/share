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

  // APIエンドポイントの処理を改善
  if (pathname.startsWith('/api/')) {
    // API呼び出し時にはセッショントークンが存在することを確認
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production',
    });

    // 認証が必要なAPI（/api/corporateなど）に未認証アクセスがあれば401を返す
    if (pathname.startsWith('/api/corporate') && !token) {
      console.log('未認証API呼び出し:', pathname);
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    return NextResponse.next();
  }

  // ダッシュボードへのアクセスを制御
  if (pathname.startsWith('/dashboard')) {
    // secretパラメータを追加
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production',
      cookieName: 'next-auth.session-token', // クッキー名を明示的に指定
    });

    // デバッグ出力
    console.log(`Middleware詳細ログ: ${pathname}`, {
      hasToken: !!token,
      cookieHeader: request.headers.has('cookie'),
      tokenData: token
        ? JSON.stringify({
            name: token.name,
            email: token.email,
            sub: token.sub,
          })
        : 'トークンなし',
    });

    // 未認証ユーザーはログインページへリダイレクト
    if (!token) {
      console.log('未認証ユーザー: ログインページにリダイレクト');
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    console.log('認証済みユーザー: アクセス許可');
  }

  return NextResponse.next();
}

// ミドルウェアを適用するパスを設定
export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*', '/api/corporate/:path*'],
};