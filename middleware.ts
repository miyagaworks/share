// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
    // 例: /dashboard で始まるパスは認証が必要
    const isAuthRequired = request.nextUrl.pathname.startsWith('/dashboard');

    // 認証が必要なパスの場合の処理を追加できます
    if (isAuthRequired) {
        // ここに認証チェックなどのロジックを追加
        // 例: return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};