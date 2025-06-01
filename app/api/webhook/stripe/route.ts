// app/api/webhook/stripe/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/utils/logger";
import { stripe, PLANS } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
// Webhookハンドラー
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    logger.error('Webhook secret is not defined');
    return new Response('Webhook secret is not defined', { status: 500 });
  }
  let event: Stripe.Event;
  try {
    if (!stripe) {
      throw new Error('Stripe client not initialized');
    }
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '署名検証エラー';
    logger.error('Webhook signature verification failed:', errorMessage);
    return new Response(`Webhook Error: ${errorMessage}`, { status: 400 });
  }
  // イベントタイプに基づいて処理
  try {
    logger.debug(`Received Stripe webhook event: ${event.type}`);
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
      default:
        logger.debug(`未処理のイベントタイプ: ${event.type}`);
    }
    // 開発中は単純にイベントを記録
    logger.debug(`Webhook event processed: ${event.type}`);
    logger.debug(JSON.stringify(event.data.object, null, 2));
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    logger.error('Webhook処理エラー:', error);
    const errorMessage = error instanceof Error ? error.message : '処理エラー';
    return NextResponse.json(
      { error: `Webhook処理に失敗しました: ${errorMessage}` },
      { status: 500 },
    );
  }
}
// 実際の処理関数は、Prismaモデルが生成されてから有効化する
// ご利用プラン作成ハンドラー
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  // カスタマーIDからユーザーを検索
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });
  if (!user) {
    logger.error(`ユーザーが見つかりません: ${customerId}`);
    return;
  }
  // ご利用プラン情報をデータベースに保存/更新
  await prisma.subscription.upsert({
    where: { userId: user.id },
    update: {
      status: subscription.status,
      subscriptionId: subscription.id,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      priceId: subscription.items.data[0].price.id,
      plan: getPlanFromSubscription(subscription),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    },
    create: {
      userId: user.id,
      status: subscription.status,
      subscriptionId: subscription.id,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      priceId: subscription.items.data[0].price.id,
      plan: getPlanFromSubscription(subscription),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    },
  });
}
// ご利用プラン更新ハンドラー
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  // カスタマーIDからユーザーを検索
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });
  if (!user) {
    logger.error(`ユーザーが見つかりません: ${customerId}`);
    return;
  }
  // ご利用プラン情報を更新
  await prisma.subscription.update({
    where: { userId: user.id },
    data: {
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      priceId: subscription.items.data[0].price.id,
      plan: getPlanFromSubscription(subscription),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    },
  });
}
// ご利用プラン削除ハンドラー
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  // カスタマーIDからユーザーを検索
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });
  if (!user) {
    logger.error(`ユーザーが見つかりません: ${customerId}`);
    return;
  }
  // ご利用プランのステータスを更新
  await prisma.subscription.update({
    where: { userId: user.id },
    data: {
      status: 'canceled',
      canceledAt: new Date(),
    },
  });
}
// 請求支払い成功ハンドラー
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  // カスタマーIDからユーザーを検索
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });
  if (!user) {
    logger.error(`ユーザーが見つかりません: ${customerId}`);
    return;
  }
  // 請求情報をデータベースに保存
  await prisma.billingRecord.create({
    data: {
      userId: user.id,
      invoiceId: invoice.id,
      amount: invoice.amount_paid,
      status: 'paid',
      description: getInvoiceDescription(invoice),
      paidAt: new Date(),
    },
  });
}
// 請求支払い失敗ハンドラー
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  // カスタマーIDからユーザーを検索
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });
  if (!user) {
    logger.error(`ユーザーが見つかりません: ${customerId}`);
    return;
  }
  // 請求情報をデータベースに保存
  await prisma.billingRecord.create({
    data: {
      userId: user.id,
      invoiceId: invoice.id,
      amount: invoice.amount_due,
      status: 'failed',
      description: getInvoiceDescription(invoice),
      paidAt: null,
    },
  });
  // ユーザーへの通知などの処理を追加することも可能
}
// ヘルパー関数: ご利用プランからプラン種別を取得
function getPlanFromSubscription(subscription: Stripe.Subscription): string {
  const priceId = subscription.items.data[0].price.id;
  if (priceId === PLANS.MONTHLY.priceId) return 'monthly';
  if (priceId === PLANS.YEARLY.priceId) return 'yearly';
  if (priceId === PLANS.BUSINESS.priceId) return 'business';
  // プランを特定できない場合はご利用プランの課金間隔から推測
  const interval = subscription.items.data[0].price.recurring?.interval;
  if (interval === 'month') return 'monthly';
  if (interval === 'year') return 'yearly';
  return 'unknown';
}
// ヘルパー関数: 請求書から説明文を生成
function getInvoiceDescription(invoice: Stripe.Invoice): string {
  // 請求書の説明文を生成（日本語対応）
  const lines = invoice.lines.data;
  if (lines.length === 0) return '請求明細なし';
  const priceId = lines[0].price?.id;
  if (!priceId) return '請求明細';
  const plan = getPlanFromPrice(priceId);
  const planName = getPlanNameFromId(plan);
  return `${planName}の支払い`;
}
// ヘルパー関数: 価格IDからプラン種別を取得
function getPlanFromPrice(priceId: string): string {
  if (priceId === PLANS.MONTHLY.priceId) return 'monthly';
  if (priceId === PLANS.YEARLY.priceId) return 'yearly';
  if (priceId === PLANS.BUSINESS.priceId) return 'business';
  return 'unknown';
}
// ヘルパー関数: プランIDから表示名を取得
function getPlanNameFromId(planId: string): string {
  switch (planId) {
    case 'monthly':
      return '月額プラン';
    case 'yearly':
      return '年額プラン';
    case 'business':
      return 'ビジネスプラン';
    case 'enterprise':
      return 'エンタープライズプラン';
    default:
      return '不明なプラン';
  }
}
