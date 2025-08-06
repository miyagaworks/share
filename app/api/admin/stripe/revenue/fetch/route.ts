// app/api/admin/stripe/revenue/fetch/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { checkAdminPermission } from '@/lib/utils/admin-access-server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import {
  fetchStripeRevenue,
  fetchMonthlyRevenue,
  calculateRevenueSummary,
  analyzeRevenueByPlan,
  type RevenueData,
} from '@/lib/stripe-revenue';

// 売上取得・保存（財務管理者権限以上必要）
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { startDate, endDate, preview = false } = body;

    // 日付検証
    if (!startDate || !endDate) {
      return NextResponse.json({ error: '開始日と終了日は必須です' }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return NextResponse.json(
        { error: '開始日は終了日より前である必要があります' },
        { status: 400 },
      );
    }

    // 過度に長い期間をチェック
    const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 365) {
      return NextResponse.json({ error: '取得期間は1年以内にしてください' }, { status: 400 });
    }

    logger.info('Stripe売上取得リクエスト:', {
      userId: session.user.id,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      preview,
    });

    // Stripeから売上データを取得
    const revenueData = await fetchStripeRevenue({ startDate: start, endDate: end });

    // サマリー計算
    const summary = calculateRevenueSummary(revenueData, { startDate: start, endDate: end });
    const planAnalysis = analyzeRevenueByPlan(revenueData);

    // プレビューモードの場合はデータベースに保存せずに返す
    if (preview) {
      logger.info('売上データプレビュー完了:', {
        transactionCount: revenueData.length,
        totalAmount: summary.totalAmount,
      });

      return NextResponse.json({
        success: true,
        preview: true,
        data: {
          transactions: revenueData.slice(0, 10), // プレビューは最初の10件のみ
          summary,
          planAnalysis,
          totalCount: revenueData.length,
        },
        message: `${revenueData.length}件の取引データを取得しました（プレビュー）`,
      });
    }

    // データベースに保存
    let savedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const revenue of revenueData) {
      try {
        // 既存データの重複チェック
        const existingTransaction = await prisma.stripeTransaction.findUnique({
          where: { stripePaymentId: revenue.stripePaymentId },
        });

        if (existingTransaction) {
          skippedCount++;
          continue;
        }

        // StripeTransactionレコードを作成
        const stripeTransaction = await prisma.$transaction(async (tx) => {
          // 1. StripeTransactionを作成
          const transaction = await tx.stripeTransaction.create({
            data: {
              stripePaymentId: revenue.stripePaymentId,
              stripeChargeId: revenue.stripeChargeId,
              stripeCustomerId: revenue.stripeCustomerId,
              amount: revenue.amount,
              currency: revenue.currency,
              description: revenue.description,
              customerEmail: revenue.customerEmail,
              stripeFeeAmount: revenue.stripeFeeAmount,
              stripeFeeRate: revenue.stripeFeeRate,
              netAmount: revenue.netAmount,
              transactionDate: revenue.transactionDate,
              subscriptionType: revenue.subscriptionType,
              planName: revenue.planName,
              status: revenue.status,
              stripeMetadata: revenue.stripeMetadata,
              webhookProcessed: true, // 手動取得のため処理済みとする
            },
          });

          // 2. 対応するFinancialRecordを作成
          const financialRecord = await tx.financialRecord.create({
            data: {
              recordType: 'stripe_revenue',
              title: revenue.description || `Stripe決済 - ${revenue.planName}`,
              description: `Stripe決済: ${revenue.customerEmail || '顧客'} - ${revenue.planName}`,
              amount: revenue.amount,
              category: 'revenue',
              recordDate: revenue.transactionDate,
              date: revenue.transactionDate, // 後方互換性
              type: 'revenue',
              sourceType: 'stripe',
              sourceId: revenue.stripePaymentId,
              isAutoImported: false, // 手動取得
              feeAmount: revenue.stripeFeeAmount,
              netAmount: revenue.netAmount,
              needsApproval: false, // 売上は承認不要
              approvalStatus: 'approved',
              createdBy: session.user.id,
              inputBy: session.user.id,
              approvedBy: session.user.id,
              approvedAt: new Date(),
            },
          });

          // 3. リレーションを更新
          await tx.stripeTransaction.update({
            where: { id: transaction.id },
            data: { financialRecordId: financialRecord.id },
          });

          return transaction;
        });

        savedCount++;

        logger.debug('売上データ保存成功:', {
          transactionId: revenue.transactionId,
          amount: revenue.amount,
          stripeTransactionId: stripeTransaction.id,
        });
      } catch (error) {
        logger.error('売上データ保存エラー:', {
          transactionId: revenue.transactionId,
          error: error instanceof Error ? error.message : String(error),
        });
        errors.push(
          `取引 ${revenue.transactionId}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    // 財務アクセスログを記録
    await prisma.financialAccessLog.create({
      data: {
        userId: session.user.id,
        action: 'create',
        entityType: 'stripe_revenue',
        details: {
          period: { startDate: start.toISOString(), endDate: end.toISOString() },
          savedCount,
          skippedCount,
          errorCount: errors.length,
          totalAmount: summary.totalAmount,
        },
      },
    });

    logger.info('Stripe売上取得・保存完了:', {
      userId: session.user.id,
      totalTransactions: revenueData.length,
      savedCount,
      skippedCount,
      errorCount: errors.length,
      totalAmount: summary.totalAmount,
    });

    return NextResponse.json({
      success: true,
      data: {
        summary,
        planAnalysis,
        processing: {
          totalTransactions: revenueData.length,
          savedCount,
          skippedCount,
          errorCount: errors.length,
        },
      },
      message: `売上データを正常に処理しました。保存: ${savedCount}件、スキップ: ${skippedCount}件`,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    logger.error('Stripe売上取得API エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Stripe売上データの取得に失敗しました',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}

// 月次売上データの簡単取得
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

    // 月次売上データを取得（プレビューのみ）
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
          transactions: revenueData.slice(0, 5), // 最初の5件のみ
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