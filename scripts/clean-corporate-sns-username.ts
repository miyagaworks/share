// scripts/clean-corporate-sns-username.ts
import { PrismaClient } from '@prisma/client';

async function cleanupCorporateSnsUsernames() {
  const prisma = new PrismaClient();

  try {
    console.log('法人SNSリンクのusernameフィールドクリーンアップを開始します...');

    // すべての法人SNSリンクを取得
    const links = await prisma.corporateSnsLink.findMany();
    console.log(`${links.length}件の法人SNSリンクが見つかりました`);

    // usernameをnullに設定
    const results = await prisma.corporateSnsLink.updateMany({
      data: {
        username: null,
      },
    });

    console.log(`${results.count}件の法人SNSリンクを更新しました`);
    console.log('クリーンアップが完了しました');
  } catch (error) {
    console.error('クリーンアップ中にエラーが発生しました:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupCorporateSnsUsernames().catch((e) => {
  console.error(e);
  process.exit(1);
});