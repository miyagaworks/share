// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// この最小限のミドルウェアは認証チェックのみを行い
// データベースアクセスを含む複雑な処理は行いません
export function middleware(request: NextRequest) {
  // ルートへのリクエストを処理
  if (request.nextUrl.pathname === '/') {
    // 必要に応じてリダイレクトやレスポンス変更が可能
    return NextResponse.next();
  }

  // ダッシュボードへのアクセスは許可
  // 認証チェックは各ページコンポーネントで行う
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  // APIルートへのアクセス
  if (request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // デフォルトはそのまま次へ
  return NextResponse.next();
}

// 静的アセットと画像を除外
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};