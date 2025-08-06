// lib/profit-allocation.ts
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';

// 受託者情報の型定義
export interface ContractorInfo {
  id: string;
  name: string;
  email: string;
  defaultPercent: number; // 基本配分率（30%）
  currentPercent?: number; // 調整後配分率
}

// 利益配分計算結果の型定義
export interface ProfitAllocation {
  year: number;
  month: number;

  // 基本財務データ
  totalRevenue: number;
  totalFees: number;
  grossProfit: number; // 粗利益（売上 - 手数料）
  totalExpenses: number;
  netProfit: number; // 純利益（粗利益 - 経費）

  // 配分計算
  totalContractorShare: number; // 受託者配分総額（60%）
  companyShare: number; // 委託者配分（40%）

  // 個別受託者配分
  contractors: {
    yoshitsune: ContractorAllocation;
    kensei: ContractorAllocation;
  };

  // 調整情報
  hasAdjustments: boolean;
  adjustments: RevenueShareAdjustment[];

  // ステータス
  status: 'draft' | 'finalized' | 'paid';
  finalizedAt?: Date;
  paidAt?: Date;
}

// 個別受託者配分の型定義
export interface ContractorAllocation {
  contractorId: string;
  name: string;
  email: string;
  originalPercent: number; // 基本30%
  adjustedPercent: number; // 調整後配分率
  allocationAmount: number; // 配分金額
  expenseReimbursement: number; // 立替経費精算
  totalPayment: number; // 総支払額（配分 + 立替経費）
  adjustmentReason?: string; // 調整理由
}

// 調整申請の型定義
export interface RevenueShareAdjustment {
  id: string;
  year: number;
  month: number;
  adjustmentType: 'self_reduction' | 'admin_proposal' | 'peer_proposal';
  targetPerson: 'yoshitsune' | 'kensei';
  originalPercent: number;
  adjustedPercent: number;
  reason: string;
  proposedBy: string;
  approvedBy?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

// Prismaクエリ結果の型定義
interface PrismaRevenueShareAdjustment {
  id: string;
  year: number;
  month: number;
  adjustmentType: string;
  targetPerson: string;
  originalPercent: number;
  adjustedPercent: number;
  reason: string;
  proposedBy: string;
  approvedBy: string | null;
  status: string;
  createdAt: Date;
}

// 受託者の基本情報（実際のユーザーIDに置き換える）
const CONTRACTORS: Record<string, ContractorInfo> = {
  yoshitsune: {
    id: 'yoshitsune_user_id', // 実際のUser.idに置き換える
    name: '小河原義経',
    email: 'yoshitsune@sns-share.com',
    defaultPercent: 30.0,
  },
  kensei: {
    id: 'kensei_user_id', // 実際のUser.idに置き換える
    name: '福島健世',
    email: 'kensei@sns-share.com',
    defaultPercent: 30.0,
  },
};

/**
 * 指定月の利益配分を計算する
 */
export async function calculateProfitAllocation(
  year: number,
  month: number,
): Promise<ProfitAllocation> {
  try {
    logger.info('利益配分計算開始:', { year, month });

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // 1. 売上データの取得
    const revenueData = await prisma.stripeTransaction.aggregate({
      where: {
        transactionDate: { gte: startDate, lte: endDate },
        status: 'succeeded',
      },
      _sum: {
        amount: true,
        stripeFeeAmount: true,
        netAmount: true,
      },
    });

    // 2. 経費データの取得
    const expenseData = await prisma.financialRecord.aggregate({
      where: {
        recordDate: { gte: startDate, lte: endDate },
        type: 'expense',
        approvalStatus: { in: ['approved', 'auto_approved'] },
      },
      _sum: {
        amount: true,
      },
    });

    // 3. 受託者別立替経費の取得
    const yoshitsuneExpenses = await getContractorExpenses('yoshitsune', year, month);
    const kenseiExpenses = await getContractorExpenses('kensei', year, month);

    // 4. 配分調整の取得
    const adjustments = await getRevenueShareAdjustments(year, month);

    // 5. 基本財務計算
    const totalRevenue = Number(revenueData._sum.amount || 0);
    const totalFees = Number(revenueData._sum.stripeFeeAmount || 0);
    const grossProfit = totalRevenue - totalFees;
    const totalExpenses = Number(expenseData._sum.amount || 0);
    const netProfit = grossProfit - totalExpenses;

    // 6. 配分率の確定（調整を反映）
    const yoshitsunePercent = getAdjustedPercent('yoshitsune', adjustments);
    const kenseiPercent = getAdjustedPercent('kensei', adjustments);

    // 7. 配分金額の計算
    const totalContractorShare = netProfit * 0.6; // 60%
    const companyShare = netProfit - totalContractorShare; // 40%

    const yoshitsuneAllocation = (totalContractorShare * yoshitsunePercent) / 60; // 60%中の30%
    const kenseiAllocation = (totalContractorShare * kenseiPercent) / 60; // 60%中の30%

    // 8. 受託者別配分情報の作成
    const yoshitsuneData: ContractorAllocation = {
      contractorId: CONTRACTORS.yoshitsune.id,
      name: CONTRACTORS.yoshitsune.name,
      email: CONTRACTORS.yoshitsune.email,
      originalPercent: CONTRACTORS.yoshitsune.defaultPercent,
      adjustedPercent: yoshitsunePercent,
      allocationAmount: yoshitsuneAllocation,
      expenseReimbursement: yoshitsuneExpenses,
      totalPayment: yoshitsuneAllocation + yoshitsuneExpenses,
      adjustmentReason: getAdjustmentReason('yoshitsune', adjustments),
    };

    const kenseiData: ContractorAllocation = {
      contractorId: CONTRACTORS.kensei.id,
      name: CONTRACTORS.kensei.name,
      email: CONTRACTORS.kensei.email,
      originalPercent: CONTRACTORS.kensei.defaultPercent,
      adjustedPercent: kenseiPercent,
      allocationAmount: kenseiAllocation,
      expenseReimbursement: kenseiExpenses,
      totalPayment: kenseiAllocation + kenseiExpenses,
      adjustmentReason: getAdjustmentReason('kensei', adjustments),
    };

    // 9. 既存の精算レコードの確認
    const existingSettlement = await prisma.monthlySettlement.findUnique({
      where: { year_month: { year, month } },
    });

    const result: ProfitAllocation = {
      year,
      month,
      totalRevenue,
      totalFees,
      grossProfit,
      totalExpenses,
      netProfit,
      totalContractorShare,
      companyShare,
      contractors: {
        yoshitsune: yoshitsuneData,
        kensei: kenseiData,
      },
      hasAdjustments: adjustments.length > 0,
      adjustments,
      status: (existingSettlement?.status as 'draft' | 'finalized' | 'paid') || 'draft',
      finalizedAt: existingSettlement?.finalizedAt || undefined,
      paidAt: existingSettlement?.paidAt || undefined,
    };

    logger.info('利益配分計算完了:', {
      year,
      month,
      netProfit,
      totalContractorShare,
      yoshitsuneAmount: yoshitsuneAllocation,
      kenseiAmount: kenseiAllocation,
    });

    return result;
  } catch (error) {
    logger.error('利益配分計算エラー:', error);
    throw new Error(`利益配分の計算に失敗しました: ${error}`);
  }
}

/**
 * 受託者の立替経費を取得する
 */
async function getContractorExpenses(
  contractor: 'yoshitsune' | 'kensei',
  year: number,
  month: number,
): Promise<number> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  // 契約書第5条：受託者が立て替えた経費（5,000円以下の自由経費）
  const contractorId = CONTRACTORS[contractor].id;

  const expenseSum = await prisma.financialRecord.aggregate({
    where: {
      recordDate: { gte: startDate, lte: endDate },
      type: 'expense',
      contractorId: contractorId,
      approvalStatus: { in: ['approved', 'auto_approved'] },
    },
    _sum: {
      amount: true,
    },
  });

  return Number(expenseSum._sum.amount || 0);
}

/**
 * 配分調整情報を取得する
 */
async function getRevenueShareAdjustments(
  year: number,
  month: number,
): Promise<RevenueShareAdjustment[]> {
  const adjustments = await prisma.revenueShareAdjustment.findMany({
    where: {
      year,
      month,
      status: 'approved',
    },
    orderBy: { createdAt: 'desc' },
  });

  return adjustments.map((adj: PrismaRevenueShareAdjustment) => ({
    id: adj.id,
    year: adj.year,
    month: adj.month,
    adjustmentType: adj.adjustmentType as 'self_reduction' | 'admin_proposal' | 'peer_proposal',
    targetPerson: adj.targetPerson as 'yoshitsune' | 'kensei',
    originalPercent: adj.originalPercent,
    adjustedPercent: adj.adjustedPercent,
    reason: adj.reason,
    proposedBy: adj.proposedBy,
    approvedBy: adj.approvedBy || undefined,
    status: adj.status as 'pending' | 'approved' | 'rejected',
    createdAt: adj.createdAt,
  }));
}

/**
 * 調整後の配分率を取得する
 */
function getAdjustedPercent(
  contractor: 'yoshitsune' | 'kensei',
  adjustments: RevenueShareAdjustment[],
): number {
  const contractorAdjustment = adjustments.find((adj) => adj.targetPerson === contractor);
  if (contractorAdjustment) {
    return contractorAdjustment.adjustedPercent;
  }
  return CONTRACTORS[contractor].defaultPercent;
}

/**
 * 調整理由を取得する
 */
function getAdjustmentReason(
  contractor: 'yoshitsune' | 'kensei',
  adjustments: RevenueShareAdjustment[],
): string | undefined {
  const contractorAdjustment = adjustments.find((adj) => adj.targetPerson === contractor);
  return contractorAdjustment?.reason;
}

/**
 * 月次精算を確定する（委託者のみ実行可能）
 */
export async function finalizeMonthlySettlement(
  year: number,
  month: number,
  executorUserId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    // 利益配分を再計算
    const allocation = await calculateProfitAllocation(year, month);

    // MonthlySettlementレコードを作成/更新
    const settlement = await prisma.monthlySettlement.upsert({
      where: { year_month: { year, month } },
      update: {
        totalRevenue: Math.round(allocation.totalRevenue),
        totalExpenses: Math.round(allocation.totalExpenses),
        profit: Math.round(allocation.netProfit),
        contractorShare: Math.round(allocation.totalContractorShare),
        yoshitsuneShare: Math.round(allocation.contractors.yoshitsune.allocationAmount),
        yoshitsunePercent: allocation.contractors.yoshitsune.adjustedPercent,
        kenseiShare: Math.round(allocation.contractors.kensei.allocationAmount),
        kenseiPercent: allocation.contractors.kensei.adjustedPercent,
        status: 'finalized',
        finalizedBy: executorUserId,
        finalizedAt: new Date(),
      },
      create: {
        year,
        month,
        totalRevenue: Math.round(allocation.totalRevenue),
        totalExpenses: Math.round(allocation.totalExpenses),
        profit: Math.round(allocation.netProfit),
        contractorShare: Math.round(allocation.totalContractorShare),
        yoshitsuneShare: Math.round(allocation.contractors.yoshitsune.allocationAmount),
        yoshitsunePercent: allocation.contractors.yoshitsune.adjustedPercent,
        kenseiShare: Math.round(allocation.contractors.kensei.allocationAmount),
        kenseiPercent: allocation.contractors.kensei.adjustedPercent,
        status: 'finalized',
        finalizedBy: executorUserId,
        finalizedAt: new Date(),
      },
    });

    logger.info('月次精算確定完了:', {
      year,
      month,
      settlementId: settlement.id,
      executorUserId,
    });

    return {
      success: true,
      message: `${year}年${month}月の精算を確定しました`,
    };
  } catch (error) {
    logger.error('月次精算確定エラー:', error);
    return {
      success: false,
      message: '月次精算の確定に失敗しました',
    };
  }
}

/**
 * 支払い完了を記録する
 */
export async function recordPaymentCompletion(
  year: number,
  month: number,
  executorUserId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const settlement = await prisma.monthlySettlement.findUnique({
      where: { year_month: { year, month } },
    });

    if (!settlement) {
      return { success: false, message: '対象の精算レコードが見つかりません' };
    }

    if (settlement.status !== 'finalized') {
      return { success: false, message: '精算が確定されていません' };
    }

    await prisma.monthlySettlement.update({
      where: { year_month: { year, month } },
      data: {
        status: 'paid',
        paidAt: new Date(),
      },
    });

    logger.info('支払い完了記録:', { year, month, executorUserId });

    return {
      success: true,
      message: `${year}年${month}月の支払いを完了しました`,
    };
  } catch (error) {
    logger.error('支払い完了記録エラー:', error);
    return {
      success: false,
      message: '支払い完了の記録に失敗しました',
    };
  }
}