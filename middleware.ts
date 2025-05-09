// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // auth関連のURLとAPIは処理しない（認証処理の高速化）
  if (pathname.startsWith('/auth') || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // ダッシュボードへのアクセスを制御
  if (pathname.startsWith('/dashboard')) {
    try {
      // secretパラメータを明示的に設定
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        secureCookie: process.env.NODE_ENV === 'production',
      });

      // 未認証ユーザーはログインページへリダイレクト
      if (!token) {
        console.log('未認証ユーザー: ログインページにリダイレクト');
        return NextResponse.redirect(new URL('/auth/signin', request.url));
      }

      // 認証OK
      return NextResponse.next();
    } catch (error) {
      console.error('ミドルウェアエラー:', error);
      // エラー時も通過させる - クライアント側で再検証
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

// ミドルウェアを適用するパスを設定 - APIパスを除外
export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
};