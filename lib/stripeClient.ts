// lib/stripeClient.ts (修正版)
import { logger } from '@/lib/utils/logger';
// クライアントサイドでのStripe初期化用
import { loadStripe } from '@stripe/stripe-js';

// 環境変数の存在確認
if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  logger.warn('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable');
}

// Stripe初期化
export const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

// クライアント側でStripeが利用可能かどうかをチェックするヘルパー関数
export function isClientStripeAvailable(): boolean {
  return !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
}

// 🔧 追加: クライアントサイド用の決済リンク
export const STRIPE_PAYMENT_LINKS = {
  MONTHLY: {
    url: 'https://buy.stripe.com/7sY9AUfxOdGogw4cQbcs800',
    planId: 'monthly',
    interval: 'month',
    amount: 550,
    isCorporate: false,
  },
  YEARLY: {
    url: 'https://buy.stripe.com/bJe5kE1GYcCkenW6rNcs801',
    planId: 'yearly',
    interval: 'year',
    amount: 5500,
    isCorporate: false,
  },
  STARTER_MONTHLY: {
    url: 'https://buy.stripe.com/dRm14oaducCk93C5nJcs802',
    planId: 'starter',
    interval: 'month',
    amount: 3300,
    isCorporate: true,
    maxUsers: 10,
  },
  STARTER_YEARLY: {
    url: 'https://buy.stripe.com/eVqeVeclC7i00x67vRcs803',
    planId: 'starter',
    interval: 'year',
    amount: 33000,
    isCorporate: true,
    maxUsers: 10,
  },
  BUSINESS_MONTHLY: {
    url: 'https://buy.stripe.com/6oUdRa4Ta1XG2Feg2ncs804',
    planId: 'business',
    interval: 'month',
    amount: 6600,
    isCorporate: true,
    maxUsers: 30,
  },
  BUSINESS_YEARLY: {
    url: 'https://buy.stripe.com/5kQbJ24TacCk5Rq3fBcs805',
    planId: 'business',
    interval: 'year',
    amount: 66000,
    isCorporate: true,
    maxUsers: 30,
  },
  ENTERPRISE_MONTHLY: {
    url: 'https://buy.stripe.com/bJe14o4TaeKs4Nm17tcs806',
    planId: 'enterprise',
    interval: 'month',
    amount: 9900,
    isCorporate: true,
    maxUsers: 50,
  },
  ENTERPRISE_YEARLY: {
    url: 'https://buy.stripe.com/4gMcN699q9q8a7G9DZcs807',
    planId: 'enterprise',
    interval: 'year',
    amount: 99000,
    isCorporate: true,
    maxUsers: 50,
  },
};

// ヘルパー関数をエクスポート
export function getSubscriptionStatusText(status: string): string {
  switch (status) {
    case 'trialing':
      return '無料トライアル中';
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
    default:
      return '不明なステータス';
  }
}

// プラン名取得関数（クライアントサイド用）
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

// プラン定義
export const PLANS = {
  MONTHLY: {
    name: '月額プラン',
    price: 550, // 円
    interval: 'month',
  },
  YEARLY: {
    name: '年額プラン',
    price: 5500, // 円
    interval: 'year',
  },
  // 法人プラン更新
  STARTER: {
    name: '法人スタータープラン',
    price: 3300, // 円
    interval: 'month',
    maxUsers: 10,
  },
  BUSINESS: {
    name: '法人ビジネスプラン',
    price: 6600, // 円
    interval: 'month',
    maxUsers: 30,
  },
  ENTERPRISE: {
    name: '法人エンタープライズプラン',
    price: 9900, // 円
    interval: 'month',
    maxUsers: 50,
  },
  // 年額プラン
  STARTER_YEARLY: {
    name: '法人スタータープラン(年間)',
    price: 33000, // 円
    interval: 'year',
    maxUsers: 10,
  },
  BUSINESS_YEARLY: {
    name: '法人ビジネスプラン(年間)',
    price: 66000, // 円
    interval: 'year',
    maxUsers: 30,
  },
  ENTERPRISE_YEARLY: {
    name: '法人エンタープライズプラン(年間)',
    price: 99000, // 円
    interval: 'year',
    maxUsers: 50,
  },
};