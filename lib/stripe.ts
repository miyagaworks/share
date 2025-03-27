// lib/stripe.ts
import Stripe from 'stripe';

// このファイルはサーバーサイドでのみ使用
if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('Missing STRIPE_SECRET_KEY environment variable');
}

// サーバーサイドのみで使用するエクスポート
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-02-24.acacia', // 最新のAPIバージョンを使用
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
    },
    YEARLY: {
        name: '年額プラン',
        price: 5000, // 円
        interval: 'year',
        priceId: process.env.STRIPE_YEARLY_PRICE_ID || '',
    },
    BUSINESS: {
        name: '法人プラン',
        price: 3000, // 円
        interval: 'month',
        priceId: process.env.STRIPE_BUSINESS_PRICE_ID || '',
    },
};

// planIdからプラン名を直接取得する関数
export function getPlanNameFromId(planId: string): string {
    switch (planId) {
        case 'monthly': return '月額プラン';
        case 'yearly': return '年額プラン';
        case 'business': return 'ビジネスプラン';
        case 'enterprise': return 'エンタープライズプラン';
        default: return '不明なプラン';
    }
}

// サブスクリプションステータスの表示名を取得するヘルパー関数
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

// プランIDから名前を取得するヘルパー関数
export function getPlanName(planId: string): string {
    // PLANSオブジェクトからpriceIdに一致するプランを探す
    const plan = Object.values(PLANS).find(p => p.priceId === planId);
    if (plan) {
        return plan.name;
    }
    return '不明なプラン';
}