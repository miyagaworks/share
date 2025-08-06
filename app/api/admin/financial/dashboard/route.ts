// app/api/admin/financial/dashboard/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { checkAdminPermission } from '@/lib/utils/admin-access-server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';

// 財務ダッシュボードデータ取得（財務管理者権限以上必要）
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

    // 現在月のデータ取得
    const currentMonth = await getCurrentMonthFinancialData(year, month);

    // 最近の取引データ取得
    const recentTransactions = await getRecentTransactions();

    // 承認待ちデータ取得
    const pendingApprovals = await getPendingApprovals();

    // アラート生成
    const alerts = generateFinancialAlerts(currentMonth);

    logger.info('財務ダッシュボードデータ取得成功:', {
      userId: session.user.id,
      year,
      month,
    });

    return NextResponse.json({
      currentMonth,
      recentTransactions,
      pendingApprovals,
      alerts,
      period: { year, month },
    });
  } catch (error: any) {
    logger.error('財務ダッシュボードAPI エラー:', error);
    return NextResponse.json(
      {
        error: '財務ダッシュボードデータの取得に失敗しました',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}

// 当月の財務データ取得
async function getCurrentMonthFinancialData(year: number, month: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  const previousMonth = month === 1 ? 12 : month - 1;
  const previousYear = month === 1 ? year - 1 : year;

  // 当月のStripe取引データ
  const currentRevenue = await prisma.stripeTransaction.aggregate({
    where: {
      transactionDate: { gte: startDate, lte: endDate },
      status: 'succeeded',
    },
    _sum: {
      amount: true,
      stripeFeeAmount: true,
      netAmount: true,
    },
    _count: true,
    _avg: {
      amount: true,
    },
  });

  // 前月比較用データ
  const previousStartDate = new Date(previousYear, previousMonth - 1, 1);
  const previousEndDate = new Date(previousYear, previousMonth, 0, 23, 59, 59);

  const previousRevenue = await prisma.stripeTransaction.aggregate({
    where: {
      transactionDate: { gte: previousStartDate, lte: previousEndDate },
      status: 'succeeded',
    },
    _sum: {
      amount: true,
    },
  });

  // 経費データ
  const expenses = await prisma.financialRecord.aggregate({
    where: {
      recordDate: { gte: startDate, lte: endDate },
      type: 'expense',
      approvalStatus: 'approved',
    },
    _sum: {
      amount: true,
    },
  });

  // 委託者経費・受託者経費の分離
  const companyExpenses = await prisma.financialRecord.aggregate({
    where: {
      recordDate: { gte: startDate, lte: endDate },
      type: 'expense',
      approvalStatus: 'approved',
      contractorId: null,
    },
    _sum: {
      amount: true,
    },
  });

  const contractorExpenses = await prisma.financialRecord.aggregate({
    where: {
      recordDate: { gte: startDate, lte: endDate },
      type: 'expense',
      approvalStatus: 'approved',
      contractorId: { not: null },
    },
    _sum: {
      amount: true,
    },
  });

  // 計算
  const totalRevenue = Number(currentRevenue._sum.amount || 0);
  const totalFees = Number(currentRevenue._sum.stripeFeeAmount || 0);
  const totalExpenses = Number(expenses._sum.amount || 0);
  const companyExpenseAmount = Number(companyExpenses._sum.amount || 0);
  const contractorExpenseAmount = Number(contractorExpenses._sum.amount || 0);

  const grossProfit = totalRevenue - totalFees;
  const netProfit = grossProfit - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // 受託者分配（純利益の30%として計算）
  const totalAllocations = netProfit * 0.3;
  const remainingProfit = netProfit - totalAllocations;

  // 前月比成長率
  const previousRevenueAmount = Number(previousRevenue._sum.amount || 0);
  const growthRate =
    previousRevenueAmount > 0
      ? ((totalRevenue - previousRevenueAmount) / previousRevenueAmount) * 100
      : 0;

  return {
    revenue: {
      total: totalRevenue,
      growth: growthRate,
      transactionCount: currentRevenue._count,
      averageAmount: Number(currentRevenue._avg.amount || 0),
    },
    fees: {
      total: totalFees,
      percentage: totalRevenue > 0 ? (totalFees / totalRevenue) * 100 : 0,
    },
    expenses: {
      company: companyExpenseAmount,
      contractors: contractorExpenseAmount,
      total: totalExpenses,
    },
    profit: {
      gross: grossProfit,
      net: netProfit,
      margin: profitMargin,
    },
    allocations: {
      total: totalAllocations,
      remaining: remainingProfit,
    },
  };
}

// 最近の取引データ取得
async function getRecentTransactions() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Stripe売上取引
  const revenueTransactions = await prisma.stripeTransaction.findMany({
    where: {
      transactionDate: { gte: thirtyDaysAgo },
      status: 'succeeded',
    },
    select: {
      id: true,
      amount: true,
      description: true,
      transactionDate: true,
      subscriptionType: true,
    },
    orderBy: { transactionDate: 'desc' },
    take: 10,
  });

  // 経費取引
  const expenseTransactions = await prisma.financialRecord.findMany({
    where: {
      recordDate: { gte: thirtyDaysAgo },
      type: 'expense',
    },
    select: {
      id: true,
      amount: true,
      title: true,
      recordDate: true,
      category: true,
      approvalStatus: true,
      contractorId: true,
    },
    orderBy: { recordDate: 'desc' },
    take: 10,
  });

  // 統合してソート
  const combined = [
    ...revenueTransactions.map((t: any) => ({
      id: t.id,
      type: 'stripe_revenue' as const,
      title: t.description || 'Stripe決済',
      amount: Number(t.amount),
      date: t.transactionDate.toISOString(),
      status: 'completed',
    })),
    ...expenseTransactions.map((t: any) => ({
      id: t.id,
      type: t.contractorId ? ('contractor_expense' as const) : ('company_expense' as const),
      title: t.title,
      amount: Number(t.amount),
      date: t.recordDate.toISOString(),
      status: t.approvalStatus,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 15);

  return combined;
}

// 承認待ちデータ取得
async function getPendingApprovals() {
  const pendingExpenses = await prisma.financialRecord.count({
    where: {
      type: 'expense',
      approvalStatus: 'pending',
    },
  });

  const pendingCompanyExpenses = await prisma.financialRecord.count({
    where: {
      type: 'expense',
      approvalStatus: 'pending',
      contractorId: null,
    },
  });

  const pendingContractorExpenses = await prisma.financialRecord.count({
    where: {
      type: 'expense',
      approvalStatus: 'pending',
      contractorId: { not: null },
    },
  });

  return {
    companyExpenses: pendingCompanyExpenses,
    contractorExpenses: pendingContractorExpenses,
    profitAllocations: 0, // 今後実装予定
  };
}

// アラート生成
function generateFinancialAlerts(currentMonth: any) {
  const alerts = [];

  // 手数料率が高い場合のアラート
  if (currentMonth.fees.percentage > 4.0) {
    alerts.push({
      type: 'high_fees' as const,
      message: `Stripe手数料率が${currentMonth.fees.percentage.toFixed(1)}%と高くなっています`,
      severity: 'warning' as const,
      actionRequired: false,
    });
  }

  // 利益率が低い場合のアラート
  if (currentMonth.profit.margin < 10) {
    alerts.push({
      type: 'low_profit' as const,
      message: `利益率が${currentMonth.profit.margin.toFixed(1)}%と低くなっています`,
      severity: 'error' as const,
      actionRequired: true,
    });
  }

  // 大きな取引があった場合のアラート
  if (currentMonth.revenue.averageAmount > 50000) {
    alerts.push({
      type: 'large_transaction' as const,
      message: `平均取引額が${currentMonth.revenue.averageAmount.toLocaleString()}円と高額です`,
      severity: 'info' as const,
      actionRequired: false,
    });
  }

  return alerts;
}