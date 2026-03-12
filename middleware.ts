// middleware.ts (財務管理者リダイレクト修正版 + カスタムドメイン対応)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { isSuperAdmin as isSuperAdminEmail } from '@/lib/auth/constants';
import { features } from '@/lib/features';

/**
 * 環境変数 PARTNER_DOMAIN_MAP からドメイン→partnerIdのマッピングを取得
 * Edge Runtimeで動作するため、PrismaではなくJSONベースの環境変数を使用
 * 例: {"card.example.co.jp":"partner_id_1","meishi.example.com":"partner_id_2"}
 */
function getPartnerDomainMap(): Record<string, string> {
  const mapJson = process.env.PARTNER_DOMAIN_MAP;
  if (!mapJson) return {};
  try {
    return JSON.parse(mapJson);
  } catch {
    return {};
  }
}

/** メインドメインかどうかを判定 */
function isMainDomain(hostname: string): boolean {
  const mainDomains = ['sns-share.com', 'app.sns-share.com', 'localhost'];
  const cleaned = hostname.split(':')[0]; // ポート番号を除去
  return mainDomains.includes(cleaned) || cleaned.endsWith('.sns-share.com') || cleaned.endsWith('.vercel.app');
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // カスタムドメイン判定: メインドメイン以外のホスト名をパートナードメインとして処理
  let response: NextResponse | undefined;
  let partnerId: string | null = null;

  if (!isMainDomain(hostname)) {
    const domainMap = getPartnerDomainMap();
    const cleanHost = hostname.split(':')[0]; // ポート番号を除去
    partnerId = domainMap[cleanHost] || null;
  }

  // auth関連のURLは処理しない（ただしパートナーヘッダーはセット）
  if (pathname.startsWith('/auth') || pathname.startsWith('/api/auth')) {
    const resp = NextResponse.next();
    if (partnerId) {
      resp.headers.set('x-partner-id', partnerId);
    }
    return resp;
  }

  // ダッシュボードへのアクセスを制御
  if (pathname.startsWith('/dashboard')) {
    try {
      // 🔧 シンプルなトークン取得
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        cookieName:
          process.env.NODE_ENV === 'production'
            ? '__Secure-next-auth.session-token'
            : 'next-auth.session-token',
        raw: false,
      });

      // 開発環境でのみログ出力
      if (process.env.NODE_ENV === 'development') {
        console.log('🔒 Middleware: Token check', {
          pathname,
          hasToken: !!token,
          tokenEmail: token?.email,
          tokenRole: token?.role, // 🆕 ロール情報も表示
        });
      }

      // 未認証ユーザーはログインページへリダイレクト
      if (!token) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ Middleware: No token, redirecting to signin');
        }
        const response = NextResponse.redirect(new URL('/auth/signin', request.url));
        response.headers.delete('x-middleware-cache');
        response.headers.delete('x-middleware-prefetch');
        return response;
      }

      // 🔧 ロール判定
      const userRole = token.role as string;
      const userEmail = token.email as string;

      // スーパー管理者の処理（機能フラグで無効化可能）
      if (features.superAdmin && (isSuperAdminEmail(userEmail) || userRole === 'super-admin')) {
        if (pathname === '/dashboard' && !pathname.startsWith('/dashboard/admin')) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 Middleware: Redirecting super admin to /dashboard/admin');
          }
          return NextResponse.redirect(new URL('/dashboard/admin', request.url));
        }
        // 既に管理画面にいる場合はそのまま通す
        return NextResponse.next();
      }

      // 🆕 財務管理者の処理（修正版・機能フラグで無効化可能）
      else if (features.financialAdmin && userRole === 'financial-admin') {
        // /dashboard のルートアクセス時のリダイレクト
        if (pathname === '/dashboard') {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 Middleware: Redirecting financial admin to /dashboard/admin');
          }
          return NextResponse.redirect(new URL('/dashboard/admin', request.url));
        }

        // 管理画面内でのアクセス制御
        if (pathname.startsWith('/dashboard/admin')) {
          const allowedPaths = [
            '/dashboard/admin',
            '/dashboard/admin/financial',
            '/dashboard/admin/company-expenses',
            '/dashboard/admin/stripe/revenue',
          ];

          // 許可されたパスの場合はアクセスを許可
          const isAllowed = allowedPaths.some((path) => pathname.startsWith(path));
          if (isAllowed) {
            if (process.env.NODE_ENV === 'development') {
              console.log('✅ Middleware: Financial admin access allowed to', pathname);
            }
            return NextResponse.next();
          } else {
            // 許可されていないパスは管理トップにリダイレクト
            if (process.env.NODE_ENV === 'development') {
              console.log(
                '🔄 Middleware: Financial admin redirected from',
                pathname,
                'to /dashboard/admin',
              );
            }
            return NextResponse.redirect(new URL('/dashboard/admin', request.url));
          }
        }

        // 個人機能や法人機能へのアクセス拒否
        if (
          pathname.startsWith('/dashboard/corporate') ||
          (pathname.startsWith('/dashboard') &&
            !pathname.startsWith('/dashboard/admin') &&
            pathname !== '/dashboard')
        ) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🚫 Middleware: Financial admin blocked from', pathname);
          }
          return NextResponse.redirect(new URL('/dashboard/admin', request.url));
        }

        // その他の場合はアクセスを許可
        return NextResponse.next();
      }

      // パートナー管理者の処理
      else if (userRole === 'partner-admin') {
        if (pathname === '/dashboard') {
          return NextResponse.redirect(new URL('/dashboard/partner', request.url));
        }
        // パートナー管理画面内はアクセス許可
        if (pathname.startsWith('/dashboard/partner')) {
          return NextResponse.next();
        }
        // admin画面やcorporate画面へのアクセスは拒否
        if (
          pathname.startsWith('/dashboard/admin') ||
          pathname.startsWith('/dashboard/corporate')
        ) {
          return NextResponse.redirect(new URL('/dashboard/partner', request.url));
        }
      }

      // 永久利用権法人プランユーザーの処理
      else if (userRole === 'permanent-admin') {
        if (pathname === '/dashboard') {
          return NextResponse.redirect(new URL('/dashboard/corporate', request.url));
        }
      }
      // 法人管理者の処理
      else if (userRole === 'admin') {
        if (pathname === '/dashboard') {
          return NextResponse.redirect(new URL('/dashboard/corporate', request.url));
        }
      }
      // 法人メンバーの処理
      else if (userRole === 'member') {
        if (pathname === '/dashboard') {
          return NextResponse.redirect(new URL('/dashboard/corporate-member', request.url));
        }
        // 法人管理ページへのアクセスは拒否
        if (
          pathname.startsWith('/dashboard/corporate') &&
          !pathname.startsWith('/dashboard/corporate-member')
        ) {
          return NextResponse.redirect(new URL('/dashboard/corporate-member', request.url));
        }
      }
      // 個人ユーザーの処理
      else {
        // 法人関連ページへのアクセスは拒否
        if (
          pathname.startsWith('/dashboard/corporate') ||
          pathname.startsWith('/dashboard/admin')
        ) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }

      // 開発環境でのみログ出力
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Middleware: Access allowed', {
          pathname,
          userRole,
          userEmail,
        });
      }
      const resp = NextResponse.next();
      if (partnerId) {
        resp.headers.set('x-partner-id', partnerId);
      }
      return resp;
    } catch (error) {
      console.error('💥 Middleware error:', error);
      // エラー時はログインページへリダイレクト
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }
  }

  const resp = NextResponse.next();
  if (partnerId) {
    resp.headers.set('x-partner-id', partnerId);
  }
  return resp;
}

export const config = {
  matcher: [
    // ダッシュボードルーティング + カスタムドメインヘッダー注入
    '/dashboard/:path*',
    // カスタムドメインでのページ表示にx-partner-idヘッダーを注入
    '/((?!_next/static|_next/image|favicon.ico|pwa/).*)',
  ],
};