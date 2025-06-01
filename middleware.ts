// middleware.ts (安定版)
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
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        cookieName:
          process.env.NODE_ENV === 'production'
            ? '__Secure-next-auth.session-token'
            : 'next-auth.session-token',
      });

      console.log('🔒 Middleware: Token check', {
        pathname,
        hasToken: !!token,
        tokenRole: token?.role,
        tokenEmail: token?.email,
      });

      // 未認証ユーザーはログインページへリダイレクト
      if (!token) {
        console.log('❌ Middleware: No token, redirecting to signin');
        return NextResponse.redirect(new URL('/auth/signin', request.url));
      }

      // 🔥 安定したリダイレクトロジック（簡素化版）
      const userRole = token.role as string;
      const userEmail = token.email as string;

      // 1. 管理者メールアドレスの処理
      if (userEmail === 'admin@sns-share.com') {
        // 管理者が管理者ページ以外にアクセスした場合のみリダイレクト
        if (pathname === '/dashboard' && !pathname.startsWith('/dashboard/admin')) {
          console.log('👑 Middleware: Admin redirect to /dashboard/admin');
          return NextResponse.redirect(new URL('/dashboard/admin', request.url));
        }
      }
      // 2. 法人管理者の処理
      else if (userRole === 'admin' || userRole === 'permanent-admin') {
        // 法人管理者が一般ダッシュボードにアクセスした場合のみリダイレクト
        if (pathname === '/dashboard') {
          console.log('🏢 Middleware: Corp admin redirect to /dashboard/corporate');
          return NextResponse.redirect(new URL('/dashboard/corporate', request.url));
        }
      }
      // 3. 法人メンバーの処理
      else if (userRole === 'member') {
        // 法人メンバーが一般ダッシュボードにアクセスした場合のみリダイレクト
        if (pathname === '/dashboard') {
          console.log('👥 Middleware: Member redirect to /dashboard/corporate-member');
          return NextResponse.redirect(new URL('/dashboard/corporate-member', request.url));
        }
        // 法人管理ページへのアクセスは拒否
        if (
          pathname.startsWith('/dashboard/corporate') &&
          !pathname.startsWith('/dashboard/corporate-member')
        ) {
          console.log('🚫 Middleware: Member blocked from corporate admin');
          return NextResponse.redirect(new URL('/dashboard/corporate-member', request.url));
        }
      }
      // 4. 個人ユーザーの処理
      else {
        // 法人関連ページへのアクセスは拒否
        if (pathname.startsWith('/dashboard/corporate')) {
          console.log('🚫 Middleware: Personal user blocked from corporate');
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }

      console.log('✅ Middleware: Access allowed');
      return NextResponse.next();
    } catch (error) {
      console.error('💥 Middleware error:', error);
      // エラー時は通す（安全側に倒す）
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};