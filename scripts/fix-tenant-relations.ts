// scripts/fix-tenant-relations.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixTenantRelations() {
  try {
    console.log('テナント関連修復ツール実行中...');

    // 全ての法人サブスクリプションを持つユーザーを取得
    const users = await prisma.user.findMany({
      where: {
        OR: [{ adminOfTenant: { isNot: null } }, { tenant: { isNot: null } }],
      },
      include: {
        adminOfTenant: true,
        tenant: true,
        subscription: true,
      },
    });

    console.log(`テナント関連付けのあるユーザー: ${users.length}名`);

    for (const user of users) {
      console.log(`\nユーザーID: ${user.id}, メール: ${user.email}`);

      // 管理者テナントとメンバーテナントの両方を持っている場合
      if (user.adminOfTenant && user.tenant) {
        console.log(`  管理者テナント: ${user.adminOfTenant.id}`);
        console.log(`  メンバーテナント: ${user.tenant.id}`);

        // 同じテナントIDを管理者とメンバーの両方として持っている場合
        if (user.adminOfTenant.id === user.tenant.id) {
          console.log(`  問題: 同じテナントを管理者とメンバーの両方として持っています`);
          console.log(`  修正: メンバーテナント関連付けを削除します`);

          // メンバーテナント関連付けを削除
          await prisma.user.update({
            where: { id: user.id },
            data: {
              tenantId: null,
            },
          });

          console.log(`  修正完了: メンバーテナント関連付けを削除しました`);
        }
        // 異なるテナントを管理者とメンバーとして持っている場合
        else {
          console.log(`  問題: 異なるテナントを管理者とメンバーとして持っています`);

          // 管理者のいないテナントを作らないようにするため、ユーザーの役割や状況に応じて決定
          if (user.corporateRole === 'admin') {
            console.log(`  ユーザーの役割: admin - 管理者テナントのみを維持します`);
            console.log(`  修正: メンバーテナント関連付けを削除します`);

            await prisma.user.update({
              where: { id: user.id },
              data: {
                tenantId: null,
              },
            });

            console.log(`  修正完了: メンバーテナント関連付けを削除しました`);
          } else {
            // メンバーとして扱う場合の処理
            console.log(
              `  ユーザーの役割: ${user.corporateRole || 'member'} - メンバーとして処理します`,
            );
            console.log(`  問題: 管理者テナントを持っていますが、メンバーとして扱います`);
            console.log(`  修正: 別の管理者が必要です。現時点では変更せず検討が必要です`);

            // このケースでは両方の関連を残しておく（別の管理者がいるかどうか確認する必要がある）
            console.log(`  現状維持: 管理者テナントとメンバーテナントの両方を維持します`);

            // ユーザーの役割が設定されていない場合は設定
            if (!user.corporateRole) {
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  corporateRole: 'member',
                },
              });

              console.log(`  補助修正: ユーザー役割を'member'に設定しました`);
            }
          }
        }
      } else if (user.adminOfTenant) {
        console.log(`  管理者テナント: ${user.adminOfTenant.id}`);
        // ユーザーの役割が「admin」でない場合は設定
        if (user.corporateRole !== 'admin') {
          console.log(`  修正: 管理者テナントがあるのでユーザー役割を'admin'に設定します`);

          await prisma.user.update({
            where: { id: user.id },
            data: {
              corporateRole: 'admin',
            },
          });

          console.log(`  修正完了: ユーザー役割を'admin'に設定しました`);
        }
      } else if (user.tenant) {
        console.log(`  メンバーテナント: ${user.tenant.id}`);
        // ユーザーの役割が設定されていない場合はデフォルト値を設定
        if (!user.corporateRole) {
          console.log(`  修正: メンバーテナントがあるのでユーザー役割を'member'に設定します`);

          await prisma.user.update({
            where: { id: user.id },
            data: {
              corporateRole: 'member',
            },
          });

          console.log(`  修正完了: ユーザー役割を'member'に設定しました`);
        }
      }
    }

    console.log('\nテナント関連修復ツール終了');
  } catch (error) {
    console.error('エラー発生:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTenantRelations().catch((e) => {
  console.error(e);
  process.exit(1);
});