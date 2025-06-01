// middleware.ts (一時的簡素版)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('🔍 Middleware triggered:', { pathname, host: request.headers.get('host') });

  // auth関連のURLは処理しない
  if (pathname.startsWith('/auth') || pathname.startsWith('/api/auth')) {
    console.log('🔄 Auth route, skipping middleware');
    return NextResponse.next();
  }

  // ダッシュボードへのアクセスを制御
  if (pathname.startsWith('/dashboard')) {
    try {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });

      console.log('🔍 Middleware token check:', {
        hasToken: !!token,
        tokenSub: token?.sub,
        tokenEmail: token?.email,
        tokenRole: token?.role,
        requestPath: pathname,
      });

      // 未認証ユーザーはログインページへリダイレクト
      if (!token) {
        console.log('❌ No token, redirecting to signin');
        return NextResponse.redirect(new URL('/auth/signin', request.url));
      }

      console.log('✅ Token found, allowing access');
      return NextResponse.next();
    } catch (error) {
      console.error('💥 Middleware error:', error);
      // エラーが発生した場合はアクセスを許可
      return NextResponse.next();
    }
  }

  console.log('🔄 Non-dashboard route, skipping checks');
  return NextResponse.next();
}

// ミドルウェアを適用するパスを設定
export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
};