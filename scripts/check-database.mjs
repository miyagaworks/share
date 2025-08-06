// scripts/check-database.mjs
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('🔍 データベース確認開始...\n');

  try {
    // 1. Corporate関連テーブルの存在確認
    console.log('📋 Corporate関連テーブル確認...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%orporate%'
      ORDER BY table_name;
    `;
    console.log('見つかったテーブル:', tables);

    // 2. CorporateActivityLogテーブルの存在確認
    console.log('\n🎯 CorporateActivityLog テーブル確認...');
    const activityTableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'CorporateActivityLog'
      );
    `;
    console.log('CorporateActivityLog存在確認:', activityTableExists);

    // 3. 実際にCorporateActivityLogにアクセス試行
    console.log('\n📊 CorporateActivityLog アクセステスト...');
    try {
      const count = await prisma.corporateActivityLog.count();
      console.log('✅ CorporateActivityLog レコード数:', count);
    } catch (error) {
      console.log('❌ CorporateActivityLog アクセスエラー:', error.message);
      console.log('🔧 エラーコード:', error.code);
    }

    // 4. 問題のユーザー確認
    console.log('\n👤 問題ユーザー確認...');
    try {
      const user = await prisma.user.findUnique({
        where: { email: 'miyagawakiyomi@gmail.com' },
        select: {
          id: true,
          email: true,
          corporateRole: true,
          tenantId: true,
          subscriptionStatus: true,
        },
      });

      if (user) {
        console.log('✅ ユーザー情報:', user);

        // テナント情報も確認
        if (user.tenantId) {
          try {
            const tenant = await prisma.corporateTenant.findUnique({
              where: { id: user.tenantId },
            });
            console.log('🏢 テナント情報:', tenant ? tenant.name : 'テナントが見つかりません');
          } catch (error) {
            console.log('❌ テナント確認エラー:', error.message);
          }
        }

        // 管理しているテナントも確認
        try {
          const adminTenant = await prisma.corporateTenant.findUnique({
            where: { adminId: user.id },
          });
          console.log('👑 管理テナント:', adminTenant ? adminTenant.name : '管理テナントなし');
        } catch (error) {
          console.log('❌ 管理テナント確認エラー:', error.message);
        }
      } else {
        console.log('❌ ユーザーが見つかりません');
      }
    } catch (error) {
      console.log('❌ ユーザー確認エラー:', error.message);
    }

    // 5. 全テナント一覧
    console.log('\n🏢 全テナント一覧...');
    try {
      const tenants = await prisma.corporateTenant.findMany({
        select: {
          id: true,
          name: true,
          adminId: true,
          admin: {
            select: {
              email: true,
            },
          },
        },
      });
      console.log('登録テナント数:', tenants.length);
      tenants.forEach((tenant, index) => {
        console.log(`  ${index + 1}. ${tenant.name} (管理者: ${tenant.admin.email})`);
      });
    } catch (error) {
      console.log('❌ テナント一覧取得エラー:', error.message);
    }
  } catch (error) {
    console.error('❌ 全体エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase().catch(console.error);