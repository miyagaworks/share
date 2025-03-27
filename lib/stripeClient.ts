// lib/stripeClient.ts
// クライアントサイドでのStripe初期化用
import { loadStripe } from '@stripe/stripe-js';

export const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

// ヘルパー関数をエクスポート
export function getSubscriptionStatusText(status: string): string {
    switch (status) {
        case 'trialing': return '無料トライアル中';
        case 'active': return 'アクティブ';
        case 'past_due': return '支払い遅延中';
        case 'canceled': return 'キャンセル済み';
        case 'incomplete': return '不完全';
        case 'incomplete_expired': return '期限切れ';
        default: return '不明なステータス';
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
    BUSINESS: {
        name: '法人プラン',
        price: 3000, // 円
        interval: 'month',
    },
};