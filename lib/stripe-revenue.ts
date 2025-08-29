// lib/stripe-revenue.ts
import { getStripeInstance } from '@/lib/stripe';
import { logger } from '@/lib/utils/logger';
import type Stripe from 'stripe';

// 売上データの型定義
export interface RevenueData {
  transactionId: string;
  amount: number; // 円
  currency: string;
  status: 'succeeded' | 'pending' | 'failed' | 'refunded';
  customerEmail?: string;
  description?: string;
  transactionDate: Date;

  // 手数料情報
  stripeFeeAmount: number;
  stripeFeeRate: number;
  netAmount: number;

  // プラン情報
  subscriptionType?: string;
  planName?: string;

  // Stripe生データ
  stripePaymentId: string;
  stripeChargeId?: string;
  stripeCustomerId?: string;
  stripeMetadata?: Record<string, any>;
}

// 期間指定の型
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// 売上サマリーの型
export interface RevenueSummary {
  totalAmount: number;
  totalFees: number;
  netAmount: number;
  transactionCount: number;
  averageAmount: number;
  feePercentage: number;
  period: DateRange;
}

/**
 * 指定期間のStripe決済データを取得する（修正版）
 * - 返金処理を除外
 * - ワンタップシール売上を除外
 * - サブスクリプション取引のみを抽出
 */
export async function fetchStripeRevenue(dateRange: DateRange): Promise<RevenueData[]> {
  try {
    const stripe = getStripeInstance();
    const { startDate, endDate } = dateRange;

    logger.info('Stripe売上データ取得開始:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    // Payment Intentsを取得（成功した決済のみ）
    const paymentIntents = await stripe.paymentIntents.list({
      created: {
        gte: Math.floor(startDate.getTime() / 1000),
        lte: Math.floor(endDate.getTime() / 1000),
      },
      limit: 100, // 必要に応じて調整
    });

    const revenueData: RevenueData[] = [];
    const excludedTransactions: string[] = []; // 除外した取引のログ

    for (const paymentIntent of paymentIntents.data) {
      // 成功した決済のみ処理
      if (paymentIntent.status !== 'succeeded') continue;

      // Charge情報を取得（手数料計算と返金チェックのため）
      const charges = await stripe.charges.list({
        payment_intent: paymentIntent.id,
        limit: 10,
      });

      const charge = charges.data[0];
      if (!charge) continue;

      // 🔥 返金処理の除外
      if (charge.refunded || (charge.amount_refunded && charge.amount_refunded > 0)) {
        excludedTransactions.push(`${paymentIntent.id}: 返金済み`);
        continue;
      }

      // 🔥 ワンタップシール関連取引の除外
      const metadata = paymentIntent.metadata || {};
      const description = paymentIntent.description || '';

      // ワンタップシール関連の識別
      const isOneTapSeal =
        metadata.product_type === 'one_tap_seal' ||
        metadata.order_type === 'one_tap_seal' ||
        description.toLowerCase().includes('ワンタップシール') ||
        description.toLowerCase().includes('one tap seal') ||
        description.toLowerCase().includes('touch seal') ||
        description.toLowerCase().includes('タッチシール') ||
        metadata.shipping_fee || // 送料が含まれている場合
        metadata.seal_quantity; // シール枚数が指定されている場合

      if (isOneTapSeal) {
        excludedTransactions.push(`${paymentIntent.id}: ワンタップシール関連`);
        continue;
      }

      // 🔥 サブスクリプション取引のみを抽出
      const subscriptionType = metadata.plan_id || metadata.subscription_type || 'unknown';

      // サブスクリプション関連のキーワードチェック
      const isSubscription =
        subscriptionType !== 'unknown' ||
        metadata.subscription_id ||
        description.toLowerCase().includes('月額') ||
        description.toLowerCase().includes('年額') ||
        description.toLowerCase().includes('プラン') ||
        description.toLowerCase().includes('subscription') ||
        description.toLowerCase().includes('monthly') ||
        description.toLowerCase().includes('yearly') ||
        description.toLowerCase().includes('個人プラン') ||
        description.toLowerCase().includes('法人') ||
        description.toLowerCase().includes('スタータープラン') ||
        description.toLowerCase().includes('ビジネスプラン') ||
        description.toLowerCase().includes('エンタープライズプラン');

      if (!isSubscription) {
        excludedTransactions.push(`${paymentIntent.id}: サブスクリプション以外の取引`);
        continue;
      }

      // 手数料計算
      const amount = paymentIntent.amount; // セント単位
      const amountInYen = amount; // 既に円で保存されている場合

      // Stripe手数料の計算（日本の場合: 3.6%）
      const stripeFeeRate = 0.036;
      const stripeFeeAmount = Math.round(amountInYen * stripeFeeRate);
      const netAmount = amountInYen - stripeFeeAmount;

      // プラン情報の取得（メタデータから）
      const planName = metadata.plan_name || getSubscriptionTypeName(subscriptionType);

      const revenueItem: RevenueData = {
        transactionId: paymentIntent.id,
        amount: amountInYen,
        currency: paymentIntent.currency || 'jpy',
        status: paymentIntent.status as 'succeeded',
        customerEmail: charge.billing_details?.email || undefined,
        description: paymentIntent.description || planName,
        transactionDate: new Date(paymentIntent.created * 1000),

        stripeFeeAmount,
        stripeFeeRate,
        netAmount,

        subscriptionType,
        planName,

        stripePaymentId: paymentIntent.id,
        stripeChargeId: charge.id,
        stripeCustomerId: charge.customer as string,
        stripeMetadata: metadata,
      };

      revenueData.push(revenueItem);
    }

    logger.info('Stripe売上データ取得完了:', {
      totalFetched: paymentIntents.data.length,
      validTransactions: revenueData.length,
      excludedCount: excludedTransactions.length,
      totalAmount: revenueData.reduce((sum, item) => sum + item.amount, 0),
    });

    // 除外した取引の詳細ログ（開発環境のみ）
    if (process.env.NODE_ENV === 'development' && excludedTransactions.length > 0) {
      logger.info('除外した取引:', { excludedTransactions: excludedTransactions.slice(0, 10) });
    }

    return revenueData;
  } catch (error) {
    logger.error('Stripe売上データ取得エラー:', error);
    throw new Error(`Stripe売上データの取得に失敗しました: ${error}`);
  }
}

/**
 * 月次売上データを取得する
 */
export async function fetchMonthlyRevenue(year: number, month: number): Promise<RevenueData[]> {
  const startDate = new Date(year, month - 1, 1); // 月の開始
  const endDate = new Date(year, month, 0, 23, 59, 59); // 月の終了

  return await fetchStripeRevenue({ startDate, endDate });
}

/**
 * 売上サマリーを計算する
 */
export function calculateRevenueSummary(
  revenueData: RevenueData[],
  period: DateRange,
): RevenueSummary {
  if (revenueData.length === 0) {
    return {
      totalAmount: 0,
      totalFees: 0,
      netAmount: 0,
      transactionCount: 0,
      averageAmount: 0,
      feePercentage: 0,
      period,
    };
  }

  const totalAmount = revenueData.reduce((sum, item) => sum + item.amount, 0);
  const totalFees = revenueData.reduce((sum, item) => sum + item.stripeFeeAmount, 0);
  const netAmount = totalAmount - totalFees;
  const transactionCount = revenueData.length;
  const averageAmount = totalAmount / transactionCount;
  const feePercentage = totalAmount > 0 ? (totalFees / totalAmount) * 100 : 0;

  return {
    totalAmount,
    totalFees,
    netAmount,
    transactionCount,
    averageAmount,
    feePercentage,
    period,
  };
}

/**
 * 売上データをプラン別に集計する
 */
export function groupRevenueByPlan(revenueData: RevenueData[]): Record<string, RevenueSummary> {
  const groupedData: Record<string, RevenueData[]> = {};

  // プラン別にグループ化
  for (const item of revenueData) {
    const planKey = item.subscriptionType || 'unknown';
    if (!groupedData[planKey]) {
      groupedData[planKey] = [];
    }
    groupedData[planKey].push(item);
  }

  // 各プランのサマリーを計算
  const result: Record<string, RevenueSummary> = {};
  for (const [planKey, planData] of Object.entries(groupedData)) {
    const startDate = new Date(Math.min(...planData.map((item) => item.transactionDate.getTime())));
    const endDate = new Date(Math.max(...planData.map((item) => item.transactionDate.getTime())));

    result[planKey] = calculateRevenueSummary(planData, { startDate, endDate });
  }

  return result;
}

/**
 * プラン別売上の詳細分析
 */
export function analyzeRevenueByPlan(revenueData: RevenueData[]) {
  const planAnalysis = groupRevenueByPlan(revenueData);

  return {
    planBreakdown: planAnalysis,
    totalRevenue: revenueData.reduce((sum, item) => sum + item.amount, 0),
    planCount: Object.keys(planAnalysis).length,
    topPlan:
      Object.entries(planAnalysis).sort(([, a], [, b]) => b.totalAmount - a.totalAmount)[0]?.[0] ||
      'none',
  };
}

/**
 * 成長率を計算する
 */
export function calculateGrowthRate(currentRevenue: number, previousRevenue: number): number {
  if (previousRevenue === 0) return currentRevenue > 0 ? 100 : 0;
  return ((currentRevenue - previousRevenue) / previousRevenue) * 100;
}

/**
 * MRR（月次経常収益）を計算する
 */
export function calculateMRR(revenueData: RevenueData[]): number {
  // 月次プランの売上のみを集計
  const monthlyRevenue = revenueData
    .filter(
      (item) =>
        item.subscriptionType?.includes('monthly') || item.subscriptionType?.includes('month'),
    )
    .reduce((sum, item) => sum + item.amount, 0);

  // 年次プランは12で割って月次換算
  const yearlyRevenue =
    revenueData
      .filter(
        (item) =>
          item.subscriptionType?.includes('yearly') || item.subscriptionType?.includes('year'),
      )
      .reduce((sum, item) => sum + item.amount, 0) / 12;

  return monthlyRevenue + yearlyRevenue;
}

/**
 * サブスクリプションタイプから表示名を取得
 */
function getSubscriptionTypeName(subscriptionType: string): string {
  const typeMap: Record<string, string> = {
    monthly: '個人プラン（月額）',
    yearly: '個人プラン（年額）',
    personal_monthly: '個人プラン（月額）',
    personal_yearly: '個人プラン（年額）',
    starter: '法人スタータープラン',
    starter_monthly: '法人スタータープラン（月額）',
    starter_yearly: '法人スタータープラン（年額）',
    business: '法人ビジネスプラン',
    business_monthly: '法人ビジネスプラン（月額）',
    business_yearly: '法人ビジネスプラン（年額）',
    enterprise: '法人エンタープライズプラン',
    enterprise_monthly: '法人エンタープライズプラン（月額）',
    enterprise_yearly: '法人エンタープライズプラン（年額）',
  };

  return typeMap[subscriptionType] || `サブスクリプションプラン（${subscriptionType}）`;
}

/**
 * 前年同月のデータと比較する
 */
export async function compareWithPreviousYear(year: number, month: number) {
  const currentYearData = await fetchMonthlyRevenue(year, month);
  const previousYearData = await fetchMonthlyRevenue(year - 1, month);

  const currentSummary = calculateRevenueSummary(currentYearData, {
    startDate: new Date(year, month - 1, 1),
    endDate: new Date(year, month, 0),
  });

  const previousSummary = calculateRevenueSummary(previousYearData, {
    startDate: new Date(year - 1, month - 1, 1),
    endDate: new Date(year - 1, month, 0),
  });

  return {
    current: currentSummary,
    previous: previousSummary,
    growth: {
      revenue: calculateGrowthRate(currentSummary.totalAmount, previousSummary.totalAmount),
      transactions: calculateGrowthRate(
        currentSummary.transactionCount,
        previousSummary.transactionCount,
      ),
      averageAmount: calculateGrowthRate(
        currentSummary.averageAmount,
        previousSummary.averageAmount,
      ),
    },
  };
}