// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ダッシュボードへのアクセスを制御
  if (pathname.startsWith('/dashboard')) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    // 未認証ユーザーはログインページへリダイレクト
    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    // 法人アクセス権のチェック（ヘッダーから取得）
    const hasCorporateAccess = request.cookies.get('corporateAccess')?.value === 'true';
    const corporateRole = request.cookies.get('corporateRole')?.value;
    const isAdmin = corporateRole === 'admin';

    // 法人メンバーセクションへのアクセス制御
    if (pathname.startsWith('/dashboard/corporate-member') && !hasCorporateAccess) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // 法人管理ダッシュボードへのアクセス制御（管理者のみ）
    if (
      pathname.startsWith('/dashboard/corporate') &&
      !pathname.startsWith('/dashboard/corporate-member') &&
      !isAdmin
    ) {
      if (hasCorporateAccess) {
        // 法人メンバーの場合はメンバーダッシュボードへ
        return NextResponse.redirect(new URL('/dashboard/corporate-member', request.url));
      } else {
        // 法人アクセス権がない場合は通常ダッシュボードへ
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    // 重要: この部分を完全に削除または強くコメントアウト
    // ルートダッシュボードへのアクセス時のリダイレクトは行わない
    /*
    if (pathname === '/dashboard' && hasCorporateAccess) {
      return NextResponse.redirect(new URL('/dashboard/corporate-member', request.url));
    }
    */
  }

  return NextResponse.next();
}

// ミドルウェアを適用するパスを設定
export const config = {
  matcher: ['/dashboard/:path*'],
};