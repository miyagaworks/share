// app/api/subscription/cancel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
// import { stripe } from "@/lib/stripe"; // 本番環境では必要

// サブスクリプションキャンセルAPI
export async function POST(req: NextRequest) {
    try {
        console.log("キャンセルリクエスト受信");

        const session = await auth();

        if (!session?.user?.id) {
            console.log("認証エラー: ユーザーIDが見つかりません");
            return NextResponse.json(
                { error: "認証されていません" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { reason } = body; // キャンセル理由（オプション）

        console.log("キャンセルリクエスト内容:", { userId: session.user.id, reason });

        // ユーザーのサブスクリプション情報を取得
        const subscription = await prisma.subscription.findUnique({
            where: { userId: session.user.id },
        });

        console.log("取得したサブスクリプション:", subscription);

        // サブスクリプションが見つからない場合
        if (!subscription) {
            console.log("サブスクリプションが見つかりません");
            return NextResponse.json(
                { error: "サブスクリプションが見つかりません" },
                { status: 404 }
            );
        }

        // 既にキャンセル済みの場合
        if (subscription.cancelAtPeriodEnd) {
            console.log("既にキャンセル済みです");
            return NextResponse.json(
                {
                    success: true,
                    message: "すでにキャンセル済みです",
                    subscription: subscription
                },
                { status: 200 }
            );
        }

        // ここでStripeのキャンセル処理を行う（開発中はコメントアウト可能）
        /*
        await stripe.subscriptions.update(
            subscription.subscriptionId,
            { cancel_at_period_end: true }
        );
        */

        // 現在のcurrentPeriodEndを取得（これがキャンセル予定日になります）
        const currentPeriodEnd = subscription.currentPeriodEnd;

        console.log("キャンセル予定日:", currentPeriodEnd);

        // データベースの情報を更新
        const updatedSubscription = await prisma.subscription.update({
            where: { userId: session.user.id },
            data: {
                cancelAtPeriodEnd: true,
                cancelReason: reason || null,
                updatedAt: new Date(),
            }
        });

        console.log("サブスクリプション更新完了:", updatedSubscription);

        return NextResponse.json({
            success: true,
            subscription: updatedSubscription,
            message: "サブスクリプションをキャンセルしました"
        });
    } catch (error) {
        console.error("サブスクリプションキャンセルエラー:", error);
        const errorMessage = error instanceof Error ? error.message : "サブスクリプションのキャンセルに失敗しました";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}