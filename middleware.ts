// middleware.ts (一時的に無効化版)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 🚨 一時的にMiddlewareを無効化してデバッグ
  console.log('🔧 Middleware bypassed for debugging:', pathname);

  // すべてのリクエストを通す
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};