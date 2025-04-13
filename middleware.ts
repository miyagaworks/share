// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// トークンのユーザー情報に対する型定義
interface TokenUser {
  id?: string;
  email?: string;
  tenantId?: string;
  adminOfTenant?: unknown;
  subscription?: {
    plan?: string;
    status?: string;
  };
}

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = request.nextUrl;

  // 認証が必要なパスへのアクセスを制御
  if (pathname.startsWith('/dashboard')) {
    // 未認証ユーザーのリダイレクト
    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    // 法人ダッシュボードへのアクセスを制御
    if (pathname.startsWith('/dashboard/corporate/')) {
      try {
        // tokenのユーザー情報を型キャスト
        const user = token.user as TokenUser | undefined;

        if (!user) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }

        // 法人テナントIDが含まれているかを確認
        const hasCorporateTenant = !!(user.tenantId || user.adminOfTenant);

        // 法人サブスクリプションプランかチェック（可能であれば）
        const hasCorporatePlan = !!(
          user.subscription?.plan &&
          ['business', 'business-plus', 'enterprise'].includes(user.subscription.plan)
        );

        if (!hasCorporateTenant || !hasCorporatePlan) {
          // 法人契約がない場合は個人ダッシュボードにリダイレクト
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      } catch (error) {
        console.error('法人アクセス権チェックエラー:', error);
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  // 法人API利用の制御
  if (pathname.startsWith('/api/corporate/') && pathname !== '/api/corporate/access') {
    // 未認証ユーザーの拒否
    if (!token) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    try {
      // tokenのユーザー情報を型キャスト
      const user = token.user as TokenUser | undefined;

      if (!user) {
        return NextResponse.json(
          { error: '法人プランにアクセスする権限がありません' },
          { status: 403 },
        );
      }

      // 法人テナントIDが含まれているかチェック
      const hasCorporateTenant = !!(user.tenantId || user.adminOfTenant);

      if (!hasCorporateTenant) {
        // 法人契約がない場合はアクセス拒否
        return NextResponse.json(
          { error: '法人プランにアクセスする権限がありません' },
          { status: 403 },
        );
      }
    } catch (error) {
      console.error('法人APIアクセス権チェックエラー:', error);
      return NextResponse.json(
        { error: '法人APIへのアクセス権確認中にエラーが発生しました' },
        { status: 500 },
      );
    }
  }

  return NextResponse.next();
}

// ミドルウェアを適用するパスを指定
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/corporate/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};