// middleware.ts (復旧版 - ヘッダーサイズ対策)
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
    try {
      // 🔧 シンプルなトークン取得（ヘッダーサイズ削減）
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        cookieName:
          process.env.NODE_ENV === 'production'
            ? '__Secure-next-auth.session-token'
            : 'next-auth.session-token',
        // 🔧 必要最小限の情報のみ取得
        raw: false,
      });

      console.log('🔒 Middleware: Token check', {
        pathname,
        hasToken: !!token,
        tokenEmail: token?.email,
      });

      // 未認証ユーザーはログインページへリダイレクト
      if (!token) {
        console.log('❌ Middleware: No token, redirecting to signin');
        const response = NextResponse.redirect(new URL('/auth/signin', request.url));

        // 🔧 不要なヘッダーを削除してサイズ削減
        response.headers.delete('x-middleware-cache');
        response.headers.delete('x-middleware-prefetch');

        return response;
      }

      // 🔧 シンプルなロール判定（ヘッダーサイズ削減のため最小限）
      const userRole = token.role as string;
      const userEmail = token.email as string;

      // 管理者の処理
      if (userEmail === 'admin@sns-share.com') {
        if (pathname === '/dashboard' && !pathname.startsWith('/dashboard/admin')) {
          return NextResponse.redirect(new URL('/dashboard/admin', request.url));
        }
      }
      // 永久利用権法人プランユーザーの処理
      else if (userRole === 'permanent-admin') {
        if (pathname === '/dashboard') {
          return NextResponse.redirect(new URL('/dashboard/corporate', request.url));
        }
      }
      // 法人管理者の処理
      else if (userRole === 'admin') {
        if (pathname === '/dashboard') {
          return NextResponse.redirect(new URL('/dashboard/corporate', request.url));
        }
      }
      // 法人メンバーの処理
      else if (userRole === 'member') {
        if (pathname === '/dashboard') {
          return NextResponse.redirect(new URL('/dashboard/corporate-member', request.url));
        }
        // 法人管理ページへのアクセスは拒否
        if (
          pathname.startsWith('/dashboard/corporate') &&
          !pathname.startsWith('/dashboard/corporate-member')
        ) {
          return NextResponse.redirect(new URL('/dashboard/corporate-member', request.url));
        }
      }
      // 個人ユーザーの処理
      else {
        // 法人関連ページへのアクセスは拒否
        if (pathname.startsWith('/dashboard/corporate')) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }

      console.log('✅ Middleware: Access allowed');
      return NextResponse.next();
    } catch (error) {
      console.error('💥 Middleware error:', error);
      // エラー時はログインページへリダイレクト
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};