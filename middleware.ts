// middleware.ts (一時的無効化版)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('🔍 Middleware (DISABLED) - Request:', {
    pathname,
    host: request.headers.get('host'),
    userAgent: request.headers.get('user-agent')?.substring(0, 50),
  });

  // 🔥 一時的にすべてのリクエストを通す
  console.log('🔄 Middleware DISABLED - Allowing all requests');
  return NextResponse.next();
}

// ミドルウェアを適用するパスを最小限に
export const config = {
  matcher: ['/dashboard/:path*'],
};