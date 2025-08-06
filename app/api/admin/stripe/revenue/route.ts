// app/api/admin/stripe/revenue/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { checkAdminPermission } from '@/lib/utils/admin-access-server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import {
  fetchMonthlyRevenue,
  calculateRevenueSummary,
  analyzeRevenueByPlan,
} from '@/lib/stripe-revenue';

// 月次売上データの取得（GET）
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // 財務管理者権限以上をチェック
    const hasPermission = await checkAdminPermission(session.user.id, 'financial');
    if (!hasPermission) {
      return NextResponse.json({ error: '財務管理者権限が必要です' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());

    // 入力検証
    if (year < 2020 || year > 2030 || month < 1 || month > 12) {
      return NextResponse.json({ error: '無効な年月です' }, { status: 400 });
    }

    logger.info('月次売上データ取得:', {
      userId: session.user.id,
      year,
      month,
    });

    // 月次売上データを取得（Stripeから）
    const revenueData = await fetchMonthlyRevenue(year, month);
    const summary = calculateRevenueSummary(revenueData, {
      startDate: new Date(year, month - 1, 1),
      endDate: new Date(year, month, 0, 23, 59, 59),
    });
    const planAnalysis = analyzeRevenueByPlan(revenueData);

    // 既に保存済みのデータがあるかチェック
    const existingCount = await prisma.stripeTransaction.count({
      where: {
        transactionDate: {
          gte: new Date(year, month - 1, 1),
          lte: new Date(year, month, 0, 23, 59, 59),
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        period: { year, month },
        stripeData: {
          transactions: revenueData.slice(0, 10), // 最初の10件のみ表示
          summary,
          planAnalysis,
          totalCount: revenueData.length,
        },
        existingData: {
          count: existingCount,
          hasData: existingCount > 0,
        },
      },
    });
  } catch (error: any) {
    logger.error('月次売上データ取得エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: '月次売上データの取得に失敗しました',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}