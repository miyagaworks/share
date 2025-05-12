// scripts/set-trial-end-date.mjs
import { PrismaClient } from '@prisma/client';
import { addDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  try {
    // テスト用メールアドレスを指定（既存ユーザーのメールアドレスを使用）
    const userEmail = 'miyagawakiyomi@gmail.com'; // ここを実際のメールアドレスに変更

    // 2日後の日付を設定
    const trialEndDate = addDays(new Date(), 2);

    // ユーザーのトライアル終了日を更新
    const updatedUser = await prisma.user.update({
      where: { email: userEmail },
      data: { trialEndsAt: trialEndDate },
    });

    console.log(
      `ユーザー ${updatedUser.id} (${updatedUser.email}) のトライアル終了日を ${trialEndDate.toISOString()} に設定しました`,
    );
  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();