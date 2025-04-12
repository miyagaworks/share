// middleware/checkTenantStatus.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * 法人テナントのステータスをチェックするミドルウェア
 * 一時停止中のテナントへのアクセスを制限する
 */
export async function checkTenantStatus(req: NextRequest) {
  try {
    // 認証セッションの取得
    const session = await auth();

    // 未認証の場合はそのまま通過（認証チェックは別のミドルウェアで行う）
    if (!session?.user?.id) {
      return NextResponse.next();
    }

    // ダッシュボード（特に法人関連パス）へのアクセスのみをチェック
    const path = req.nextUrl.pathname;
    if (!path.startsWith('/dashboard/corporate') && !path.startsWith('/api/corporate')) {
      return NextResponse.next();
    }

    // ユーザーのテナント情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        adminOfTenant: true,
        tenant: true,
      },
    });

    if (!user) {
      return NextResponse.next();
    }

    // テナント情報を取得（管理者または一般メンバーのいずれか）
    const tenant = user.adminOfTenant || user.tenant;

    // テナントがない場合はそのまま通過
    if (!tenant) {
      return NextResponse.next();
    }

    // テナントが一時停止中の場合は、特定のパスを除いてアクセスを制限
    if (tenant.accountStatus === 'suspended') {
      // 再アクティブ化APIとアカウント設定ページへのアクセスは許可
      if (
        path === '/api/corporate/settings/reactivate' ||
        path === '/dashboard/corporate/settings'
      ) {
        return NextResponse.next();
      }

      // それ以外の法人関連ページへのアクセスはブロック
      if (path.startsWith('/dashboard/corporate') || path.startsWith('/api/corporate')) {
        // アカウント設定ページにリダイレクト
        return NextResponse.redirect(new URL('/dashboard/corporate/settings', req.url));
      }
    }

    // 問題なければ次のミドルウェアへ
    return NextResponse.next();
  } catch (error) {
    console.error('テナントステータスチェックエラー:', error);
    // エラーが発生した場合は通過させる（安全サイド）
    return NextResponse.next();
  }
}