// scripts/migrate-subscription-plans.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migratePlans() {
  try {
    console.log('プラン移行を開始します...');

    // business -> starter への移行
    const businessToStarter = await prisma.subscription.updateMany({
      where: { plan: 'business' },
      data: { plan: 'starter' },
    });

    // business-plus/business_plus -> business への移行
    const businessPlusToBusiness = await prisma.subscription.updateMany({
      where: { plan: { in: ['business-plus', 'business_plus'] } },
      data: { plan: 'business' },
    });

    console.log(
      `移行完了: ${businessToStarter.count} 件のスタータープラン, ${businessPlusToBusiness.count} 件のビジネスプラン`,
    );

    // テナントのmaxUsersを更新
    const tenants = await prisma.corporateTenant.findMany();
    for (const tenant of tenants) {
      let maxUsers = 10; // デフォルト
      const subscription = await prisma.subscription.findUnique({
        where: { id: tenant.subscriptionId || '' },
      });

      if (subscription) {
        if (subscription.plan === 'starter') maxUsers = 10;
        else if (subscription.plan === 'business') maxUsers = 30;
        else if (subscription.plan === 'enterprise') maxUsers = 50;
      }

      await prisma.corporateTenant.update({
        where: { id: tenant.id },
        data: { maxUsers },
      });
    }

    console.log('テナントユーザー数制限の更新が完了しました');
  } catch (error) {
    console.error('プラン移行中にエラーが発生しました:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migratePlans();