// app/api/admin/monthly-settlement/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { checkAdminPermission, isSuperAdmin } from '@/lib/utils/admin-access-server';
import {
  calculateProfitAllocation,
  finalizeMonthlySettlement,
  recordPaymentCompletion,
} from '@/lib/profit-allocation';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';

// 型定義
interface SettlementActionRequest {
  year: number;
  month: number;
  action: 'finalize' | 'mark_paid';
}

// Prismaクエリ結果の型定義
interface PrismaMonthlySettlement {
  id: string;
  year: number;
  month: number;
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  contractorShare: number;
  yoshitsuneShare: number;
  yoshitsunePercent: number;
  kenseiShare: number;
  kenseiPercent: number;
  status: string;
  finalizedBy: string | null;
  finalizedAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  finalizer: {
    name: string | null;
    email: string;
  } | null;
}

interface FormattedSettlement {
  id: string;
  year: number;
  month: number;
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  contractorShare: number;
  yoshitsuneShare: number;
  yoshitsunePercent: number;
  kenseiShare: number;
  kenseiPercent: number;
  status: string;
  finalizedBy: string | null;
  finalizedAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  finalizer: {
    name: string | null;
    email: string;
  } | null;
}

// 月次精算データの取得
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

    // 利益配分を計算
    const allocation = await calculateProfitAllocation(year, month);

    // 関連する調整申請も取得
    const pendingAdjustments = await prisma.revenueShareAdjustment.count({
      where: {
        year,
        month,
        status: 'pending',
      },
    });

    logger.info('月次精算データ取得:', {
      userId: session.user.id,
      year,
      month,
      netProfit: allocation.netProfit,
      status: allocation.status,
    });

    return NextResponse.json({
      success: true,
      data: {
        allocation,
        pendingAdjustments,
        canFinalize: allocation.status === 'draft' && pendingAdjustments === 0,
        canMarkPaid: allocation.status === 'finalized',
      },
    });
  } catch (error: any) {
    logger.error('月次精算データ取得エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: '月次精算データの取得に失敗しました',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}

// 月次精算の確定（スーパー管理者のみ）
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // スーパー管理者権限をチェック
    const isSuper = await isSuperAdmin(session.user.id);
    if (!isSuper) {
      return NextResponse.json(
        { error: '月次精算の確定にはスーパー管理者権限が必要です' },
        { status: 403 },
      );
    }

    const body: SettlementActionRequest = await request.json();
    const { year, month, action } = body;

    if (!year || !month || !action) {
      return NextResponse.json({ error: '年、月、アクションは必須です' }, { status: 400 });
    }

    if (!['finalize', 'mark_paid'].includes(action)) {
      return NextResponse.json(
        { error: 'アクションは finalize または mark_paid である必要があります' },
        { status: 400 },
      );
    }

    let result;

    if (action === 'finalize') {
      // 未処理の調整申請があるかチェック
      const pendingAdjustments = await prisma.revenueShareAdjustment.count({
        where: {
          year,
          month,
          status: 'pending',
        },
      });

      if (pendingAdjustments > 0) {
        return NextResponse.json(
          {
            error: `未処理の配分調整申請が${pendingAdjustments}件あります。先に処理してください。`,
          },
          { status: 400 },
        );
      }

      result = await finalizeMonthlySettlement(year, month, session.user.id);
    } else if (action === 'mark_paid') {
      result = await recordPaymentCompletion(year, month, session.user.id);
    }

    if (result?.success) {
      logger.info('月次精算アクション完了:', {
        userId: session.user.id,
        year,
        month,
        action,
        success: result.success,
      });

      return NextResponse.json({
        success: true,
        message: result.message,
      });
    } else {
      return NextResponse.json({ error: result?.message || '処理に失敗しました' }, { status: 400 });
    }
  } catch (error: any) {
    logger.error('月次精算処理エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: '月次精算の処理に失敗しました',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}

// 精算履歴の取得
export async function PUT(request: NextRequest) {
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
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 精算履歴を取得
    const settlements = await prisma.monthlySettlement.findMany({
      include: {
        finalizer: {
          select: { name: true, email: true },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: limit,
      skip: offset,
    });

    const totalCount = await prisma.monthlySettlement.count();

    // 型安全なマッピング
    const formattedSettlements: FormattedSettlement[] = settlements.map(
      (settlement: PrismaMonthlySettlement) => ({
        id: settlement.id,
        year: settlement.year,
        month: settlement.month,
        totalRevenue: Number(settlement.totalRevenue),
        totalExpenses: Number(settlement.totalExpenses),
        profit: Number(settlement.profit),
        contractorShare: Number(settlement.contractorShare),
        yoshitsuneShare: Number(settlement.yoshitsuneShare),
        yoshitsunePercent: settlement.yoshitsunePercent,
        kenseiShare: Number(settlement.kenseiShare),
        kenseiPercent: settlement.kenseiPercent,
        status: settlement.status,
        finalizedBy: settlement.finalizedBy,
        finalizedAt: settlement.finalizedAt,
        paidAt: settlement.paidAt,
        createdAt: settlement.createdAt,
        updatedAt: settlement.updatedAt,
        finalizer: settlement.finalizer
          ? {
              name: settlement.finalizer.name,
              email: settlement.finalizer.email,
            }
          : null,
      }),
    );

    return NextResponse.json({
      settlements: formattedSettlements,
      totalCount,
      hasMore: offset + limit < totalCount,
    });
  } catch (error: any) {
    logger.error('精算履歴取得エラー:', error);
    return NextResponse.json(
      {
        error: '精算履歴の取得に失敗しました',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}