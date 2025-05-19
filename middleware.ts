// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

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
      cookieName: 'next-auth.session-token', // クッキー名を明示的に指定
    });

    // デバッグ出力
    console.log(`Middleware詳細ログ: ${pathname}`, {
      hasToken: !!token,
      cookieHeader: request.headers.get('cookie'),
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

    // ユーザーの種類を判断してリダイレクト先を決定する関数
    async function determineRedirectPath(req: NextRequest) {
      const token = await getToken({ req });

      if (!token) return null; // ログインしていない場合

      try {
        // ユーザー情報を取得
        const user = await prisma.user.findUnique({
          where: { id: token.sub as string },
          include: {
            tenant: true,
            adminOfTenant: true,
          },
        });

        if (!user) return null;

        // 法人テナント管理者の場合
        if (user.adminOfTenant) {
          return '/dashboard/corporate';
        }

        // 法人テナントメンバーの場合
        if (user.tenant) {
          return '/dashboard/corporate-member';
        }

        // それ以外は個人ダッシュボード
        return '/dashboard';
      } catch (error) {
        console.error('ユーザー情報取得エラー:', error);
        return null;
      }
    }

    // ミドルウェア内で呼び出す
    if (pathname === '/dashboard') {
      const redirectPath = await determineRedirectPath(request);
      if (redirectPath && redirectPath !== '/dashboard') {
        return NextResponse.redirect(new URL(redirectPath, request.url));
      }
    }

    console.log('認証済みユーザー: アクセス許可');
  }

  return NextResponse.next();
}

// ミドルウェアを適用するパスを設定
export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
};