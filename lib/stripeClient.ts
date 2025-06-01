// lib/stripeClient.ts
import { logger } from "@/lib/utils/logger";
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
// プラン定義
export const PLANS = {
  MONTHLY: {
    name: '月額プラン',
    price: 500, // 円
    interval: 'month',
  },
  YEARLY: {
    name: '年額プラン',
    price: 5000, // 円
    interval: 'year',
  },
  // 法人プラン更新
  STARTER: {
    name: '法人スタータープラン',
    price: 3000, // 円
    interval: 'month',
    maxUsers: 10,
  },
  BUSINESS: {
    name: '法人ビジネスプラン',
    price: 6000, // 円
    interval: 'month',
    maxUsers: 30,
  },
  ENTERPRISE: {
    name: '法人エンタープライズプラン',
    price: 9000, // 円
    interval: 'month',
    maxUsers: 50,
  },
  // 年額プラン
  STARTER_YEARLY: {
    name: '法人スタータープラン(年間)',
    price: 30000, // 円
    interval: 'year',
    maxUsers: 10,
  },
  BUSINESS_YEARLY: {
    name: '法人ビジネスプラン(年間)',
    price: 60000, // 円
    interval: 'year',
    maxUsers: 30,
  },
  ENTERPRISE_YEARLY: {
    name: '法人エンタープライズプラン(年間)',
    price: 90000, // 円
    interval: 'year',
    maxUsers: 50,
  },
};
