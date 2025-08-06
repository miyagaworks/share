// app/api/webhook/stripe/route.ts (財務管理機能統合版)
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { stripe, getPlanInfoByPriceId, getStripeInstance } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import type { PrismaClient } from '@prisma/client';

// 🚀 Webhookハンドラー - 高速レスポンス + 財務管理対応
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('🚀 Stripe Webhook received at:', new Date().toISOString());

    const body = await req.text();
    const signature = req.headers.get('stripe-signature') as string;

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('❌ STRIPE_WEBHOOK_SECRET not defined');
      return new Response('Webhook secret not defined', { status: 200 }); // 200で返してリトライを停止
    }

    if (!signature) {
      console.error('❌ No Stripe signature');
      return new Response('No signature', { status: 200 }); // 200で返してリトライを停止
    }

    let event: Stripe.Event;
    try {
      if (!stripe) {
        throw new Error('Stripe client not initialized');
      }

      event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
      console.log('✅ Signature verified for event:', event.type);
    } catch (error) {
      console.error('❌ Signature verification failed:', error);
      return new Response('Invalid signature', { status: 400 });
    }

    // 🚀 重要：即座に200レスポンスを返す
    const responseTime = Date.now() - startTime;
    console.log(`⚡ Quick response sent in ${responseTime}ms for event: ${event.type}`);

    // 🔄 非同期でバックグラウンド処理を実行（レスポンス後）
    setImmediate(() => {
      processWebhookEventAsync(event).catch((error) => {
        console.error('💥 Background webhook processing failed:', error);
        logger.error('Background webhook processing error:', error);
      });
    });

    // Stripeに即座にレスポンスを返す
    return NextResponse.json(
      {
        received: true,
        eventType: event.type,
        responseTime: responseTime,
        status: 'processing_async',
        financialIntegration: true, // 財務連携有効フラグ
      },
      { status: 200 },
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('💥 Webhook fatal error:', error);

    // エラーでも200を返してリトライループを防ぐ
    return new Response(`Error handled: ${responseTime}ms`, { status: 200 });
  }
}

// 🔄 非同期バックグラウンド処理
async function processWebhookEventAsync(event: Stripe.Event) {
  const processingStart = Date.now();

  try {
    console.log(`🔄 Background processing started for: ${event.type}`);

    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      // 🆕 財務管理用イベント追加
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'charge.dispute.created':
        await handleChargeDispute(event.data.object as Stripe.Dispute);
        break;
      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    const processingTime = Date.now() - processingStart;
    console.log(`✅ Background processing completed for ${event.type} in ${processingTime}ms`);
  } catch (error) {
    const processingTime = Date.now() - processingStart;
    console.error(
      `💥 Background processing failed for ${event.type} after ${processingTime}ms:`,
      error,
    );

    // エラーの場合もログに記録して処理を続行
    logger.error(`Background processing error for ${event.type}:`, error);
  }
}

// 🔧 最適化されたサブスクリプション作成ハンドラー
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    console.log(
      `🆕 Processing subscription created: ${subscription.id} for customer: ${customerId}`,
    );

    // カスタマーIDからユーザーを検索
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      console.error(`❌ User not found for customer: ${customerId}`);
      return;
    }

    const priceId = subscription.items.data[0].price.id;
    const planInfo = getPlanInfoByPriceId(priceId);

    if (!planInfo) {
      console.error(`❌ Plan info not found for price: ${priceId}`);
      return;
    }

    console.log(`📋 Plan info: ${planInfo.planId}, corporate: ${planInfo.isCorporate}`);

    // サブスクリプション情報をデータベースに保存/更新
    const subscriptionData = {
      status: subscription.status,
      subscriptionId: subscription.id,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      priceId: priceId,
      plan: planInfo.interval === 'year' ? `${planInfo.planId}_yearly` : planInfo.planId,
      interval: planInfo.interval,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    };

    // 🚀 トランザクションで高速処理
    const result = await prisma.$transaction(async (tx: any) => {
      // サブスクリプション作成/更新
      const upsertedSubscription = await tx.subscription.upsert({
        where: { userId: user.id },
        update: subscriptionData,
        create: {
          userId: user.id,
          ...subscriptionData,
        },
      });

      // ユーザー状態更新
      await tx.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: 'active',
          trialEndsAt: null,
          corporateRole: planInfo.isCorporate ? 'admin' : null,
        },
      });

      return upsertedSubscription;
    });

    console.log(`✅ Subscription data saved for user: ${user.id}`);

    // 🏢 法人プランの場合は別途処理（エラーがあっても継続）
    if (planInfo.isCorporate) {
      try {
        await handleCorporateTenantCreation(user.id, result.id, planInfo);
      } catch (corporateError) {
        console.error('⚠️ Corporate tenant creation failed:', corporateError);
        // 法人テナント作成失敗してもサブスクリプション自体は有効
      }
    }

    console.log(`✅ Subscription creation completed for: ${subscription.id}`);
  } catch (error) {
    console.error('💥 Subscription creation failed:', error);
    throw error; // エラーをログに記録するため再スロー
  }
}

// 🏢 法人テナント作成を分離（エラー処理を独立）
async function handleCorporateTenantCreation(
  userId: string,
  subscriptionId: string,
  planInfo: any,
) {
  console.log('🏢 Creating corporate tenant...');

  // 既存テナントチェック
  const existingTenant = await prisma.corporateTenant.findUnique({
    where: { adminId: userId },
  });

  if (existingTenant) {
    console.log(`📝 Updating existing corporate tenant: ${existingTenant.id}`);
    await prisma.corporateTenant.update({
      where: { id: existingTenant.id },
      data: {
        subscriptionId: subscriptionId,
        maxUsers: planInfo.maxUsers || 10,
      },
    });
  } else {
    console.log('🆕 Creating new corporate tenant');
    const user = await prisma.user.findUnique({ where: { id: userId } });

    const newTenant = await prisma.corporateTenant.create({
      data: {
        name: user?.company || '',
        maxUsers: planInfo.maxUsers || 10,
        adminId: userId,
        subscriptionId: subscriptionId,
        users: { connect: [{ id: userId }] },
        primaryColor: '#3B82F6',
        secondaryColor: 'var(--color-corporate-secondary)',
      },
    });
    console.log(`✅ Corporate tenant created: ${newTenant.id}`);
  }
}

// 🔄 サブスクリプション更新ハンドラー
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    console.log(`🔄 Processing subscription updated: ${subscription.id}`);

    const customerId = subscription.customer as string;
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      console.error(`❌ User not found for customer: ${customerId}`);
      return;
    }

    const priceId = subscription.items.data[0].price.id;
    const planInfo = getPlanInfoByPriceId(priceId);

    if (!planInfo) {
      console.error(`❌ Plan info not found for price: ${priceId}`);
      return;
    }

    const subscriptionData = {
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      priceId: priceId,
      plan: planInfo.interval === 'year' ? `${planInfo.planId}_yearly` : planInfo.planId,
      interval: planInfo.interval,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    };

    await prisma.subscription.update({
      where: { userId: user.id },
      data: subscriptionData,
    });

    console.log(`✅ Subscription updated for user: ${user.id}`);
  } catch (error) {
    console.error('💥 Subscription update failed:', error);
  }
}

// 🗑️ サブスクリプション削除ハンドラー
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    console.log(`🗑️ Processing subscription deleted: ${subscription.id}`);

    const customerId = subscription.customer as string;
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      console.error(`❌ User not found for customer: ${customerId}`);
      return;
    }

    await prisma.$transaction(async (tx: any) => {
      // サブスクリプション状態更新
      await tx.subscription.update({
        where: { userId: user.id },
        data: {
          status: 'canceled',
          canceledAt: new Date(),
        },
      });

      // ユーザー状態更新
      await tx.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: 'canceled',
          corporateRole: null,
        },
      });
    });

    console.log(`✅ Subscription deletion processed for user: ${user.id}`);
  } catch (error) {
    console.error('💥 Subscription deletion failed:', error);
  }
}

// 💰 支払い成功ハンドラー（財務管理機能統合版）
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    console.log(`💰 Processing payment succeeded with financial integration: ${invoice.id}`);

    if (invoice.subscription) {
      const customerId = invoice.customer as string;
      const user = await prisma.user.findFirst({
        where: { stripeCustomerId: customerId },
      });

      if (user) {
        // 既存のユーザーステータス更新
        await prisma.user.update({
          where: { id: user.id },
          data: { subscriptionStatus: 'active' },
        });

        // 🆕 財務データの記録
        if (invoice.payment_intent) {
          try {
            await recordFinancialDataFromInvoice(invoice, user);
          } catch (financialError) {
            console.error('⚠️ Financial data recording failed:', financialError);
            // 財務データ記録失敗してもサブスクリプション処理は継続
          }
        }

        console.log(`✅ Payment success processed for user: ${user.id}`);
      }
    }
  } catch (error) {
    console.error('💥 Payment success handling failed:', error);
  }
}

// ❌ 支払い失敗ハンドラー
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    console.log(`❌ Processing payment failed: ${invoice.id}`);

    if (invoice.subscription) {
      const customerId = invoice.customer as string;
      const user = await prisma.user.findFirst({
        where: { stripeCustomerId: customerId },
      });

      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { subscriptionStatus: 'past_due' },
        });
        console.log(`⚠️ Payment failure processed for user: ${user.id}`);
      }
    }
  } catch (error) {
    console.error('💥 Payment failure handling failed:', error);
  }
}

// 🛒 チェックアウト完了ハンドラー
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    console.log(`🛒 Processing checkout completed: ${session.id}`);

    if (session.subscription && session.customer) {
      const customerId = session.customer as string;
      const user = await prisma.user.findFirst({
        where: { stripeCustomerId: customerId },
      });

      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { subscriptionStatus: 'active' },
        });
        console.log(`✅ Checkout completion processed for user: ${user.id}`);
      }
    }
  } catch (error) {
    console.error('💥 Checkout completion failed:', error);
  }
}

// 🆕 PaymentIntent成功ハンドラー（財務管理用）
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log(`💳 Processing PaymentIntent succeeded: ${paymentIntent.id}`);

    // 既存トランザクションチェック
    const existingTransaction = await prisma.stripeTransaction.findUnique({
      where: { stripePaymentId: paymentIntent.id },
    });

    if (existingTransaction) {
      console.log(`⚠️ Transaction already exists: ${paymentIntent.id}`);
      return;
    }

    // ユーザー検索
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: paymentIntent.customer as string },
    });

    if (!user) {
      console.log(`⚠️ User not found for PaymentIntent: ${paymentIntent.id}`);
      return;
    }

    // 財務データ記録
    await recordFinancialDataFromPaymentIntent(paymentIntent, user);

    console.log(`✅ PaymentIntent financial data recorded: ${paymentIntent.id}`);
  } catch (error) {
    console.error('💥 PaymentIntent processing failed:', error);
  }
}

// 🆕 チャージバック処理ハンドラー
async function handleChargeDispute(dispute: Stripe.Dispute) {
  try {
    console.log(`⚖️ Processing charge dispute: ${dispute.id}`);

    // 関連する取引を検索して更新
    const transaction = await prisma.stripeTransaction.findUnique({
      where: { stripeChargeId: dispute.charge as string },
    });

    if (transaction) {
      await prisma.stripeTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'disputed',
          refundReason: `チャージバック: ${dispute.reason}`,
        },
      });

      console.log(`✅ Dispute recorded for transaction: ${transaction.id}`);
    }
  } catch (error) {
    console.error('💥 Dispute processing failed:', error);
  }
}

// 💰 請求書から財務データを記録
async function recordFinancialDataFromInvoice(invoice: Stripe.Invoice, user: any) {
  try {
    console.log('💰 Recording financial data from invoice:', invoice.id);

    // PaymentIntentを取得
    const stripeClient = getStripeInstance();
    const paymentIntent = await stripeClient.paymentIntents.retrieve(
      invoice.payment_intent as string,
    );

    if (paymentIntent.status === 'succeeded') {
      await recordFinancialDataFromPaymentIntent(paymentIntent, user);
    }
  } catch (error) {
    console.error('❌ Failed to record financial data from invoice:', error);
    throw error; // 再スローしてエラーを上位で処理
  }
}

// 💳 PaymentIntentから財務データを記録
async function recordFinancialDataFromPaymentIntent(
  paymentIntent: Stripe.PaymentIntent,
  user: any,
) {
  try {
    console.log('💳 Recording financial data from PaymentIntent:', paymentIntent.id);

    // Charge情報取得（手数料計算用）
    const stripeClient = getStripeInstance();
    const charges = await stripeClient.charges.list({
      payment_intent: paymentIntent.id,
      limit: 1,
    });

    const charge = charges.data[0];
    if (!charge?.balance_transaction) {
      console.log('⚠️ No balance transaction found, skipping financial record');
      return;
    }

    // 手数料情報の取得
    const balanceTransaction = await stripeClient.balanceTransactions.retrieve(
      charge.balance_transaction as string,
    );

    const amount = paymentIntent.amount / 100; // センバーツを円に変換
    const feeAmount = balanceTransaction.fee / 100;
    const netAmount = balanceTransaction.net / 100;

    // プラン情報の推定
    const planInfo = extractPlanInfoFromPaymentIntent(paymentIntent);

    // 財務データをトランザクションで記録
    await prisma.$transaction(async (tx: any) => {
      // 1. StripeTransactionレコード作成
      const stripeTransaction = await tx.stripeTransaction.create({
        data: {
          stripePaymentId: paymentIntent.id,
          stripeChargeId: charge.id,
          stripeCustomerId: (paymentIntent.customer as string) || null,
          amount: amount,
          currency: paymentIntent.currency,
          description: paymentIntent.description || '定期支払い',
          customerEmail: charge.billing_details?.email || user.email,
          stripeFeeAmount: feeAmount,
          stripeFeeRate: amount > 0 ? feeAmount / amount : 0,
          netAmount: netAmount,
          transactionDate: new Date(paymentIntent.created * 1000),
          subscriptionType: planInfo.planId || 'unknown',
          planName: planInfo.displayName || null,
          status: 'succeeded',
          stripeMetadata: paymentIntent.metadata as any,
          webhookProcessed: true,
        },
      });

      // 2. FinancialRecordレコード作成（統合管理用）
      await tx.financialRecord.create({
        data: {
          recordType: 'stripe_revenue',
          title: `売上: ${paymentIntent.description || 'Stripe決済'}`,
          description: `プラン: ${planInfo.displayName || '不明'}`,
          amount: amount,
          category: planInfo.planId || 'subscription',
          recordDate: new Date(paymentIntent.created * 1000),
          sourceType: 'stripe',
          sourceId: paymentIntent.id,
          isAutoImported: true,
          feeAmount: feeAmount,
          netAmount: netAmount,
          inputBy: 'system', // システム自動記録
          createdBy: 'system',
          type: 'revenue',
          date: new Date(paymentIntent.created * 1000),
          needsApproval: false,
          approvalStatus: 'approved',
          financialRecordId: stripeTransaction.id,
        },
      });

      console.log('✅ Financial data recorded:', {
        transactionId: stripeTransaction.id,
        amount: amount,
        fees: feeAmount,
        net: netAmount,
      });
    });
  } catch (error) {
    console.error('❌ Failed to record financial data from PaymentIntent:', error);
    throw error;
  }
}

// プラン情報をPaymentIntentから推定
function extractPlanInfoFromPaymentIntent(paymentIntent: Stripe.PaymentIntent) {
  // メタデータから取得を試行
  if (paymentIntent.metadata?.subscription_type) {
    return {
      planId: paymentIntent.metadata.subscription_type,
      displayName: paymentIntent.metadata.plan_name || paymentIntent.metadata.subscription_type,
    };
  }

  // 説明文から推定
  const description = paymentIntent.description || '';
  const planPatterns = [
    { pattern: /個人.*月額/i, planId: 'monthly', displayName: '個人プラン（月額）' },
    { pattern: /個人.*年額/i, planId: 'yearly', displayName: '個人プラン（年額）' },
    { pattern: /法人.*スターター/i, planId: 'starter', displayName: '法人スタータープラン' },
    { pattern: /法人.*ビジネス/i, planId: 'business', displayName: '法人ビジネスプラン' },
    {
      pattern: /法人.*エンタープライズ/i,
      planId: 'enterprise',
      displayName: '法人エンタープライズプラン',
    },
  ];

  for (const { pattern, planId, displayName } of planPatterns) {
    if (pattern.test(description)) {
      return { planId, displayName };
    }
  }

  // 金額から推定（最後の手段）
  const amount = paymentIntent.amount / 100;
  if (amount === 500) return { planId: 'monthly', displayName: '個人プラン（月額）' };
  if (amount === 5000) return { planId: 'yearly', displayName: '個人プラン（年額）' };
  if (amount === 3000) return { planId: 'starter', displayName: '法人スタータープラン（月額）' };
  if (amount === 30000) return { planId: 'starter', displayName: '法人スタータープラン（年額）' };
  if (amount === 6000) return { planId: 'business', displayName: '法人ビジネスプラン（月額）' };
  if (amount === 60000) return { planId: 'business', displayName: '法人ビジネスプラン（年額）' };
  if (amount === 9000)
    return { planId: 'enterprise', displayName: '法人エンタープライズプラン（月額）' };
  if (amount === 90000)
    return { planId: 'enterprise', displayName: '法人エンタープライズプラン（年額）' };

  return { planId: 'unknown', displayName: '不明なプラン' };
}