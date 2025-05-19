// scripts/normalize-individual-plans.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function normalizeIndividualPlans() {
  try {
    console.log('個人プランの正規化を開始します...');

    // 個人プランの月額契約を正規化
    const monthlyPlans = await prisma.subscription.updateMany({
      where: {
        plan: 'monthly',
        interval: null,
      },
      data: {
        interval: 'month',
      },
    });

    // 個人プランの年額契約を正規化
    const yearlyPlans = await prisma.subscription.updateMany({
      where: {
        plan: 'yearly',
        interval: null,
      },
      data: {
        interval: 'year',
      },
    });

    console.log(
      `個人プランの正規化完了: ${monthlyPlans.count} 件の月額プラン, ${yearlyPlans.count} 件の年額プラン`,
    );
  } catch (error) {
    console.error('個人プラン正規化中にエラーが発生しました:', error);
  } finally {
    await prisma.$disconnect();
  }
}

normalizeIndividualPlans();