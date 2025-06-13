// app/api/webhook/stripe/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { stripe, getPlanInfoByPriceId } from '@/lib/stripe';
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
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      default:
        logger.debug(`未処理のイベントタイプ: ${event.type}`);
    }

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

// 🔥 新規追加: Checkout Session完了ハンドラー（決済リンク用）
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  logger.info('Checkout session completed:', session.id);

  // カスタマーIDまたはカスタマー詳細からユーザーを特定
  const customerId = session.customer as string;
  const customerEmail = session.customer_details?.email;

  let user = null;

  // まずカスタマーIDでユーザーを検索
  if (customerId) {
    user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    });
  }

  // カスタマーIDで見つからない場合、メールアドレスで検索
  if (!user && customerEmail) {
    user = await prisma.user.findFirst({
      where: { email: customerEmail },
    });

    // ユーザーが見つかった場合、StripeカスタマーIDを更新
    if (user && customerId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }
  }

  if (!user) {
    logger.error(`ユーザーが見つかりません: customerId=${customerId}, email=${customerEmail}`);
    return;
  }

  // サブスクリプション情報を取得
  const subscriptionId = session.subscription as string;
  if (!subscriptionId) {
    logger.error('Subscription ID not found in checkout session');
    return;
  }

  const subscription = await stripe?.subscriptions.retrieve(subscriptionId);
  if (!subscription) {
    logger.error(`Subscription not found: ${subscriptionId}`);
    return;
  }

  // サブスクリプション作成処理を実行
  await handleSubscriptionCreated(subscription);
}

// ご利用プラン作成ハンドラー（CorporateTenant作成機能追加）
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

  const priceId = subscription.items.data[0].price.id;
  const planInfo = getPlanInfoByPriceId(priceId);

  if (!planInfo) {
    logger.error(`プラン情報が見つかりません: ${priceId}`);
    return;
  }

  logger.info(
    `プラン作成開始: userId=${user.id}, planId=${planInfo.planId}, isCorporate=${planInfo.isCorporate}`,
  );

  // ご利用プラン情報をデータベースに保存/更新
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

  const upsertedSubscription = await prisma.subscription.upsert({
    where: { userId: user.id },
    update: subscriptionData,
    create: {
      userId: user.id,
      ...subscriptionData,
    },
  });

  // ユーザーのサブスクリプション状態を更新
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: 'active',
      trialEndsAt: null, // トライアル終了
    },
  });

  // 🔥 法人プランの場合はCorporateTenantを作成
  if (planInfo.isCorporate) {
    logger.info('法人プラン検出 - CorporateTenant作成を開始');

    try {
      // 既に管理者として登録されているテナントがあるかチェック
      const existingTenant = await prisma.corporateTenant.findUnique({
        where: { adminId: user.id },
      });

      if (existingTenant) {
        logger.info(`既存のCorporateTenantが見つかりました: ${existingTenant.id}`);

        // 既存テナントのサブスクリプションIDを更新
        await prisma.corporateTenant.update({
          where: { id: existingTenant.id },
          data: {
            subscriptionId: upsertedSubscription.id,
            maxUsers: planInfo.maxUsers || 10,
          },
        });
      } else {
        // 新規CorporateTenantを作成
        const newTenant = await prisma.corporateTenant.create({
          data: {
            name: user.company || '', // 後でオンボーディングで設定
            maxUsers: planInfo.maxUsers || 10,
            adminId: user.id,
            subscriptionId: upsertedSubscription.id,
            users: { connect: [{ id: user.id }] },
            primaryColor: '#3B82F6',
            secondaryColor: 'var(--color-corporate-secondary)',
          },
        });

        logger.info(`新しいCorporateTenantを作成しました: ${newTenant.id}`);
      }

      // ユーザーに法人ロールを設定
      await prisma.user.update({
        where: { id: user.id },
        data: {
          corporateRole: 'admin',
        },
      });

      logger.info('法人プラン設定完了');
    } catch (error) {
      logger.error('CorporateTenant作成エラー:', error);
      // CorporateTenant作成に失敗してもサブスクリプション自体は有効にする
    }
  }

  logger.info('サブスクリプション作成処理完了');
}

// ご利用プラン更新ハンドラー
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    logger.error(`ユーザーが見つかりません: ${customerId}`);
    return;
  }

  const priceId = subscription.items.data[0].price.id;
  const planInfo = getPlanInfoByPriceId(priceId);

  // ご利用プラン情報を更新
  await prisma.subscription.update({
    where: { userId: user.id },
    data: {
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      priceId: priceId,
      plan: planInfo
        ? planInfo.interval === 'year'
          ? `${planInfo.planId}_yearly`
          : planInfo.planId
        : getPlanFromSubscription(subscription),
      interval:
        planInfo?.interval || (subscription.items.data[0].price.recurring?.interval as string),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    },
  });

  // 法人プランの場合、テナント情報も更新
  if (planInfo?.isCorporate) {
    const tenant = await prisma.corporateTenant.findUnique({
      where: { adminId: user.id },
    });

    if (tenant) {
      await prisma.corporateTenant.update({
        where: { id: tenant.id },
        data: {
          maxUsers: planInfo.maxUsers || 10,
        },
      });
    }
  }
}

// ご利用プラン削除ハンドラー
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

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

  // ユーザーのサブスクリプション状態も更新
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: 'canceled',
    },
  });
}

// 請求支払い成功ハンドラー
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

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
}

// ヘルパー関数: ご利用プランからプラン種別を取得（既存の関数）
function getPlanFromSubscription(subscription: Stripe.Subscription): string {
  const priceId = subscription.items.data[0].price.id;
  const planInfo = getPlanInfoByPriceId(priceId);

  if (planInfo) {
    return planInfo.interval === 'year' ? `${planInfo.planId}_yearly` : planInfo.planId;
  }

  // フォールバック: 既存のロジック
  const interval = subscription.items.data[0].price.recurring?.interval;
  if (interval === 'month') return 'monthly';
  if (interval === 'year') return 'yearly';
  return 'unknown';
}

// ヘルパー関数: 請求書から説明文を生成
function getInvoiceDescription(invoice: Stripe.Invoice): string {
  const lines = invoice.lines.data;
  if (lines.length === 0) return '請求明細なし';

  const priceId = lines[0].price?.id;
  if (!priceId) return '請求明細';

  const planInfo = getPlanInfoByPriceId(priceId);
  if (planInfo) {
    return `${planInfo.planId}プランの支払い`;
  }

  return '月額プランの支払い';
}