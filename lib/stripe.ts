// lib/stripe.ts

import Stripe from 'stripe';

// このファイルはサーバーサイドでのみ使用
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Missing STRIPE_SECRET_KEY environment variable');
}

// サーバーサイドのみで使用するエクスポート
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  // @ts-expect-error - Stripe型定義の制限を回避するため
  apiVersion: process.env.STRIPE_API_VERSION || '2025-04-30.basil',
  appInfo: {
    name: 'Share',
    version: '0.1.0',
  },
});

// プラン定義 - クライアントサイドとサーバーサイドの両方で使用可能
export const PLANS = {
  MONTHLY: {
    name: '月額プラン',
    price: 500, // 円
    interval: 'month',
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID || '',
    displayName: '個人プラン(1ヶ月で自動更新)',
  },
  YEARLY: {
    name: '年額プラン',
    price: 5000, // 円
    interval: 'year',
    priceId: process.env.STRIPE_YEARLY_PRICE_ID || '',
    displayName: '個人プラン(1年で自動更新)',
  },
  BUSINESS: {
    name: '法人スタータープラン',
    price: 3000, // 円
    interval: 'month',
    priceId: process.env.STRIPE_BUSINESS_PRICE_ID || '',
    displayName: '法人スタータープラン(1ヶ月で自動更新)',
  },
  BUSINESS_YEARLY: {
    name: '法人スタータープラン(年間)',
    price: 30000, // 円
    interval: 'year',
    priceId: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID || '',
    displayName: '法人スタータープラン(1年で自動更新)',
  },
  BUSINESS_PLUS: {
    name: '法人ビジネスプラン',
    price: 12000, // 円
    interval: 'month',
    priceId: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PLUS_PRICE_ID || '',
    displayName: '法人ビジネスプラン(1ヶ月で自動更新)',
  },
  BUSINESS_PLUS_YEARLY: {
    name: '法人ビジネスプラン(年間)',
    price: 120000, // 円
    interval: 'year',
    priceId: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PLUS_YEARLY_PRICE_ID || '',
    displayName: '法人ビジネスプラン(1年で自動更新)',
  },
};

// planIdからプラン名を直接取得する関数
export function getPlanNameFromId(planId: string, interval?: string): string {
  // ご利用プランID + 更新間隔からプラン表示名を取得
  if (planId === 'monthly') {
    return '個人プラン(1ヶ月で自動更新)';
  } else if (planId === 'yearly') {
    return '個人プラン(1年で自動更新)';
  } else if (planId === 'business') {
    return interval === 'year'
      ? '法人スタータープラン(1年で自動更新)'
      : '法人スタータープラン(1ヶ月で自動更新)';
  } else if (planId === 'business_plus' || planId === 'business-plus') {
    return interval === 'year'
      ? '法人ビジネスプラン(1年で自動更新)'
      : '法人ビジネスプラン(1ヶ月で自動更新)';
  } else if (planId === 'enterprise') {
    return 'エンタープライズプラン';
  } else if (planId === 'permanent') {
    return '永久利用可能';
  } else if (planId === 'trial') {
    return '無料トライアル中';
  }

  // プランを特定できない場合は不明なプランを返す
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