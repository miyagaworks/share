// scripts/migrate-text-settings.ts
import { PrismaClient } from '@prisma/client';

async function migrateTextSettingsToTenant() {
  console.log('テキスト設定の移行を開始します...');

  const prisma = new PrismaClient();

  try {
    // 管理者ユーザーと関連テナントを取得
    const adminUsers = await prisma.user.findMany({
      where: {
        adminOfTenant: { isNot: null },
      },
      include: {
        adminOfTenant: true,
      },
    });

    console.log(`${adminUsers.length}人の管理者ユーザーが見つかりました`);

    // 各管理者のテキスト設定をテナントに移行
    for (const user of adminUsers) {
      if (user.adminOfTenant && (user.headerText || user.textColor)) {
        console.log(`ユーザー ${user.id} (${user.name || 'no name'}) のテキスト設定を移行します`);

        try {
          await prisma.corporateTenant.update({
            where: { id: user.adminOfTenant.id },
            data: {
              headerText: user.headerText,
              textColor: user.textColor,
              // secondaryColorはユーザーから移行しない（管理者が直接設定）
            },
          });

          console.log(`テナント ${user.adminOfTenant.id} (${user.adminOfTenant.name}) に移行完了`);
        } catch (error) {
          console.error(`テナント ${user.adminOfTenant.id} の更新に失敗しました:`, error);
        }
      }
    }

    console.log('移行が完了しました');
  } catch (error) {
    console.error('移行中にエラーが発生しました:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプトを実行
migrateTextSettingsToTenant().catch((error) => {
  console.error('スクリプト実行中にエラーが発生しました:', error);
  process.exit(1);
});