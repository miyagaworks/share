// app/api/subscription/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
// import { stripe } from "@/lib/stripe"; // 本番環境では必要

// プランに基づいて適切な期間終了日を計算する関数
function calculatePeriodEndDate(plan: string, startDate: Date): Date {
    console.log(`計算開始日: ${startDate.toISOString()}`);

    const endDate = new Date(startDate);

    switch (plan) {
        case 'monthly':
            // 1ヶ月後
            endDate.setMonth(endDate.getMonth() + 1);
            break;
        case 'yearly':
            // 1年後
            endDate.setFullYear(endDate.getFullYear() + 1);
            break;
        case 'business':
            // ビジネスプランも1ヶ月後と仮定
            endDate.setMonth(endDate.getMonth() + 1);
            break;
        default:
            // デフォルトは1ヶ月後
            endDate.setMonth(endDate.getMonth() + 1);
    }

    console.log(`計算終了日: ${endDate.toISOString()}`);
    return endDate;
}

// ご利用プラン作成API
export async function POST(req: NextRequest) {
    try {
        // リクエストログ
        console.log("プラン作成リクエスト受信");
        console.log("現在のサーバー時間:", new Date().toISOString());

        const session = await auth();

        if (!session?.user?.id) {
            console.log("認証エラー: ユーザーIDが見つかりません");
            return NextResponse.json(
                { error: "認証されていません" },
                { status: 401 }
            );
        }

        // リクエストボディのパース
        const body = await req.json();
        console.log("リクエストボディ:", body);

        const { priceId, paymentMethodId, plan } = body;

        // 必須パラメータの検証
        if (!priceId || !paymentMethodId) {
            console.log("パラメータエラー:", { priceId, paymentMethodId });
            return NextResponse.json(
                { error: "必要なパラメータが不足しています" },
                { status: 400 }
            );
        }

        console.log("ユーザー情報取得開始:", session.user.id);

        // ユーザー情報を取得
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                email: true,
                stripeCustomerId: true,
                trialEndsAt: true,
                subscriptionStatus: true
            },
        });

        if (!user) {
            console.log("ユーザーが見つかりません:", session.user.id);
            return NextResponse.json(
                { error: "ユーザーが見つかりません" },
                { status: 404 }
            );
        }

        console.log("ユーザー情報:", user);

        // 開発環境用のモックデータ
        // 本番環境ではこの部分を実際のStripe統合に置き換える
        // モック顧客ID
        const mockCustomerId = `cus_mock_${Math.random().toString(36).substring(2, 10)}`;

        // 現在の日付
        const now = new Date();

        // トライアル終了日が設定されているかチェック
        const trialEndsAt = user.trialEndsAt || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // デフォルトは7日後

        console.log("トライアル終了日:", trialEndsAt.toISOString());

        // モックご利用プラン作成
        const mockSubscription = {
            id: `sub_mock_${Math.random().toString(36).substring(2, 10)}`,
            status: "active",
            current_period_start: Math.floor(now.getTime() / 1000),
            current_period_end: Math.floor(now.getTime() / 1000) + (30 * 24 * 60 * 60), // 30日後（仮）
            latest_invoice: {
                payment_intent: {
                    client_secret: `pi_secret_mock_${Math.random().toString(36).substring(2, 10)}`
                }
            }
        };

        console.log("モックプラン作成:", mockSubscription);

        // ユーザーのStripeCustomerIdを更新
        if (!user.stripeCustomerId) {
            await prisma.user.update({
                where: { id: session.user.id },
                data: {
                    stripeCustomerId: mockCustomerId,
                    subscriptionStatus: "active", // トライアル中からアクティブに変更
                    trialEndsAt: null // トライアル終了日をクリア
                },
            });
            console.log("ユーザー情報更新:", { stripeCustomerId: mockCustomerId, subscriptionStatus: "active" });
        }

        // 既存のご利用プランをチェック
        const existingSubscription = await prisma.subscription.findUnique({
            where: { userId: session.user.id },
        });

        console.log("既存のご利用プラン:", existingSubscription);

        // 現在の日付と期間終了日を設定
        const currentPeriodStart = now;
        const currentPeriodEnd = calculatePeriodEndDate(plan || 'monthly', currentPeriodStart);

        console.log("期間設定:", {
            plan: plan || 'monthly',
            currentPeriodStart: currentPeriodStart.toISOString(),
            currentPeriodEnd: currentPeriodEnd.toISOString()
        });

        // ご利用プラン情報を更新または作成
        const subscriptionData = {
            status: "active", // トライアル中ではなくアクティブに変更
            plan: plan || "monthly",
            priceId,
            subscriptionId: mockSubscription.id,
            currentPeriodStart: currentPeriodStart,
            currentPeriodEnd: currentPeriodEnd,
            trialStart: null, // トライアル情報をクリア
            trialEnd: null,   // トライアル情報をクリア
            cancelAtPeriodEnd: false,
        };

        let newSubscription;

        if (existingSubscription) {
            // 既存のご利用プランを更新
            newSubscription = await prisma.subscription.update({
                where: { userId: session.user.id },
                data: subscriptionData,
            });
            console.log("プラン更新:", newSubscription);
        } else {
            // 新規ご利用プランを作成
            newSubscription = await prisma.subscription.create({
                data: {
                    userId: session.user.id,
                    ...subscriptionData
                },
            });
            console.log("プラン作成:", newSubscription);
        }

        // PaymentIntent情報を取得
        const clientSecret = mockSubscription.latest_invoice?.payment_intent?.client_secret || null;

        return NextResponse.json({
            success: true,
            subscription: newSubscription,
            clientSecret,
            message: "プランが正常に作成されました（開発環境用モックデータ）"
        });

    } catch (error) {
        console.error("プラン作成エラー:", error);
        const errorMessage = error instanceof Error ? error.message : "プランの作成に失敗しました";
        return NextResponse.json(
            { error: `プランの作成に失敗しました: ${errorMessage}` },
            { status: 500 }
        );
    }
}