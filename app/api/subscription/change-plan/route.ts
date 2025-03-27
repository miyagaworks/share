// app/api/subscription/change-plan/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
// Prismaモデル作成後に有効化
// import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/stripe";
// import { stripe } from "@/lib/stripe";

// サブスクリプションプランの型定義
type SubscriptionPlan = 'monthly' | 'yearly' | 'business';

// プラン変更API
export async function POST(req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "認証されていません" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { plan } = body;

        if (!plan || !['monthly', 'yearly', 'business'].includes(plan)) {
            return NextResponse.json(
                { error: "有効なプランを指定してください" },
                { status: 400 }
            );
        }

        // プランに対応するStripeの価格IDを取得
        let priceId;
        switch (plan as SubscriptionPlan) {
            case 'monthly':
                priceId = PLANS.MONTHLY.priceId;
                break;
            case 'yearly':
                priceId = PLANS.YEARLY.priceId;
                break;
            case 'business':
                priceId = PLANS.BUSINESS.priceId;
                break;
            default:
                return NextResponse.json(
                    { error: "無効なプランです" },
                    { status: 400 }
                );
        }

        // 注: Prismaスキーマのモデル生成後に有効化
        /*
        // ユーザーのサブスクリプション情報を取得
        const subscription = await prisma.subscription.findUnique({
            where: { userId: session.user.id },
        });

        if (!subscription || !subscription.subscriptionId) {
            return NextResponse.json(
                { error: "サブスクリプションが見つかりません" },
                { status: 404 }
            );
        }

        // 現在のプランと同じ場合は変更不要
        if (subscription.plan === plan) {
            return NextResponse.json(
                { message: "すでに選択されているプランです" },
                { status: 200 }
            );
        }

        // Stripeサブスクリプションのアイテムを取得
        const stripeSubscription = await stripe.subscriptions.retrieve(
            subscription.subscriptionId
        );

        const subscriptionItemId = stripeSubscription.items.data[0].id;

        // Stripeサブスクリプションのアイテムを更新
        const updatedSubscription = await stripe.subscriptions.update(
            subscription.subscriptionId,
            {
                items: [{
                    id: subscriptionItemId,
                    price: priceId,
                }],
                proration_behavior: 'create_prorations',
            }
        );

        // データベースの情報を更新
        const updatedDbSubscription = await prisma.subscription.update({
            where: { userId: session.user.id },
            data: {
                plan,
                priceId,
                currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000),
                updatedAt: new Date(),
            }
        });
        */

        // 開発中の仮実装
        const mockUpdatedSubscription = {
            id: "mock-subscription-id",
            userId: session.user.id,
            plan,
            priceId,
            status: "active",
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30日後
            updatedAt: new Date()
        };

        return NextResponse.json({
            success: true,
            subscription: mockUpdatedSubscription,
            message: "開発中: プラン変更機能は近日公開予定です"
        });
    } catch (error) {
        console.error("プラン変更エラー:", error);
        const errorMessage = error instanceof Error ? error.message : "プランの変更に失敗しました";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}