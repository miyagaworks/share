// app/api/admin/access/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          isSuperAdmin: false,
          isFinancialAdmin: false,
          error: '認証されていません',
        },
        { status: 401 },
      );
    }

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        subscriptionStatus: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          isSuperAdmin: false,
          isFinancialAdmin: false,
          error: 'ユーザーが見つかりません',
        },
        { status: 404 },
      );
    }

    // 管理者メールアドレスリスト（拡張）
    const SUPER_ADMIN_EMAILS = ['admin@sns-share.com'];
    const FINANCIAL_ADMIN_EMAILS = [
      'admin@sns-share.com', // スーパーAdmin（全権限）
      'yoshitsune@sns-share.com', // 小河原義経（財務Admin）
      'kensei@sns-share.com', // 福島健世（財務Admin）
    ];

    const userEmail = user.email.toLowerCase();
    const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(userEmail);
    const isFinancialAdmin = FINANCIAL_ADMIN_EMAILS.includes(userEmail);

    // 永久利用権ユーザーは管理者になれない（メールベース管理者は除く）
    if (user.subscriptionStatus === 'permanent' && !isFinancialAdmin) {
      logger.debug('永久利用権ユーザーには管理者権限を付与しません:', {
        userId: session.user.id,
        email: session.user.email,
      });
      return NextResponse.json({
        isSuperAdmin: false,
        isFinancialAdmin: false,
        userId: session.user.id,
        email: session.user.email,
        message: '永久利用権ユーザーには管理者権限は付与されません',
      });
    }

    // 管理者チェック - メールアドレスまたはステータスで判定
    const hasAdminStatus = user.subscriptionStatus === 'admin';
    const finalIsSuperAdmin =
      isSuperAdmin || (hasAdminStatus && userEmail === 'admin@sns-share.com');
    const finalIsFinancialAdmin = isFinancialAdmin || hasAdminStatus;

    logger.debug('管理者チェック結果:', {
      userId: session.user.id,
      email: session.user.email,
      isSuperAdmin: finalIsSuperAdmin,
      isFinancialAdmin: finalIsFinancialAdmin,
    });

    return NextResponse.json({
      isSuperAdmin: finalIsSuperAdmin,
      isFinancialAdmin: finalIsFinancialAdmin,
      userId: session.user.id,
      email: session.user.email,
      userType: finalIsSuperAdmin
        ? 'super_admin'
        : finalIsFinancialAdmin
          ? 'financial_admin'
          : 'user',
      message: finalIsFinancialAdmin ? '管理者権限が確認されました' : '管理者権限がありません',
    });
  } catch (error) {
    logger.error('管理者アクセスチェックエラー:', error);
    return NextResponse.json(
      {
        isSuperAdmin: false,
        isFinancialAdmin: false,
        error: '管理者アクセスチェック中にエラーが発生しました',
      },
      { status: 500 },
    );
  }
}