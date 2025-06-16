// scripts/cleanup-duplicate-google-account.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDuplicateGoogleAccount() {
  try {
    console.log('🚀 重複Googleアカウントのクリーンアップを開始...');

    // 対象ユーザーの現在の状況を確認
    const user = await prisma.user.findUnique({
      where: { email: 'miyagawakiyomi@gmail.com' },
      include: {
        accounts: true,
      },
    });

    if (!user) {
      console.log('❌ ユーザーが見つかりません');
      return;
    }

    console.log('👤 ユーザー情報:', {
      id: user.id,
      email: user.email,
      hasPassword: !!user.password,
      accountCount: user.accounts.length,
      providers: user.accounts.map((a) => a.provider),
    });

    // パスワードがあるのにGoogleアカウントも存在する場合
    if (user.password && user.accounts.some((a) => a.provider === 'google')) {
      console.log('🔧 重複アカウント検出 - Googleアカウント連携を削除します');

      // Googleアカウント連携を削除
      const deleteResult = await prisma.account.deleteMany({
        where: {
          userId: user.id,
          provider: 'google',
        },
      });

      console.log(`✅ 削除されたGoogleアカウント連携数: ${deleteResult.count}`);

      // 削除後の状態を確認
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          accounts: true,
        },
      });

      console.log('📊 削除後の状態:', {
        accountCount: updatedUser?.accounts.length || 0,
        providers: updatedUser?.accounts.map((a) => a.provider) || [],
      });
    } else {
      console.log('ℹ️ クリーンアップの必要はありません');
    }

    console.log('🎉 クリーンアップ完了');
  } catch (error) {
    console.error('💥 エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプト実行
cleanupDuplicateGoogleAccount();

export { cleanupDuplicateGoogleAccount };