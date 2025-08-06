// middleware.ts (財務管理者リダイレクト追加版)
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
      // 🔧 シンプルなトークン取得
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        cookieName:
          process.env.NODE_ENV === 'production'
            ? '__Secure-next-auth.session-token'
            : 'next-auth.session-token',
        raw: false,
      });

      console.log('🔒 Middleware: Token check', {
        pathname,
        hasToken: !!token,
        tokenEmail: token?.email,
        tokenRole: token?.role, // 🆕 ロール情報も表示
      });

      // 未認証ユーザーはログインページへリダイレクト
      if (!token) {
        console.log('❌ Middleware: No token, redirecting to signin');
        const response = NextResponse.redirect(new URL('/auth/signin', request.url));
        response.headers.delete('x-middleware-cache');
        response.headers.delete('x-middleware-prefetch');
        return response;
      }

      // 🔧 ロール判定
      const userRole = token.role as string;
      const userEmail = token.email as string;

      // スーパー管理者の処理
      if (userEmail === 'admin@sns-share.com' || userRole === 'super-admin') {
        if (pathname === '/dashboard' && !pathname.startsWith('/dashboard/admin')) {
          console.log('🔄 Middleware: Redirecting super admin to /dashboard/admin');
          return NextResponse.redirect(new URL('/dashboard/admin', request.url));
        }
      }
      // 🆕 財務管理者の処理
      else if (userRole === 'financial-admin') {
        if (pathname === '/dashboard' && !pathname.startsWith('/dashboard/admin')) {
          console.log('🔄 Middleware: Redirecting financial admin to /dashboard/admin');
          return NextResponse.redirect(new URL('/dashboard/admin', request.url));
        }
        // 財務管理者の場合、財務関連ページのみアクセス許可
        if (userRole === 'financial-admin' && pathname.startsWith('/dashboard/admin')) {
          const allowedPaths = [
            '/dashboard/admin',
            '/dashboard/admin/financial',
            '/dashboard/admin/company-expenses',
            '/dashboard/admin/stripe/revenue',
          ];
          const isAllowed = allowedPaths.some((path) => pathname.startsWith(path));

          if (!isAllowed) {
            console.log(
              '🔒 Middleware: Financial admin access denied, redirecting to allowed page',
            );
            return NextResponse.redirect(new URL('/dashboard/admin', request.url));
          }
        }
        // 財務管理者が個人機能や法人機能にアクセスしようとした場合
        if (
          pathname.startsWith('/dashboard/corporate') ||
          (pathname.startsWith('/dashboard') &&
            !pathname.startsWith('/dashboard/admin') &&
            pathname !== '/dashboard')
        ) {
          console.log('🔒 Middleware: Financial admin accessing restricted area, redirecting');
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
        if (
          pathname.startsWith('/dashboard/corporate') ||
          pathname.startsWith('/dashboard/admin')
        ) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }

      console.log('✅ Middleware: Access allowed', {
        pathname,
        userRole,
        userEmail,
      });
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