// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 認証が必要なパスかどうかチェック
  const isAuthRequired =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/api/corporate') ||
    pathname.startsWith('/api/corporate-member');

  // セッショントークンを取得
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // デバッグ出力
  console.log(
    `Middleware: Path ${pathname}, Auth Required: ${isAuthRequired}, Token exists: ${!!token}`,
  );

  // 認証が必要なパスで未認証の場合、リダイレクト
  if (isAuthRequired && !token) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  return NextResponse.next();
}

// ミドルウェアを適用するパスを設定
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/corporate/:path*',
    '/api/corporate-member/:path*',
    '/api/user/:path*',
  ],
};