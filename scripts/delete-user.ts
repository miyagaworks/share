// scripts/delete-user.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const EMAIL_TO_DELETE = 'jimoemon@gmail.com';

async function deleteUser() {
  try {
    console.log(`ユーザー削除処理開始: ${EMAIL_TO_DELETE}`);

    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email: EMAIL_TO_DELETE },
      include: {
        adminOfTenant: true,
        tenant: true,
        subscription: true,
        profile: true,
      },
    });

    if (!user) {
      console.log('ユーザーが見つかりません');
      return;
    }

    console.log(`削除対象ユーザー: ID=${user.id}, メール=${user.email}`);

    // 1. プロフィールの削除
    if (user.profile) {
      console.log(`プロフィールを削除: ${user.profile.id}`);
      await prisma.profile.delete({
        where: { id: user.profile.id },
      });
    }

    // 2. サブスクリプションの削除
    if (user.subscription) {
      console.log(`サブスクリプションを削除: ${user.subscription.id}`);
      await prisma.subscription.delete({
        where: { id: user.subscription.id },
      });
    }

    // 3. テナント関連の処理
    // 管理者テナントを別のユーザーに移管するか、削除するかを選択
    if (user.adminOfTenant) {
      const tenantId = user.adminOfTenant.id;
      const membersCount = await prisma.user.count({
        where: { tenantId: tenantId },
      });

      if (membersCount > 0) {
        console.log(`警告: 管理者テナント(${tenantId})には${membersCount}人のメンバーがいます`);
        console.log('管理者テナントは削除せず、管理者なしの状態にします');

        // テナントの管理者IDをnullにする（RAWクエリを使用）
        try {
          // 注意: この操作はスキーマに依存するため失敗する可能性があります
          console.log('管理者テナントから管理者関連を削除を試みます');
          await prisma.$executeRawUnsafe(
            `UPDATE "CorporateTenant" SET "adminId" = NULL WHERE id = '${tenantId}'`,
          );
          console.log('管理者関連を削除しました');
        } catch (error) {
          console.error(
            '管理者関連の削除に失敗しました。スキーマにNOT NULL制約がある可能性:',
            error,
          );
          console.log('処理を中断します');
          return;
        }
      } else {
        // メンバーがいない場合はテナントを削除
        console.log(`管理者テナント(${tenantId})にメンバーはいないため削除します`);
        await prisma.corporateTenant.delete({
          where: { id: tenantId },
        });
      }
    }

    // 4. メンバーテナント関連を解除
    if (user.tenant) {
      console.log(`メンバーテナント関連を解除: ${user.tenant.id}`);
      await prisma.user.update({
        where: { id: user.id },
        data: { tenantId: null },
      });
    }

    // 5. 最終的にユーザーを削除
    console.log(`ユーザーを削除: ID=${user.id}, メール=${user.email}`);
    await prisma.user.delete({
      where: { id: user.id },
    });

    console.log('ユーザー削除が完了しました');
  } catch (error) {
    console.error('ユーザー削除中にエラーが発生しました:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteUser().catch((e) => {
  console.error(e);
  process.exit(1);
});
