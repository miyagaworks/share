// app/api/webhook/stripe/route.ts (正しい修正版 - トライアルユーザーも正常処理)
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import {
  stripe,
  getPlanInfoByPriceId,
  getStripeInstance,
  getPaymentLinkByPlan,
} from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

// 🚀 Webhookハンドラー - 高速レスポンス + 財務管理 + ワンタップシール対応
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    logger.info('Stripe Webhook received at:', new Date().toISOString());

    const body = await req.text();
    const signature = req.headers.get('stripe-signature') as string;

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      logger.error('STRIPE_WEBHOOK_SECRET not defined');
      return new Response('Webhook secret not defined', { status: 200 });
    }

    if (!signature) {
      logger.error('No Stripe signature');
      return new Response('No signature', { status: 200 });
    }

    let event: Stripe.Event;
    try {
      if (!stripe) {
        throw new Error('Stripe client not initialized');
      }

      event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
      logger.info('Signature verified for event:', event.type);
    } catch (error) {
      logger.error('Signature verification failed:', error);
      return new Response('Invalid signature', { status: 400 });
    }

    // 🚀 重要：即座に200レスポンスを返す
    const responseTime = Date.now() - startTime;
    logger.info(`Quick response sent in ${responseTime}ms for event: ${event.type}`);

    // 📄 非同期でバックグラウンド処理を実行（レスポンス後）
    setImmediate(() => {
      processWebhookEventAsync(event).catch((error) => {
        logger.error('Background webhook processing failed:', error);
      });
    });

    // Stripeに即座にレスポンスを返す
    return NextResponse.json(
      {
        received: true,
        eventType: event.type,
        responseTime: responseTime,
        status: 'processing_async',
        financialIntegration: true,
        oneTapSealSupport: true,
      },
      { status: 200 },
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('Webhook fatal error:', error);
    return new Response(`Error handled: ${responseTime}ms`, { status: 200 });
  }
}

// 📄 非同期バックグラウンド処理
async function processWebhookEventAsync(event: Stripe.Event) {
  const processingStart = Date.now();

  try {
    logger.info(`Background processing started for: ${event.type}`);

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
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'charge.dispute.created':
        await handleChargeDispute(event.data.object as Stripe.Dispute);
        break;
      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    const processingTime = Date.now() - processingStart;
    logger.info(`Background processing completed for ${event.type} in ${processingTime}ms`);
  } catch (error) {
    const processingTime = Date.now() - processingStart;
    logger.error(
      `Background processing failed for ${event.type} after ${processingTime}ms:`,
      error,
    );
  }
}

// 🔧 サブスクリプション作成ハンドラー
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    logger.info(`Processing subscription created: ${subscription.id} for customer: ${customerId}`);

    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      logger.error(`User not found for customer: ${customerId}`);
      return;
    }

    const priceId = subscription.items.data[0].price.id;
    const planInfo = getPlanInfoByPriceId(priceId);

    if (!planInfo) {
      logger.error(`Plan info not found for price: ${priceId}`);
      return;
    }

    logger.info(`Plan info: ${planInfo.planId}, corporate: ${planInfo.isCorporate}`);

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

    const result = await prisma.$transaction(async (tx: any) => {
      const upsertedSubscription = await tx.subscription.upsert({
        where: { userId: user.id },
        update: subscriptionData,
        create: {
          userId: user.id,
          ...subscriptionData,
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: 'active',
          trialEndsAt: null, // 有料プラン開始でトライアル終了
          corporateRole: planInfo.isCorporate ? 'admin' : null,
        },
      });

      return upsertedSubscription;
    });

    if (planInfo.isCorporate) {
      try {
        await handleCorporateTenantCreation(user.id, result.id, planInfo);
      } catch (corporateError) {
        logger.warn('Corporate tenant creation failed:', corporateError);
      }
    }

    logger.info(`Subscription creation completed for: ${subscription.id}`);
  } catch (error) {
    logger.error('Subscription creation failed:', error);
    throw error;
  }
}

// 🏢 法人テナント作成
async function handleCorporateTenantCreation(
  userId: string,
  subscriptionId: string,
  planInfo: any,
) {
  logger.info('Creating corporate tenant...');

  const existingTenant = await prisma.corporateTenant.findUnique({
    where: { adminId: userId },
  });

  if (existingTenant) {
    logger.info(`Updating existing corporate tenant: ${existingTenant.id}`);
    await prisma.corporateTenant.update({
      where: { id: existingTenant.id },
      data: {
        subscriptionId: subscriptionId,
        maxUsers: planInfo.maxUsers || 10,
      },
    });
  } else {
    logger.info('Creating new corporate tenant');
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
    logger.info(`Corporate tenant created: ${newTenant.id}`);
  }
}

// 📄 サブスクリプション更新ハンドラー
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    logger.info(`Processing subscription updated: ${subscription.id}`);

    const customerId = subscription.customer as string;
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      logger.error(`User not found for customer: ${customerId}`);
      return;
    }

    const priceId = subscription.items.data[0].price.id;
    const planInfo = getPlanInfoByPriceId(priceId);

    if (!planInfo) {
      logger.error(`Plan info not found for price: ${priceId}`);
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

    logger.info(`Subscription updated for user: ${user.id}`);
  } catch (error) {
    logger.error('Subscription update failed:', error);
  }
}

// 🗑️ サブスクリプション削除ハンドラー
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    logger.info(`Processing subscription deleted: ${subscription.id}`);

    const customerId = subscription.customer as string;
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      logger.error(`User not found for customer: ${customerId}`);
      return;
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.subscription.update({
        where: { userId: user.id },
        data: {
          status: 'canceled',
          canceledAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: 'canceled',
          corporateRole: null,
        },
      });
    });

    logger.info(`Subscription deletion processed for user: ${user.id}`);
  } catch (error) {
    logger.error('Subscription deletion failed:', error);
  }
}

// 💰 支払い成功ハンドラー
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    logger.info(`Processing payment succeeded: ${invoice.id}`);

    if (invoice.subscription) {
      const customerId = invoice.customer as string;
      const user = await prisma.user.findFirst({
        where: { stripeCustomerId: customerId },
      });

      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { subscriptionStatus: 'active' },
        });

        // 財務データの記録
        if (invoice.payment_intent) {
          try {
            await recordFinancialDataFromInvoice(invoice, user);
          } catch (financialError) {
            logger.warn('Financial data recording failed:', financialError);
          }
        }

        logger.info(`Payment success processed for user: ${user.id}`);
      }
    }
  } catch (error) {
    logger.error('Payment success handling failed:', error);
  }
}

// ❌ 支払い失敗ハンドラー
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    logger.info(`Processing payment failed: ${invoice.id}`);

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
        logger.warn(`Payment failure processed for user: ${user.id}`);
      }
    }
  } catch (error) {
    logger.error('Payment failure handling failed:', error);
  }
}

// 🛒 チェックアウト完了ハンドラー
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    logger.info(`Processing checkout completed: ${session.id}`);

    const customerId = session.customer as string;
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      logger.error(`User not found for customer: ${customerId}`);
      return;
    }

    // メタデータから決済タイプを確認
    const subscriptionType = session.metadata?.subscriptionType || 'standard';
    const hasOneTapSealOrder = session.metadata?.oneTapSealOrder === 'true';
    const plan = session.metadata?.plan;
    const interval = session.metadata?.interval || 'month';
    const isCorporate = session.metadata?.isCorporate === 'true';

    logger.info(`Checkout type: ${subscriptionType}, OneTapSeal: ${hasOneTapSealOrder}`);

    await prisma.$transaction(async (tx: any) => {
      // 🆕 ワンタップシール単独決済の場合
      if (subscriptionType === 'one_tap_seal_only') {
        logger.info('Processing OneTapSeal-only checkout');

        // ワンタップシール注文の状態更新
        const orderId = session.metadata?.orderId;
        if (orderId) {
          const order = await tx.oneTapSealOrder.findUnique({
            where: { id: orderId },
          });

          if (order) {
            await tx.oneTapSealOrder.update({
              where: { id: orderId },
              data: {
                status: 'paid',
                stripePaymentIntentId: session.payment_intent as string,
              },
            });

            logger.info(`OneTapSeal order updated to paid: ${orderId}`);
          } else {
            logger.warn(`OneTapSeal order not found: ${orderId}`);
          }
        }

        // ユーザー状態は更新しない（ワンタップシール単独購入のため）
        logger.info(`OneTapSeal-only checkout completed for user: ${user.id}`);
        return;
      }
      
      // 1. ユーザー状態更新
      await tx.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: 'active',
          trialEndsAt: null, // 有料プラン開始でトライアル終了
          corporateRole: isCorporate ? 'admin' : null,
        },
      });

      // 2. 一回限り決済の場合は、サブスクリプションを手動作成
      if (subscriptionType === 'plan_with_onetap' || !session.subscription) {
        logger.info('Creating subscription manually for one-time payment');

        // 既存のpendingサブスクリプションを検索・更新
        const existingSubscription = await tx.subscription.findFirst({
          where: {
            userId: user.id,
            subscriptionId: session.id, // Checkout Session IDで検索
            status: 'pending',
          },
        });

        if (existingSubscription) {
          // Stripeでサブスクリプションを作成
          let stripeSubscription = null;

          if (plan && stripe) {
            try {
              const planInfo = getPaymentLinkByPlan(plan, interval);

              if (planInfo && planInfo.priceId) {
                stripeSubscription = await stripe.subscriptions.create({
                  customer: customerId,
                  items: [{ price: planInfo.priceId }],
                  metadata: {
                    userId: user.id,
                    plan: plan,
                    interval: interval,
                    createdViaCheckout: 'true',
                  },
                });

                logger.info(`Stripe subscription created: ${stripeSubscription.id}`);
              }
            } catch (stripeError) {
              logger.error('Failed to create Stripe subscription:', stripeError);
            }
          }

          // ローカルサブスクリプション更新
          await tx.subscription.update({
            where: { id: existingSubscription.id },
            data: {
              status: 'active',
              subscriptionId: stripeSubscription?.id || `manual_${session.id}`,
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(
                Date.now() + (interval === 'year' ? 365 : 30) * 24 * 60 * 60 * 1000,
              ),
            },
          });

          logger.info(`Subscription updated: ${existingSubscription.id}`);
        }
      }
      // 3. 通常のサブスクリプション決済の場合
      else if (session.subscription) {
        await tx.subscription.updateMany({
          where: {
            userId: user.id,
            subscriptionId: session.id,
          },
          data: {
            status: 'active',
            subscriptionId: session.subscription as string,
          },
        });
      }

      // 4. ワンタップシール注文の状態更新
      if (hasOneTapSealOrder) {
        logger.info(`Processing OneTapSeal order for checkout: ${session.id}`);

        const oneTapSealOrder = await tx.oneTapSealOrder.findFirst({
          where: {
            userId: user.id,
            stripePaymentIntentId: session.id,
            status: 'pending',
          },
        });

        if (oneTapSealOrder) {
          await tx.oneTapSealOrder.update({
            where: { id: oneTapSealOrder.id },
            data: {
              status: 'paid',
              stripePaymentIntentId: session.payment_intent as string,
            },
          });

          logger.info(`OneTapSeal order updated to paid: ${oneTapSealOrder.id}`);
        } else {
          logger.warn(`OneTapSeal order not found for checkout: ${session.id}`);
        }
      }
    });

    logger.info(
      `Checkout completion processed for user: ${user.id}, Type: ${subscriptionType}, OneTapSeal: ${hasOneTapSealOrder}`,
    );
  } catch (error) {
    logger.error('Checkout completion failed:', error);
  }
}

// PaymentIntentサクセスハンドラー
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    logger.info(`Processing PaymentIntent succeeded: ${paymentIntent.id}`);

    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: paymentIntent.customer as string },
    });

    if (!user) {
      logger.info(`User not found for PaymentIntent: ${paymentIntent.id}`);
      return;
    }

    await prisma.$transaction(async (tx: any) => {
      // 財務データ記録
      await recordFinancialDataFromPaymentIntent(paymentIntent, user, tx);

      // ワンタップシール注文の最終確認・更新
      const oneTapSealOrder = await tx.oneTapSealOrder.findFirst({
        where: {
          userId: user.id,
          stripePaymentIntentId: paymentIntent.id,
          status: 'paid',
        },
      });

      if (oneTapSealOrder) {
        logger.info(`Confirmed OneTapSeal order payment: ${oneTapSealOrder.id}`);

        await tx.oneTapSealOrder.update({
          where: { id: oneTapSealOrder.id },
          data: {
            status: 'preparing',
          },
        });

        logger.info(`OneTapSeal order status updated to preparing: ${oneTapSealOrder.id}`);
      }
    });

    logger.info(`PaymentIntent financial data recorded: ${paymentIntent.id}`);
  } catch (error) {
    logger.error('PaymentIntent processing failed:', error);
  }
}

// チャージバック処理ハンドラー
async function handleChargeDispute(dispute: Stripe.Dispute) {
  try {
    logger.info(`Processing charge dispute: ${dispute.id}`);

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

      logger.info(`Dispute recorded for transaction: ${transaction.id}`);
    }
  } catch (error) {
    logger.error('Dispute processing failed:', error);
  }
}

// 💰 請求書から財務データを記録
async function recordFinancialDataFromInvoice(invoice: Stripe.Invoice, user: any) {
  try {
    logger.info('Recording financial data from invoice:', invoice.id);

    const stripeClient = getStripeInstance();
    const paymentIntent = await stripeClient.paymentIntents.retrieve(
      invoice.payment_intent as string,
    );

    if (paymentIntent.status === 'succeeded') {
      await recordFinancialDataFromPaymentIntent(paymentIntent, user);
    }
  } catch (error) {
    logger.error('Failed to record financial data from invoice:', error);
    throw error;
  }
}

// 💳 PaymentIntentから財務データを記録（ワンタップシール対応）
async function recordFinancialDataFromPaymentIntent(
  paymentIntent: Stripe.PaymentIntent,
  user: any,
  tx?: any,
) {
  try {
    logger.info('Recording financial data from PaymentIntent:', paymentIntent.id);

    const stripeClient = getStripeInstance();
    const charges = await stripeClient.charges.list({
      payment_intent: paymentIntent.id,
      limit: 1,
    });

    const charge = charges.data[0];
    if (!charge?.balance_transaction) {
      logger.info('No balance transaction found, skipping financial record');
      return;
    }

    const balanceTransaction = await stripeClient.balanceTransactions.retrieve(
      charge.balance_transaction as string,
    );

    const amount = paymentIntent.amount / 100;
    const feeAmount = balanceTransaction.fee / 100;
    const netAmount = balanceTransaction.net / 100;

    // ワンタップシール注文情報の確認
    const isOneTapSealOrder = paymentIntent.metadata?.orderType === 'one_tap_seal';
    const planInfo = extractPlanInfoFromPaymentIntent(paymentIntent);

    const transactionProcessor = tx || prisma;

    // 財務データをトランザクションで記録
    const financialOperation = async (transaction: any) => {
      // 1. StripeTransactionレコード作成
      const stripeTransaction = await transaction.stripeTransaction.create({
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
      await transaction.financialRecord.create({
        data: {
          recordType: isOneTapSealOrder ? 'one_tap_seal_revenue' : 'stripe_revenue',
          title: `売上: ${paymentIntent.description || 'Stripe決済'}`,
          description: `プラン: ${planInfo.displayName || '不明'}${isOneTapSealOrder ? ' + ワンタップシール' : ''}`,
          amount: amount,
          category: planInfo.planId || 'subscription',
          recordDate: new Date(paymentIntent.created * 1000),
          sourceType: 'stripe',
          sourceId: paymentIntent.id,
          isAutoImported: true,
          feeAmount: feeAmount,
          netAmount: netAmount,
          inputBy: 'system',
          createdBy: 'system',
          type: 'revenue',
          date: new Date(paymentIntent.created * 1000),
          needsApproval: false,
          approvalStatus: 'approved',
          financialRecordId: stripeTransaction.id,
        },
      });

      logger.info('Financial data recorded:', {
        transactionId: stripeTransaction.id,
        amount: amount,
        fees: feeAmount,
        net: netAmount,
        isOneTapSeal: isOneTapSealOrder,
      });
    };

    if (tx) {
      await financialOperation(tx);
    } else {
      await prisma.$transaction(financialOperation);
    }
  } catch (error) {
    logger.error('Failed to record financial data from PaymentIntent:', error);
    throw error;
  }
}

// プラン情報をPaymentIntentから推定（ワンタップシール+プラン同時決済対応）
function extractPlanInfoFromPaymentIntent(paymentIntent: Stripe.PaymentIntent) {
  // メタデータから取得を試行
  if (paymentIntent.metadata?.subscription_type) {
    return {
      planId: paymentIntent.metadata.subscription_type,
      displayName: paymentIntent.metadata.plan_name || paymentIntent.metadata.subscription_type,
    };
  }

  // 同時決済の場合のメタデータ処理
  if (paymentIntent.metadata?.subscriptionType === 'plan_with_onetap') {
    const plan = paymentIntent.metadata.plan;
    const interval = paymentIntent.metadata.interval || 'month';

    return {
      planId: plan || 'unknown',
      displayName: `${plan}プラン（${interval === 'year' ? '年額' : '月額'}）+ ワンタップシール`,
    };
  }

  // ワンタップシール注文の場合
  if (paymentIntent.metadata?.orderType === 'one_tap_seal') {
    return {
      planId: 'one_tap_seal',
      displayName: 'ワンタップシール注文',
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
    { pattern: /ワンタップシール/i, planId: 'one_tap_seal', displayName: 'ワンタップシール注文' },
  ];

  for (const { pattern, planId, displayName } of planPatterns) {
    if (pattern.test(description)) {
      return { planId, displayName };
    }
  }

  // 金額から推定（同時決済の場合の複合金額対応）
  const amount = paymentIntent.amount / 100;

  // 単体プラン金額
  if (amount === 550) return { planId: 'monthly', displayName: '個人プラン（月額）' };
  if (amount === 5500) return { planId: 'yearly', displayName: '個人プラン（年額）' };
  if (amount === 3300) return { planId: 'starter', displayName: '法人スタータープラン（月額）' };
  if (amount === 33000) return { planId: 'starter', displayName: '法人スタータープラン（年額）' };
  if (amount === 6600) return { planId: 'business', displayName: '法人ビジネスプラン（月額）' };
  if (amount === 66000) return { planId: 'business', displayName: '法人ビジネスプラン（年額）' };
  if (amount === 9900)
    return { planId: 'enterprise', displayName: '法人エンタープライズプラン（月額）' };
  if (amount === 99000)
    return { planId: 'enterprise', displayName: '法人エンタープライズプラン（年額）' };

  // ワンタップシール単体価格帯の推定
  if (amount >= 735 && amount <= 5685) {
    return { planId: 'one_tap_seal', displayName: 'ワンタップシール注文' };
  }

  // プラン+ワンタップシール組み合わせの推定
  if (amount >= 1285 && amount <= 6235) {
    const sealAmount = amount - 550;
    if (sealAmount >= 735 && sealAmount <= 5685) {
      return { planId: 'monthly_with_seal', displayName: '個人プラン（月額）+ ワンタップシール' };
    }
  }

  if (amount >= 6235 && amount <= 11185) {
    const sealAmount = amount - 5500;
    if (sealAmount >= 735 && sealAmount <= 5685) {
      return { planId: 'yearly_with_seal', displayName: '個人プラン（年額）+ ワンタップシール' };
    }
  }

  if (amount >= 4035 && amount <= 8985) {
    const sealAmount = amount - 3300;
    if (sealAmount >= 735 && sealAmount <= 5685) {
      return {
        planId: 'starter_with_seal',
        displayName: '法人スタータープラン（月額）+ ワンタップシール',
      };
    }
  }

  return { planId: 'unknown', displayName: '不明なプラン' };
}