// lib/stripe.ts
import { logger } from '@/lib/utils/logger';
import Stripe from 'stripe';

// このファイルはサーバーサイドでのみ使用
if (!process.env.STRIPE_SECRET_KEY) {
  logger.warn('Missing STRIPE_SECRET_KEY environment variable');
}

// サーバーサイドのみで使用するStripeインスタンス
// APIバージョンを省略してStripeに最適なバージョンを自動選択させる
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      // APIバージョンは省略 - SDKが最適なバージョンを選択
      appInfo: {
        name: 'Share',
        version: '0.1.0',
      },
    })
  : null;

// Stripe利用可能かどうかをチェックするヘルパー関数
export function isStripeAvailable(): boolean {
  return !!process.env.STRIPE_SECRET_KEY && !!stripe;
}

// Stripeインスタンスを安全に取得するヘルパー関数
export function getStripeInstance(): Stripe {
  if (!stripe) {
    throw new Error(
      'Stripe is not initialized. Please check STRIPE_SECRET_KEY environment variable.',
    );
  }
  return stripe;
}

// 決済リンク情報の型定義
interface PaymentLinkInfo {
  url: string;
  priceId: string;
  planId: string;
  interval: string;
  amount: number;
  isCorporate: boolean;
  maxUsers?: number;
}

// Stripe決済リンクの価格IDマッピング
export const STRIPE_PAYMENT_LINKS: Record<string, PaymentLinkInfo> = {
  // 個人プラン
  MONTHLY: {
    url: 'https://buy.stripe.com/7sY9AUfxOdGogw4cQbcs800',
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID || 'price_monthly_default',
    planId: 'monthly',
    interval: 'month',
    amount: 550,
    isCorporate: false,
  },
  YEARLY: {
    url: 'https://buy.stripe.com/bJe5kE1GYcCkenW6rNcs801',
    priceId: process.env.STRIPE_YEARLY_PRICE_ID || 'price_yearly_default',
    planId: 'yearly',
    interval: 'year',
    amount: 5500,
    isCorporate: false,
  },
  // 法人プラン - Vercelの設定に合わせて修正
  STARTER_MONTHLY: {
    url: 'https://buy.stripe.com/dRm14oaducCk93C5nJcs802',
    priceId: process.env.STRIPE_STARTER_PRICE_ID || 'price_starter_monthly_default',
    planId: 'starter',
    interval: 'month',
    amount: 3300,
    isCorporate: true,
    maxUsers: 10,
  },
  STARTER_YEARLY: {
    url: 'https://buy.stripe.com/eVqeVeclC7i00x67vRcs803',
    priceId: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || 'price_starter_yearly_default',
    planId: 'starter',
    interval: 'year',
    amount: 33000,
    isCorporate: true,
    maxUsers: 10,
  },
  BUSINESS_MONTHLY: {
    url: 'https://buy.stripe.com/6oUdRa4Ta1XG2Feg2ncs804',
    priceId: process.env.STRIPE_BUSINESS_PRICE_ID || 'price_business_monthly_default',
    planId: 'business',
    interval: 'month',
    amount: 6600,
    isCorporate: true,
    maxUsers: 30,
  },
  BUSINESS_YEARLY: {
    url: 'https://buy.stripe.com/5kQbJ24TacCk5Rq3fBcs805',
    priceId: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID || 'price_business_yearly_default',
    planId: 'business',
    interval: 'year',
    amount: 66000,
    isCorporate: true,
    maxUsers: 30,
  },
  ENTERPRISE_MONTHLY: {
    url: 'https://buy.stripe.com/bJe14o4TaeKs4Nm17tcs806',
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_monthly_default',
    planId: 'enterprise',
    interval: 'month',
    amount: 9900,
    isCorporate: true,
    maxUsers: 50,
  },
  ENTERPRISE_YEARLY: {
    url: 'https://buy.stripe.com/4gMcN699q9q8a7G9DZcs807',
    priceId: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || 'price_enterprise_yearly_default',
    planId: 'enterprise',
    interval: 'year',
    amount: 99000,
    isCorporate: true,
    maxUsers: 50,
  },
};

// 価格IDからプラン情報を取得する関数
export function getPlanInfoByPriceId(priceId: string): PaymentLinkInfo | undefined {
  return Object.values(STRIPE_PAYMENT_LINKS).find((plan) => plan.priceId === priceId);
}

// プランIDと間隔から決済リンクを取得する関数
export function getPaymentLinkByPlan(
  planId: string,
  interval: string,
): PaymentLinkInfo | undefined {
  const key = `${planId.toUpperCase()}_${interval.toUpperCase()}`;
  return STRIPE_PAYMENT_LINKS[key as keyof typeof STRIPE_PAYMENT_LINKS];
}

// 既存のプラン定義（後方互換性のため）
export const PLANS = {
  MONTHLY: {
    name: '月額プラン',
    price: 550,
    interval: 'month',
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID || '',
    displayName: '個人プラン(1ヶ月で自動更新)',
    planId: 'monthly',
    maxUsers: 1,
  },
  YEARLY: {
    name: '年額プラン',
    price: 5500,
    interval: 'year',
    priceId: process.env.STRIPE_YEARLY_PRICE_ID || '',
    displayName: '個人プラン(1年で自動更新)',
    planId: 'yearly',
    maxUsers: 1,
  },
  STARTER: {
    name: '法人スタータープラン',
    price: 3300,
    interval: 'month',
    priceId: process.env.STRIPE_STARTER_PRICE_ID || '',
    displayName: '法人スタータープラン(10名まで・月額)',
    planId: 'starter',
    maxUsers: 10,
  },
  STARTER_YEARLY: {
    name: '法人スタータープラン(年間)',
    price: 33000,
    interval: 'year',
    priceId: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || '',
    displayName: '法人スタータープラン(10名まで・年額)',
    planId: 'starter',
    maxUsers: 10,
  },
  BUSINESS: {
    name: '法人ビジネスプラン',
    price: 6600,
    interval: 'month',
    priceId: process.env.STRIPE_BUSINESS_PRICE_ID || '',
    displayName: '法人ビジネスプラン(30名まで・月額)',
    planId: 'business',
    maxUsers: 30,
  },
  BUSINESS_YEARLY: {
    name: '法人ビジネスプラン(年間)',
    price: 66000,
    interval: 'year',
    priceId: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID || '',
    displayName: '法人ビジネスプラン(30名まで・年額)',
    planId: 'business',
    maxUsers: 30,
  },
  ENTERPRISE: {
    name: '法人エンタープライズプラン',
    price: 9900,
    interval: 'month',
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || '',
    displayName: '法人エンタープライズプラン(50名まで・月額)',
    planId: 'enterprise',
    maxUsers: 50,
  },
  ENTERPRISE_YEARLY: {
    name: '法人エンタープライズプラン(年間)',
    price: 99000,
    interval: 'year',
    priceId: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || '',
    displayName: '法人エンタープライズプラン(50名まで・年額)',
    planId: 'enterprise',
    maxUsers: 50,
  },
};

// プラン名取得関数
export function getPlanNameFromId(planId: string, interval?: string): string {
  if (planId === 'monthly') {
    return '個人プラン(1ヶ月で自動更新)';
  } else if (planId === 'yearly') {
    return '個人プラン(1年で自動更新)';
  } else if (planId === 'starter') {
    return interval === 'year'
      ? '法人スタータープラン(10名まで・年額)'
      : '法人スタータープラン(10名まで・月額)';
  } else if (planId === 'business') {
    return interval === 'year'
      ? '法人ビジネスプラン(30名まで・年額)'
      : '法人ビジネスプラン(30名まで・月額)';
  } else if (planId === 'enterprise') {
    return interval === 'year'
      ? '法人エンタープライズプラン(50名まで・年額)'
      : '法人エンタープライズプラン(50名まで・月額)';
  } else if (planId === 'business_legacy') {
    return '法人スタータープラン(10名まで)';
  } else if (planId === 'business-plus' || planId === 'business_plus') {
    return '法人ビジネスプラン(30名まで)';
  } else if (planId === 'permanent') {
    return '永久利用可能';
  } else if (planId === 'trial') {
    return '無料トライアル中';
  }
  return '不明なプラン';
}

// サブスクリプションステータス表示名取得関数
export function getSubscriptionStatusText(
  status: string,
  plan?: string,
  interval?: string,
): string {
  if (status === 'trialing') {
    return '無料トライアル中';
  }
  if (status === 'active' && plan) {
    return getPlanNameFromId(plan, interval);
  }
  switch (status) {
    case 'active':
      return 'アクティブ';
    case 'past_due':
      return '支払い遅延中';
    case 'canceled':
      return 'キャンセル済み';
    case 'incomplete':
      return '不完全';
    case 'incomplete_expired':
      return '期限切れ';
    case 'permanent':
      return '永久利用可能';
    default:
      return '不明なステータス';
  }
}

// プランIDから名前を取得するヘルパー関数（後方互換性）
export function getPlanNameById(planId: string): string {
  const plan = Object.values(PLANS).find((p) => p.priceId === planId);
  if (plan) {
    return plan.name;
  }
  return '不明なプラン';
}

// 既存の関数名を残すためのエイリアス
export const getPlanName = getPlanNameById;