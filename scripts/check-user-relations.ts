// scripts/check-user-relations.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const EMAIL_TO_CHECK = 'jimoemon@gmail.com';

async function checkUserRelations() {
  try {
    console.log(`ユーザー関連データ確認: ${EMAIL_TO_CHECK}`);

    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email: EMAIL_TO_CHECK },
      include: {
        adminOfTenant: true,
        tenant: true,
        subscription: true,
        profile: true,
        // 他の関連データも必要に応じて追加
      },
    });

    if (!user) {
      console.log('ユーザーが見つかりません');
      return;
    }

    console.log(`ユーザーID: ${user.id}`);
    console.log(`メールアドレス: ${user.email}`);
    console.log(`名前: ${user.name}`);
    console.log(`管理者テナント: ${user.adminOfTenant ? user.adminOfTenant.id : 'なし'}`);
    console.log(`メンバーテナント: ${user.tenant ? user.tenant.id : 'なし'}`);
    console.log(`サブスクリプション: ${user.subscription ? user.subscription.id : 'なし'}`);
    console.log(`プロフィール: ${user.profile ? user.profile.id : 'なし'}`);

    // テナントの所属ユーザー数を確認
    if (user.adminOfTenant) {
      const adminTenantMembersCount = await prisma.user.count({
        where: { tenantId: user.adminOfTenant.id },
      });
      console.log(`管理者テナントのメンバー数: ${adminTenantMembersCount}`);
    }

    if (user.tenant && (!user.adminOfTenant || user.adminOfTenant.id !== user.tenant.id)) {
      const memberTenantMembersCount = await prisma.user.count({
        where: { tenantId: user.tenant.id },
      });
      console.log(`メンバーテナントのメンバー数: ${memberTenantMembersCount}`);

      // そのテナントの管理者を確認
      const tenantAdmin = await prisma.user.findFirst({
        where: { adminOfTenant: { id: user.tenant.id } },
      });
      console.log(`メンバーテナントの管理者: ${tenantAdmin ? tenantAdmin.email : '管理者なし'}`);
    }
  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserRelations().catch((e) => {
  console.error(e);
  process.exit(1);
});
