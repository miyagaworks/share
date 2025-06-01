// middleware.ts (修正版 - トークン取得の問題を解決)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { checkEmailVerification } from './middleware/emailVerificationHandler';
import { logger } from '@/lib/utils/logger';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // auth関連のURLは処理しない
  if (pathname.startsWith('/auth') || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // ダッシュボードへのアクセスを制御
  if (pathname.startsWith('/dashboard')) {
    // 🔥 修正: getToken の設定を簡素化
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    logger.debug('ミドルウェア: トークン取得結果', {
      hasToken: !!token,
      tokenSub: token?.sub,
      tokenEmail: token?.email,
      tokenRole: token?.role,
      requestPath: pathname,
    });

    // 未認証ユーザーはログインページへリダイレクト
    if (!token) {
      logger.debug('未認証ユーザー: ログインページにリダイレクト');
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    // セッション有効期限チェック
    const now = Math.floor(Date.now() / 1000);
    if (token.exp && token.exp < now) {
      logger.debug('セッション期限切れ: ログインページにリダイレクト');
      const response = NextResponse.redirect(new URL('/auth/signin?expired=1', request.url));
      // 🔥 修正: cookie削除の方法を改善
      response.cookies.set('next-auth.session-token', '', {
        expires: new Date(0),
        path: '/',
      });
      response.cookies.set('next-auth.callback-url', '', {
        expires: new Date(0),
        path: '/',
      });
      response.cookies.set('next-auth.csrf-token', '', {
        expires: new Date(0),
        path: '/',
      });
      return response;
    }

    // 🚀 新機能: 法人ユーザーの動線制御（ミドルウェアレベル）
    const userEmail = token.email as string;
    const userRole = token.role as string;

    logger.debug('ユーザーロール判定', {
      userEmail,
      userRole,
      requestPath: pathname,
    });

    // 1. 管理者メールアドレスのチェック
    if (userEmail === 'admin@sns-share.com') {
      if (
        pathname === '/dashboard' ||
        pathname.startsWith('/dashboard/profile') ||
        pathname.startsWith('/dashboard/links') ||
        pathname.startsWith('/dashboard/design') ||
        pathname.startsWith('/dashboard/share')
      ) {
        logger.debug('管理者ユーザー: 管理者ダッシュボードにリダイレクト');
        return NextResponse.redirect(new URL('/dashboard/admin', request.url));
      }
    }

    // 🚀 新機能: JWTトークンから法人ユーザー情報を取得して動線制御
    else {
      // 2. 法人管理者の動線制御
      if (
        userRole === 'admin' ||
        userRole === 'corporate-admin' ||
        userRole === 'permanent-admin'
      ) {
        // 個人ダッシュボードや個人機能にアクセスしようとした場合
        if (
          pathname === '/dashboard' ||
          pathname.startsWith('/dashboard/profile') ||
          pathname.startsWith('/dashboard/links') ||
          pathname.startsWith('/dashboard/design') ||
          pathname.startsWith('/dashboard/share')
        ) {
          logger.debug('法人管理者: 法人ダッシュボードにリダイレクト', {
            userEmail,
            userRole,
            requestedPath: pathname,
          });
          return NextResponse.redirect(new URL('/dashboard/corporate', request.url));
        }
      }

      // 3. 法人招待メンバーの動線制御
      else if (userRole === 'member' || userRole === 'corporate-member') {
        // 個人ダッシュボードや個人機能にアクセスしようとした場合
        if (
          pathname === '/dashboard' ||
          pathname.startsWith('/dashboard/profile') ||
          pathname.startsWith('/dashboard/links') ||
          pathname.startsWith('/dashboard/design') ||
          pathname.startsWith('/dashboard/share')
        ) {
          logger.debug('法人招待メンバー: 法人メンバーページにリダイレクト', {
            userEmail,
            userRole,
            requestedPath: pathname,
          });
          return NextResponse.redirect(new URL('/dashboard/corporate-member', request.url));
        }

        // 法人管理ページにアクセスしようとした場合は法人メンバーページにリダイレクト
        if (
          pathname.startsWith('/dashboard/corporate') &&
          !pathname.startsWith('/dashboard/corporate-member')
        ) {
          logger.debug(
            '法人招待メンバー: 法人管理ページアクセス拒否、法人メンバーページにリダイレクト',
            {
              userEmail,
              userRole,
              requestedPath: pathname,
            },
          );
          return NextResponse.redirect(new URL('/dashboard/corporate-member', request.url));
        }
      }

      // 4. 不完全な招待メンバーの処理
      else if (userRole === 'incomplete-member') {
        // 法人ページにアクセスしようとした場合は個人ダッシュボードにリダイレクト
        if (pathname.startsWith('/dashboard/corporate')) {
          logger.debug('不完全な招待メンバー: 個人ダッシュボードにリダイレクト', {
            userEmail,
            userRole,
            requestedPath: pathname,
          });
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }

      // 5. 個人ユーザーの法人ページアクセス制御
      else if (userRole === 'personal' || !userRole) {
        // 法人関連ページにアクセスしようとした場合は個人ダッシュボードにリダイレクト
        if (pathname.startsWith('/dashboard/corporate')) {
          logger.debug('個人ユーザー: 法人ページアクセス拒否、個人ダッシュボードにリダイレクト', {
            userEmail,
            userRole,
            requestedPath: pathname,
          });
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }
    }

    // 🔥 修正: メール認証チェック（エラーハンドリング追加）
    try {
      const emailVerificationResult = await checkEmailVerification(request);
      if (emailVerificationResult.url !== request.url) {
        return emailVerificationResult;
      }
    } catch (error) {
      logger.error('メール認証チェックエラー:', error);
      // エラーが発生してもアクセスは許可
    }

    logger.debug('認証済みユーザー: アクセス許可', {
      userId: token.sub,
      userEmail,
      userRole,
      requestedPath: pathname,
      sessionExpiry: token.exp ? new Date(token.exp * 1000).toISOString() : 'なし',
    });
  }

  return NextResponse.next();
}

// ミドルウェアを適用するパスを設定
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth/:path*',
    // APIルートも監視対象に追加（必要に応じて）
    '/api/corporate/:path*',
    '/api/corporate-member/:path*',
    '/api/profile/:path*',
  ],
};