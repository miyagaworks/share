// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from './auth'; // NextAuth v4の方法でインポート

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
  // デバッグ情報を追加
  console.log(`Middleware実行: ${request.nextUrl.pathname}`);

  const session = await auth();
  const token = session?.token;

  // デバッグ情報を追加
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Path: ${request.nextUrl.pathname}, Token存在: ${!!token}`);
  }

  const { pathname } = request.nextUrl;

  // 認証が必要なパスへのアクセスを制御
  if (pathname.startsWith('/dashboard')) {
    // 未認証ユーザーのリダイレクト
    if (!session) {
      console.log(`未認証ユーザー: ${pathname} へのアクセスをリダイレクト`);
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    // 法人ダッシュボードへのアクセスを制御
    if (pathname.startsWith('/dashboard/corporate/')) {
      try {
        // sessionのユーザー情報を型キャスト
        const user = session.user as TokenUser | undefined;

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
    if (!session) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    try {
      // sessionのユーザー情報を型キャスト
      const user = session.user as TokenUser | undefined;

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

  // 認証ページへのリダイレクト処理を追加
  // 既に認証されているユーザーが認証ページにアクセスした場合はダッシュボードへリダイレクト
  if (pathname.startsWith('/auth/') && session) {
    console.log('認証済みユーザーが認証ページにアクセス - ダッシュボードへリダイレクト');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// マッチャーを修正 - 範囲を限定
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/corporate/:path*',
    '/auth/:path*', // 認証関連ページのみを対象に
  ],
};