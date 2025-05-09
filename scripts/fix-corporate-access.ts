// scripts/fix-corporate-access.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixCorporateAccess() {
  try {
    console.log('法人アクセス修復ツール実行中...');

    // 1. 全ての法人サブスクリプションを持つユーザーの確認
    const usersWithCorporateSubscription = await prisma.user.findMany({
      where: {
        subscription: {
          OR: [{ plan: { contains: 'business' } }, { plan: { contains: 'enterprise' } }],
          status: 'active',
        },
      },
      include: {
        subscription: true,
        adminOfTenant: true,
        tenant: true,
      },
    });

    console.log(`法人サブスクリプション所有ユーザー: ${usersWithCorporateSubscription.length}名`);

    // 2. 問題のあるユーザーを特定
    for (const user of usersWithCorporateSubscription) {
      console.log(
        `ユーザーID: ${user.id}, メール: ${user.email}, プラン: ${user.subscription?.plan}`,
      );

      // テナント情報チェック
      if (!user.adminOfTenant && !user.tenant) {
        console.log(`  警告: テナント関連付けがありません`);

        // テナントが存在しない場合は作成するかどうか確認する
        // (実行時に確認するためコメントアウト)
        /*
        const newTenant = await prisma.corporateTenant.create({
          data: {
            name: `${user.name || user.email}のテナント`,
            accountStatus: 'active',
            admin: {
              connect: { id: user.id }
            }
          }
        });
        console.log(`  テナント作成: ${newTenant.id}`);
        */
      } else {
        if (user.adminOfTenant) {
          console.log(
            `  管理者テナント: ${user.adminOfTenant.id}, ステータス: ${user.adminOfTenant.accountStatus}`,
          );
        }
        if (user.tenant) {
          console.log(
            `  メンバーテナント: ${user.tenant.id}, ステータス: ${user.tenant.accountStatus}`,
          );
        }
      }

      // サブスクリプション情報チェック
      if (user.subscription) {
        console.log(
          `  サブスクリプション: ${user.subscription.id}, プラン: ${user.subscription.plan}, ステータス: ${user.subscription.status}`,
        );

        // プラン名の正規化が必要か確認
        const normalizedPlan = user.subscription.plan?.toLowerCase().trim();
        if (normalizedPlan !== user.subscription.plan) {
          console.log(
            `  警告: プラン名の正規化が必要 (${user.subscription.plan} -> ${normalizedPlan})`,
          );

          // プラン名を正規化するかどうか確認する
          // (実行時に確認するためコメントアウト)
          /*
          await prisma.subscription.update({
            where: { id: user.subscription.id },
            data: { plan: normalizedPlan }
          });
          console.log(`  プラン名を正規化しました`);
          */
        }
      }

      console.log('---');
    }

    console.log('法人アクセス修復ツール終了');
  } catch (error) {
    console.error('エラー発生:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCorporateAccess().catch((e) => {
  console.error(e);
  process.exit(1);
});