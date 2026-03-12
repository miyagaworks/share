// lib/stripe.ts (安全修正版 - 環境変数名のみ修正)
import Stripe from 'stripe';

// Stripe インスタンスの初期化
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    })
  : null;

// Stripe 利用可能性チェック
export function isStripeAvailable(): boolean {
  return !!(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}

// Stripe インスタンス取得（エラーハンドリング付き）
export function getStripeInstance(): Stripe {
  if (!stripe) {
    throw new Error('Stripe is not initialized');
  }
  return stripe;
}

// プラン価格ID定義（🔧 環境変数名を実際の設定に合わせて修正）
export const PLAN_PRICE_IDS = {
  // 個人プラン（修正済み）
  INDIVIDUAL_MONTHLY: process.env.STRIPE_MONTHLY_PRICE_ID!,
  INDIVIDUAL_YEARLY: process.env.STRIPE_YEARLY_PRICE_ID!,

  // 法人プラン（修正済み）
  STARTER_MONTHLY: process.env.STRIPE_STARTER_PRICE_ID!,
  STARTER_YEARLY: process.env.STRIPE_STARTER_YEARLY_PRICE_ID!,
  BUSINESS_MONTHLY: process.env.STRIPE_BUSINESS_PRICE_ID!,
  BUSINESS_YEARLY: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID!,
  ENTERPRISE_MONTHLY: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
  ENTERPRISE_YEARLY: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID!,

  // ワンタップシール関連
  ONE_TAP_SEAL: process.env.STRIPE_ONE_TAP_SEAL_PRICE_ID!,
  SHIPPING_FEE: process.env.STRIPE_SHIPPING_PRICE_ID!,
} as const;

// プラン情報定義
interface PlanInfo {
  planId: string;
  priceId: string;
  amount: number; // 円
  interval: 'month' | 'year';
  isCorporate: boolean;
  displayName: string;
  maxUsers?: number;
}

export const PLAN_CONFIGS: Record<string, PlanInfo> = {
  // 個人プラン
  monthly: {
    planId: 'monthly',
    priceId: PLAN_PRICE_IDS.INDIVIDUAL_MONTHLY,
    amount: 550,
    interval: 'month',
    isCorporate: false,
    displayName: '個人プラン（月額）',
  },
  yearly: {
    planId: 'yearly',
    priceId: PLAN_PRICE_IDS.INDIVIDUAL_YEARLY,
    amount: 5500,
    interval: 'year',
    isCorporate: false,
    displayName: '個人プラン（年額）',
  },

  // 法人プラン
  starter: {
    planId: 'starter',
    priceId: PLAN_PRICE_IDS.STARTER_MONTHLY,
    amount: 3300,
    interval: 'month',
    isCorporate: true,
    displayName: '法人スタータープラン',
    maxUsers: 10,
  },
  starter_yearly: {
    planId: 'starter',
    priceId: PLAN_PRICE_IDS.STARTER_YEARLY,
    amount: 33000,
    interval: 'year',
    isCorporate: true,
    displayName: '法人スタータープラン（年額）',
    maxUsers: 10,
  },
  business: {
    planId: 'business',
    priceId: PLAN_PRICE_IDS.BUSINESS_MONTHLY,
    amount: 6600,
    interval: 'month',
    isCorporate: true,
    displayName: '法人ビジネスプラン',
    maxUsers: 30,
  },
  business_yearly: {
    planId: 'business',
    priceId: PLAN_PRICE_IDS.BUSINESS_YEARLY,
    amount: 66000,
    interval: 'year',
    isCorporate: true,
    displayName: '法人ビジネスプラン（年額）',
    maxUsers: 30,
  },
  enterprise: {
    planId: 'enterprise',
    priceId: PLAN_PRICE_IDS.ENTERPRISE_MONTHLY,
    amount: 9900,
    interval: 'month',
    isCorporate: true,
    displayName: '法人エンタープライズプラン',
    maxUsers: 50,
  },
  enterprise_yearly: {
    planId: 'enterprise',
    priceId: PLAN_PRICE_IDS.ENTERPRISE_YEARLY,
    amount: 99000,
    interval: 'year',
    isCorporate: true,
    displayName: '法人エンタープライズプラン（年額）',
    maxUsers: 50,
  },
};

// 🔧 プラン情報取得（デバッグログ付き）
export function getPaymentLinkByPlan(planId: string, interval: string = 'month'): PlanInfo | null {
  console.log('🔍 getPaymentLinkByPlan called:', { planId, interval });

  // 個人プランの処理
  if (planId === 'monthly' || (planId === 'individual' && interval === 'month')) {
    const config = PLAN_CONFIGS['monthly'];
    console.log('📋 Monthly plan config:', config);
    return config || null;
  }

  if (planId === 'yearly' || (planId === 'individual' && interval === 'year')) {
    const config = PLAN_CONFIGS['yearly'];
    console.log('📋 Yearly plan config:', config);
    return config || null;
  }

  // 法人プランの処理
  const key = interval === 'year' ? `${planId}_yearly` : planId;
  const config = PLAN_CONFIGS[key];
  console.log('📋 Corporate plan config:', { key, config });

  return config || null;
}

// 価格IDからプラン情報を取得
export function getPlanInfoByPriceId(priceId: string): PlanInfo | null {
  return Object.values(PLAN_CONFIGS).find((plan) => plan.priceId === priceId) || null;
}

// ワンタップシール価格ID取得
export function getOneTapSealPriceIds() {
  return {
    sealPriceId: PLAN_PRICE_IDS.ONE_TAP_SEAL,
    shippingPriceId: PLAN_PRICE_IDS.SHIPPING_FEE,
  };
}

// 動的価格計算（同時注文用）
export function calculateCombinedAmount(
  planId: string,
  interval: string,
  sealQuantity: number = 0,
): {
  planAmount: number;
  sealAmount: number;
  shippingAmount: number;
  totalAmount: number;
} {
  const planInfo = getPaymentLinkByPlan(planId, interval);
  if (!planInfo) {
    throw new Error(`プラン情報が見つかりません: ${planId}`);
  }

  const planAmount = planInfo.amount;
  const sealAmount = sealQuantity * 550; // ワンタップシール単価
  const shippingAmount = sealQuantity > 0 ? 185 : 0; // 配送料
  const totalAmount = planAmount + sealAmount + shippingAmount;

  return {
    planAmount,
    sealAmount,
    shippingAmount,
    totalAmount,
  };
}

// Checkout Session作成ヘルパー
export async function createCheckoutSession(params: {
  customerId: string;
  planInfo: PlanInfo;
  sealQuantity?: number;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Checkout.Session> {
  if (!stripe) {
    throw new Error('Stripe is not initialized');
  }

  const { customerId, planInfo, sealQuantity = 0, successUrl, cancelUrl, metadata = {} } = params;

  const lineItems = [];

  // プラン追加
  lineItems.push({
    price: planInfo.priceId,
    quantity: 1,
  });

  // ワンタップシール追加（存在する場合）
  if (sealQuantity > 0) {
    const { sealPriceId, shippingPriceId } = getOneTapSealPriceIds();

    lineItems.push({
      price: sealPriceId,
      quantity: sealQuantity,
    });

    lineItems.push({
      price: shippingPriceId,
      quantity: 1,
    });
  }

  return await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      ...metadata,
      planId: planInfo.planId,
      interval: planInfo.interval,
      sealQuantity: sealQuantity.toString(),
    },
  });
}

// レガシー: Payment Links（従来の個別決済用）
export const STRIPE_PAYMENT_LINKS = {
  MONTHLY: {
    url: process.env.STRIPE_MONTHLY_PAYMENT_LINK!,
    priceId: PLAN_PRICE_IDS.INDIVIDUAL_MONTHLY,
  },
  YEARLY: {
    url: process.env.STRIPE_YEARLY_PAYMENT_LINK!,
    priceId: PLAN_PRICE_IDS.INDIVIDUAL_YEARLY,
  },
  STARTER_MONTHLY: {
    url: process.env.STRIPE_STARTER_MONTHLY_PAYMENT_LINK!,
    priceId: PLAN_PRICE_IDS.STARTER_MONTHLY,
  },
  STARTER_YEARLY: {
    url: process.env.STRIPE_STARTER_YEARLY_PAYMENT_LINK!,
    priceId: PLAN_PRICE_IDS.STARTER_YEARLY,
  },
  BUSINESS_MONTHLY: {
    url: process.env.STRIPE_BUSINESS_MONTHLY_PAYMENT_LINK!,
    priceId: PLAN_PRICE_IDS.BUSINESS_MONTHLY,
  },
  BUSINESS_YEARLY: {
    url: process.env.STRIPE_BUSINESS_YEARLY_PAYMENT_LINK!,
    priceId: PLAN_PRICE_IDS.BUSINESS_YEARLY,
  },
  ENTERPRISE_MONTHLY: {
    url: process.env.STRIPE_ENTERPRISE_MONTHLY_PAYMENT_LINK!,
    priceId: PLAN_PRICE_IDS.ENTERPRISE_MONTHLY,
  },
  ENTERPRISE_YEARLY: {
    url: process.env.STRIPE_ENTERPRISE_YEARLY_PAYMENT_LINK!,
    priceId: PLAN_PRICE_IDS.ENTERPRISE_YEARLY,
  },
} as const;

// ============================================================
// パートナー向け Stripe 月額サブスクリプション
// ============================================================

// パートナープラン Price ID 定義
export const PARTNER_PRICE_IDS = {
  BASIC: process.env.STRIPE_PARTNER_BASIC_PRICE_ID || '',
  PRO: process.env.STRIPE_PARTNER_PRO_PRICE_ID || '',
  PREMIUM: process.env.STRIPE_PARTNER_PREMIUM_PRICE_ID || '',
} as const;

// パートナープラン情報
interface PartnerPlanInfo {
  planId: string;
  priceId: string;
  amount: number;
  displayName: string;
  maxAccounts: number;
}

export const PARTNER_PLAN_CONFIGS: Record<string, PartnerPlanInfo> = {
  basic: {
    planId: 'basic',
    priceId: PARTNER_PRICE_IDS.BASIC,
    amount: 30000,
    displayName: 'ベーシックプラン',
    maxAccounts: 300,
  },
  pro: {
    planId: 'pro',
    priceId: PARTNER_PRICE_IDS.PRO,
    amount: 50000,
    displayName: 'プロプラン',
    maxAccounts: 600,
  },
  premium: {
    planId: 'premium',
    priceId: PARTNER_PRICE_IDS.PREMIUM,
    amount: 80000,
    displayName: 'プレミアムプラン',
    maxAccounts: 1000,
  },
};

export function getPartnerPlanInfo(plan: string): PartnerPlanInfo | null {
  return PARTNER_PLAN_CONFIGS[plan] || null;
}

export function getPartnerPlanByPriceId(priceId: string): PartnerPlanInfo | null {
  return Object.values(PARTNER_PLAN_CONFIGS).find((p) => p.priceId === priceId) || null;
}

/**
 * パートナー用 Stripe サブスクリプション作成
 * トライアル期間: 3ヶ月
 */
export async function createPartnerSubscription(
  partnerId: string,
  plan: string,
): Promise<Stripe.Subscription> {
  const stripeClient = getStripeInstance();
  const planInfo = getPartnerPlanInfo(plan);
  if (!planInfo || !planInfo.priceId) {
    throw new Error(`パートナープラン情報が見つかりません: ${plan}`);
  }

  // パートナー情報を取得
  const { prisma } = await import('@/lib/prisma');
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    select: {
      stripeCustomerId: true,
      billingEmail: true,
      name: true,
      adminUser: { select: { email: true, name: true } },
    },
  });

  if (!partner) {
    throw new Error(`パートナーが見つかりません: ${partnerId}`);
  }

  // Stripe Customer の取得または作成
  let customerId = partner.stripeCustomerId;
  if (!customerId) {
    const customer = await stripeClient.customers.create({
      email: partner.billingEmail || partner.adminUser.email,
      name: partner.name,
      metadata: {
        type: 'partner',
        partnerId,
      },
    });
    customerId = customer.id;

    await prisma.partner.update({
      where: { id: partnerId },
      data: { stripeCustomerId: customerId },
    });
  }

  // 3ヶ月のトライアル期間を計算
  const trialEnd = Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60;

  const subscription = await stripeClient.subscriptions.create({
    customer: customerId,
    items: [{ price: planInfo.priceId }],
    trial_end: trialEnd,
    metadata: {
      type: 'partner',
      partnerId,
      plan,
    },
  });

  // パートナーのサブスクリプション情報を更新
  await prisma.partner.update({
    where: { id: partnerId },
    data: {
      stripeSubscriptionId: subscription.id,
      billingStatus: 'active',
      accountStatus: 'trial',
      trialEndsAt: new Date(trialEnd * 1000),
    },
  });

  return subscription;
}

/**
 * パートナーの Stripe サブスクリプションをキャンセル
 */
export async function cancelPartnerSubscription(partnerId: string): Promise<void> {
  const stripeClient = getStripeInstance();
  const { prisma } = await import('@/lib/prisma');

  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    select: { stripeSubscriptionId: true },
  });

  if (!partner?.stripeSubscriptionId) {
    throw new Error('サブスクリプションが見つかりません');
  }

  await stripeClient.subscriptions.update(partner.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  await prisma.partner.update({
    where: { id: partnerId },
    data: { billingStatus: 'cancelled' },
  });
}

/**
 * パートナーのプラン変更
 */
export async function changePartnerPlan(
  partnerId: string,
  newPlan: string,
): Promise<Stripe.Subscription> {
  const stripeClient = getStripeInstance();
  const newPlanInfo = getPartnerPlanInfo(newPlan);
  if (!newPlanInfo || !newPlanInfo.priceId) {
    throw new Error(`パートナープラン情報が見つかりません: ${newPlan}`);
  }

  const { prisma } = await import('@/lib/prisma');
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    select: { stripeSubscriptionId: true },
  });

  if (!partner?.stripeSubscriptionId) {
    throw new Error('サブスクリプションが見つかりません');
  }

  const subscription = await stripeClient.subscriptions.retrieve(partner.stripeSubscriptionId);
  const updatedSubscription = await stripeClient.subscriptions.update(
    partner.stripeSubscriptionId,
    {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPlanInfo.priceId,
        },
      ],
      metadata: {
        type: 'partner',
        partnerId,
        plan: newPlan,
      },
      proration_behavior: 'create_prorations',
    },
  );

  await prisma.partner.update({
    where: { id: partnerId },
    data: {
      plan: newPlan,
      maxAccounts: newPlanInfo.maxAccounts,
    },
  });

  return updatedSubscription;
}

/**
 * パートナー用 Stripe カスタマーポータルセッション作成
 */
export async function createPartnerBillingPortalSession(
  partnerId: string,
  returnUrl: string,
): Promise<Stripe.BillingPortal.Session> {
  const stripeClient = getStripeInstance();
  const { prisma } = await import('@/lib/prisma');

  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    select: { stripeCustomerId: true },
  });

  if (!partner?.stripeCustomerId) {
    throw new Error('Stripeカスタマー情報が見つかりません');
  }

  return await stripeClient.billingPortal.sessions.create({
    customer: partner.stripeCustomerId,
    return_url: returnUrl,
  });
}

export default stripe;