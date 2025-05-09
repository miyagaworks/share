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

  // 認証情報を取得
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // APIエンドポイントの処理を改善
  if (pathname.startsWith('/api/')) {
    // 認証が必要なAPI
    if (
      pathname.startsWith('/api/corporate') ||
      pathname.startsWith('/api/user') ||
      pathname.startsWith('/api/dashboard')
    ) {
      // デバッグ情報
      console.log('API認証チェック:', {
        path: pathname,
        hasToken: !!token,
        tokenId: token?.sub || 'なし',
        exp: token?.exp ? new Date(token.exp * 1000).toISOString() : 'なし',
      });

      // 認証されていない場合は401を返す
      if (!token?.sub) {
        console.log('API認証失敗:', pathname);
        return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
      }
    }

    return NextResponse.next();
  }

  // ダッシュボードへのアクセスを制御
  if (pathname.startsWith('/dashboard')) {
    // 認証チェック
    if (!token?.sub) {
      console.log('未認証ユーザー: ログインページにリダイレクト');
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }
  }

  return NextResponse.next();
}

// ミドルウェアを適用するパスを設定 - すべての重要なパスを含める
export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/api/corporate/:path*',
    '/api/user/:path*', 
    '/api/dashboard/:path*',
    '/auth/:path*'
  ],
};