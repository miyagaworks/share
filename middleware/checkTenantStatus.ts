// middleware/checkTenantStatus.ts
import { logger } from "@/lib/utils/logger";
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
/**
 * 法人テナントのステータスをチェックするミドルウェア
 * 一時停止中のテナントへのアクセスを制限する
 */
export async function checkTenantStatus(req: NextRequest) {
  try {
    const path = req.nextUrl.pathname;
    logger.debug('[checkTenantStatus] ミドルウェア開始、パス:', path);
    // 認証セッションの取得
    const session = await auth();
    logger.debug('[checkTenantStatus] 認証セッション:', session ? '取得済み' : 'なし');
    // 未認証の場合はそのまま通過（認証チェックは別のミドルウェアで行う）
    if (!session?.user?.id) {
      logger.debug('[checkTenantStatus] 未認証ユーザー - 通過');
      return NextResponse.next();
    }
    // ダッシュボード（特に法人関連パス）へのアクセスのみをチェック
    if (!path.startsWith('/dashboard/corporate') && !path.startsWith('/api/corporate')) {
      logger.debug('[checkTenantStatus] 法人関連パスではない - 通過');
      return NextResponse.next();
    }
    logger.debug('[checkTenantStatus] 法人関連パスへのアクセス - テナントチェック開始');
    // ユーザーのテナント情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        adminOfTenant: true,
        tenant: true,
      },
    });
    logger.debug('[checkTenantStatus] ユーザー情報取得:', user ? '成功' : '失敗');
    if (!user) {
      logger.debug('[checkTenantStatus] ユーザーが見つからない - 通過');
      return NextResponse.next();
    }
    // テナント情報を取得（管理者または一般メンバーのいずれか）
    const tenant = user.adminOfTenant || user.tenant;
    logger.debug(
      '[checkTenantStatus] テナント情報:',
      tenant
        ? `ID: ${tenant.id}, 名前: ${tenant.name}, ステータス: ${tenant.accountStatus}`
        : 'なし',
    );
    // テナントがない場合はそのまま通過
    if (!tenant) {
      logger.debug('[checkTenantStatus] テナントなし - 通過');
      return NextResponse.next();
    }
    // テナントが一時停止中の場合は、特定のパスを除いてアクセスを制限
    if (tenant.accountStatus === 'suspended') {
      logger.debug('[checkTenantStatus] テナントが一時停止中');
      // 再アクティブ化APIとアカウント設定ページへのアクセスは許可
      if (
        path === '/api/corporate/settings/reactivate' ||
        path === '/dashboard/corporate/settings'
      ) {
        logger.debug('[checkTenantStatus] 許可されたパス - 通過');
        return NextResponse.next();
      }
      // それ以外の法人関連ページへのアクセスはブロック
      if (path.startsWith('/dashboard/corporate') || path.startsWith('/api/corporate')) {
        logger.debug('[checkTenantStatus] アクセス制限 - 設定ページへリダイレクト');
        // アカウント設定ページにリダイレクト
        return NextResponse.redirect(new URL('/dashboard/corporate/settings', req.url));
      }
    }
    // 問題なければ次のミドルウェアへ
    logger.debug('[checkTenantStatus] テナントステータス問題なし - 通過');
    return NextResponse.next();
  } catch (error) {
    logger.error('[checkTenantStatus] エラー発生:', error);
    // エラーが発生した場合は通過させる（安全サイド）
    return NextResponse.next();
  }
}