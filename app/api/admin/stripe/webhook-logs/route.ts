// app/api/admin/stripe/webhook-logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// Webhookログ取得API（GET）
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 権限チェック
    const accessResponse = await checkAdminAccess(session.user.id);
    if (!accessResponse.isFinancialAdmin && !accessResponse.isSuperAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // クエリパラメータ取得
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const eventType = searchParams.get('eventType');
    const status = searchParams.get('status');
    const offset = (page - 1) * limit;

    // フィルター条件構築
    const where: any = {};
    if (eventType) {
      where.eventType = eventType;
    }
    if (status) {
      where.processingStatus = status;
    }

    // Webhookログ取得
    const [logs, totalCount] = await Promise.all([
      prisma.stripeWebhookLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        select: {
          id: true,
          stripeEventId: true,
          eventType: true,
          processingStatus: true,
          processingResult: true,
          errorMessage: true,
          retryCount: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.stripeWebhookLog.count({ where }),
    ]);

    // 統計情報取得
    const stats = await prisma.stripeWebhookLog.groupBy({
      by: ['processingStatus'],
      _count: {
        id: true,
      },
    });

    const statusStats = stats.reduce(
      (acc: Record<string, number>, stat: any) => {
        acc[stat.processingStatus] = stat._count.id;
        return acc;
      },
      {} as Record<string, number>,
    );

    // イベントタイプ別統計
    const eventTypeStats = await prisma.stripeWebhookLog.groupBy({
      by: ['eventType'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    return NextResponse.json({
      logs: logs.map((log: any) => ({
        id: log.id,
        stripeEventId: log.stripeEventId,
        eventType: log.eventType,
        processingStatus: log.processingStatus,
        processingResult: log.processingResult,
        errorMessage: log.errorMessage,
        retryCount: log.retryCount,
        createdAt: log.createdAt.toISOString(),
        updatedAt: log.updatedAt.toISOString(),
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasMore: offset + limit < totalCount,
      },
      stats: {
        statusBreakdown: {
          processed: statusStats.processed || 0,
          failed: statusStats.failed || 0,
          pending: statusStats.pending || 0,
          skipped: statusStats.skipped || 0,
        },
        eventTypeBreakdown: eventTypeStats.map((stat: any) => ({
          eventType: stat.eventType,
          count: stat._count.id,
        })),
        totalLogs: totalCount,
      },
    });
  } catch (error: any) {
    console.error('💥 Webhookログ取得エラー:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch webhook logs' },
      { status: 500 },
    );
  }
}

// Webhookログリトライ処理（POST）
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 権限チェック
    const accessResponse = await checkAdminAccess(session.user.id);
    if (!accessResponse.isSuperAdmin) {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { logId, action } = body;

    if (action === 'retry') {
      // 失敗したWebhookログのリトライ処理
      const log = await prisma.stripeWebhookLog.findUnique({
        where: { id: logId },
      });

      if (!log) {
        return NextResponse.json({ error: 'Log not found' }, { status: 404 });
      }

      if (log.processingStatus !== 'failed') {
        return NextResponse.json({ error: 'Only failed logs can be retried' }, { status: 400 });
      }

      // リトライカウント更新
      await prisma.stripeWebhookLog.update({
        where: { id: logId },
        data: {
          processingStatus: 'pending',
          retryCount: log.retryCount + 1,
          errorMessage: null,
          updatedAt: new Date(),
        },
      });

      // 実際のリトライ処理は別途実装が必要
      // （イベントデータを再処理するロジック）

      return NextResponse.json({
        success: true,
        message: 'Retry queued successfully',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('💥 Webhookログ操作エラー:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process webhook log action' },
      { status: 500 },
    );
  }
}

// 権限チェック関数
async function checkAdminAccess(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      subscriptionStatus: true,
      isFinancialAdmin: true,
    },
  });

  const isAdmin = user?.email === 'admin@sns-share.com' || user?.subscriptionStatus === 'admin';
  const isFinancialAdmin = user?.isFinancialAdmin === true;

  return {
    isSuperAdmin: isAdmin,
    isFinancialAdmin: isAdmin || isFinancialAdmin,
  };
}