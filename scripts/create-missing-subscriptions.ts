// scripts/create-missing-subscriptions.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createMissingSubscriptions() {
    // Subscriptionテーブルにレコードがないユーザーを取得
    const usersWithoutSubscription = await prisma.user.findMany({
        where: {
            subscription: null,
        },
    });

    console.log(`Found ${usersWithoutSubscription.length} users without subscription records`);

    // 各ユーザーにサブスクリプションレコードを作成
    for (const user of usersWithoutSubscription) {
        // トライアル終了日を取得（ない場合は30日後）
        const trialEndsAt = user.trialEndsAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        // Subscriptionレコードを作成
        await prisma.subscription.create({
            data: {
                userId: user.id,
                status: user.subscriptionStatus || "trialing",
                plan: "trial",
                currentPeriodStart: new Date(),
                currentPeriodEnd: trialEndsAt,
                cancelAtPeriodEnd: false,
            },
        });

        console.log(`Created subscription record for user ${user.id}`);
    }

    console.log("Completed creating missing subscription records");
}

createMissingSubscriptions()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());