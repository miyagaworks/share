// lib/stripe.ts
import Stripe from 'stripe';

// このファイルはサーバーサイドでのみ使用
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Missing STRIPE_SECRET_KEY environment variable');
}

// サーバーサイドのみで使用するエクスポート
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      // リテラル型としてAPIバージョンを指定
      apiVersion: '2025-02-24.acacia',
      appInfo: {
        name: 'Share',
        version: '0.1.0',
      },
    })
  : null;

// Stripe利用可能かどうかをチェックするヘルパー関数
export function isStripeAvailable(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

// プラン定義 - クライアントサイドとサーバーサイドの両方で使用可能
export const PLANS = {
  // 個人プラン（既存）
  MONTHLY: {
    name: '月額プラン',
    price: 500, // 円
    interval: 'month',
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID || '',
    displayName: '個人プラン(1ヶ月で自動更新)',
    planId: 'monthly',
    maxUsers: 1,
  },
  YEARLY: {
    name: '年額プラン',
    price: 5000, // 円
    interval: 'year',
    priceId: process.env.STRIPE_YEARLY_PRICE_ID || '',
    displayName: '個人プラン(1年で自動更新)',
    planId: 'yearly',
    maxUsers: 1,
  },

  // 法人プラン（新規または修正）
  STARTER: {
    name: '法人スタータープラン',
    price: 3000, // 円
    interval: 'month',
    priceId: process.env.STRIPE_STARTER_PRICE_ID || '',
    displayName: '法人スタータープラン(10名まで・月額)',
    planId: 'starter',
    maxUsers: 10,
  },
  STARTER_YEARLY: {
    name: '法人スタータープラン(年間)',
    price: 30000, // 円
    interval: 'year',
    priceId: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || '',
    displayName: '法人スタータープラン(10名まで・年額)',
    planId: 'starter',
    maxUsers: 10,
  },
  BUSINESS: {
    name: '法人ビジネスプラン',
    price: 6000, // 円
    interval: 'month',
    priceId: process.env.STRIPE_BUSINESS_PRICE_ID || '',
    displayName: '法人ビジネスプラン(30名まで・月額)',
    planId: 'business',
    maxUsers: 30,
  },
  BUSINESS_YEARLY: {
    name: '法人ビジネスプラン(年間)',
    price: 60000, // 円
    interval: 'year',
    priceId: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID || '',
    displayName: '法人ビジネスプラン(30名まで・年額)',
    planId: 'business',
    maxUsers: 30,
  },
  ENTERPRISE: {
    name: '法人エンタープライズプラン',
    price: 9000, // 円
    interval: 'month',
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || '',
    displayName: '法人エンタープライズプラン(50名まで・月額)',
    planId: 'enterprise',
    maxUsers: 50,
  },
  ENTERPRISE_YEARLY: {
    name: '法人エンタープライズプラン(年間)',
    price: 90000, // 円
    interval: 'year',
    priceId: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || '',
    displayName: '法人エンタープライズプラン(50名まで・年額)',
    planId: 'enterprise',
    maxUsers: 50,
  },
};

// planIdからプラン名を直接取得する関数
export function getPlanNameFromId(planId: string, interval?: string): string {
  // 個人プラン
  if (planId === 'monthly') {
    return '個人プラン(1ヶ月で自動更新)';
  } else if (planId === 'yearly') {
    return '個人プラン(1年で自動更新)';
  }

  // 法人プラン
  else if (planId === 'starter') {
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
  }

  // 古いプランID（互換性のため）
  else if (planId === 'business_legacy') {
    return '法人スタータープラン(10名まで)';
  } else if (planId === 'business-plus' || planId === 'business_plus') {
    return '法人ビジネスプラン(30名まで)';
  }

  // 特殊プラン
  else if (planId === 'permanent') {
    return '永久利用可能';
  } else if (planId === 'trial') {
    return '無料トライアル中';
  }

  // プランを特定できない場合
  return '不明なプラン';
}

// ご利用プランステータスの表示名を取得するヘルパー関数
export function getSubscriptionStatusText(
  status: string,
  plan?: string,
  interval?: string,
): string {
  // ステータスが「トライアル中」の場合
  if (status === 'trialing') {
    return '無料トライアル中';
  }

  // ステータスが「アクティブ」の場合はプラン名を表示
  if (status === 'active' && plan) {
    return getPlanNameFromId(plan, interval);
  }

  // その他のステータス
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
      return '永久利用可能'; // 追加: 永久利用権ユーザー
    default:
      return '不明なステータス';
  }
}

// プランIDから名前を取得するヘルパー関数
export function getPlanNameById(planId: string): string {
  // PLANSオブジェクトからpriceIdに一致するプランを探す
  const plan = Object.values(PLANS).find((p) => p.priceId === planId);
  if (plan) {
    return plan.name;
  }
  return '不明なプラン';
}

// 既存の関数名を残すためのエイリアス
export const getPlanName = getPlanNameById;
