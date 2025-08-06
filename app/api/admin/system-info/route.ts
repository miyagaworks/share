// app/api/admin/system-info/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { checkAdminPermission } from '@/lib/utils/admin-access-server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import { readFile } from 'fs/promises';
import { join } from 'path';

// システム情報取得（スーパー管理者のみ）
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // スーパー管理者権限をチェック
    const hasPermission = await checkAdminPermission(session.user.id, 'super');
    if (!hasPermission) {
      return NextResponse.json({ error: 'スーパー管理者権限が必要です' }, { status: 403 });
    }

    // システム統計データとバージョン情報を並列取得
    const [
      totalUsers,
      activeSubscriptions,
      pendingRequests,
      trialUsers,
      corporateUsers,
      permanentUsers,
      pendingExpenses,
      packageJson,
    ] = await Promise.all([
      // 総ユーザー数
      prisma.user.count(),

      // アクティブなサブスクリプション数
      prisma.user.count({
        where: {
          subscriptionStatus: {
            in: ['active', 'trialing'],
          },
        },
      }),

      // 未処理の解約申請数 (正しいフィールド名に修正)
      prisma.cancelRequest.count(),

      // トライアル中のユーザー数
      prisma.user.count({
        where: {
          subscriptionStatus: 'trialing',
        },
      }),

      // 法人ユーザー数 (スーパー管理者権限のみで簡単なカウント)
      prisma.user.count({
        where: {
          tenantId: { not: null }, // テナントに所属しているユーザー
        },
      }),

      // 永久利用権ユーザー数
      prisma.user.count({
        where: {
          subscriptionStatus: 'permanent',
        },
      }),

      // 承認待ち経費数 (正しいテーブル名・フィールド名に修正)
      prisma.companyExpense.count({
        where: {
          approvalStatus: 'pending',
        },
      }),

      // package.jsonからバージョン情報を取得
      readFile(join(process.cwd(), 'package.json'), 'utf8').then((data) => JSON.parse(data)),
    ]);

    // 統合システム情報
    const systemInfo = {
      // ユーザー統計
      totalUsers,
      activeSubscriptions,
      pendingRequests,
      trialUsers,
      corporateUsers,
      permanentUsers,
      pendingExpenses,

      // システム情報
      version: packageJson.version,
      name: packageJson.name,
      nodeVersion: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV,

      // 更新時刻
      lastUpdate: new Date().toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      timestamp: new Date().toISOString(),
    };

    logger.info('システム情報取得成功:', {
      userId: session.user.id,
      email: session.user.email,
      ...systemInfo,
    });

    return NextResponse.json(systemInfo);
  } catch (error: any) {
    logger.error('システム情報取得エラー:', error);
    return NextResponse.json(
      {
        error: 'システム情報の取得に失敗しました',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}