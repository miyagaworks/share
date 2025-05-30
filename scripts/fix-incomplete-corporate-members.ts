// scripts/fix-incomplete-corporate-members.ts (ES Module対応版)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixIncompleteCorporateMembers() {
  console.log('🔧 不完全な法人メンバーの修正を開始します...');

  try {
    // 1. corporateRole が 'member' だが tenantId がないユーザーを検索
    const incompleteMembers = await prisma.user.findMany({
      where: {
        corporateRole: 'member',
        tenantId: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        corporateRole: true,
        tenantId: true,
        createdAt: true,
      },
    });

    console.log(`📊 不完全なメンバー数: ${incompleteMembers.length}人`);

    if (incompleteMembers.length === 0) {
      console.log('✅ 修正が必要なメンバーはいません');
      return;
    }

    // 2. 各不完全メンバーの招待記録を確認してテナントを特定
    const fixedMembers = [];
    const failedMembers = [];

    for (const member of incompleteMembers) {
      try {
        console.log(`🔍 ${member.email} の招待記録を検索中...`);

        // 招待記録からテナントを特定
        const inviteLog = await prisma.corporateActivityLog.findFirst({
          where: {
            action: 'invite_user',
            entityId: member.id,
          },
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                accountStatus: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        if (!inviteLog?.tenant) {
          console.log(`❌ ${member.email}: 招待記録が見つかりません`);
          failedMembers.push({
            ...member,
            reason: '招待記録が見つかりません',
          });
          continue;
        }

        // テナントが停止されていないかチェック
        if (inviteLog.tenant.accountStatus === 'suspended') {
          console.log(`⚠️  ${member.email}: テナント ${inviteLog.tenant.name} は停止中`);
          failedMembers.push({
            ...member,
            reason: 'テナントが停止中',
            tenantId: inviteLog.tenant.id,
            tenantName: inviteLog.tenant.name,
          });
          continue;
        }

        // 3. tenantId を設定
        await prisma.user.update({
          where: { id: member.id },
          data: {
            tenantId: inviteLog.tenant.id,
          },
        });

        console.log(
          `✅ ${member.email}: テナント ${inviteLog.tenant.name} (${inviteLog.tenant.id}) に関連付けました`,
        );

        fixedMembers.push({
          ...member,
          tenantId: inviteLog.tenant.id,
          tenantName: inviteLog.tenant.name,
        });

        // 修正のアクティビティログを記録
        await prisma.corporateActivityLog.create({
          data: {
            tenantId: inviteLog.tenant.id,
            userId: member.id,
            action: 'fix_member_tenant',
            entityType: 'user',
            entityId: member.id,
            description: `不完全な招待メンバー ${member.email} のテナント関連付けを修正しました`,
            metadata: {
              email: member.email,
              previousTenantId: null,
              newTenantId: inviteLog.tenant.id,
              fixedAt: new Date().toISOString(),
            },
          },
        });
      } catch (error) {
        console.error(`❌ ${member.email} の修正中にエラー:`, error);
        failedMembers.push({
          ...member,
          reason: `修正エラー: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }

    // 4. 結果の表示
    console.log('\n📈 修正結果:');
    console.log(`✅ 修正成功: ${fixedMembers.length}人`);
    console.log(`❌ 修正失敗: ${failedMembers.length}人`);

    if (fixedMembers.length > 0) {
      console.log('\n✅ 修正成功したメンバー:');
      fixedMembers.forEach((member) => {
        console.log(`  - ${member.email} → ${member.tenantName} (${member.tenantId})`);
      });
    }

    if (failedMembers.length > 0) {
      console.log('\n❌ 修正失敗したメンバー:');
      failedMembers.forEach((member) => {
        console.log(`  - ${member.email}: ${member.reason}`);
      });
    }

    console.log('\n🎉 修正処理が完了しました');
  } catch (error) {
    console.error('❌ 修正処理中に致命的エラーが発生:', error);
    throw error;
  }
}

// 🔥 修正: ES Module対応のメイン実行部分
const isMainModule = process.argv[1] === new URL(import.meta.url).pathname;

if (isMainModule) {
  fixIncompleteCorporateMembers()
    .then(() => {
      console.log('✅ スクリプト実行完了');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ スクリプト実行失敗:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { fixIncompleteCorporateMembers };