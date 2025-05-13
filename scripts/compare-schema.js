// scripts/compare-schema.js
import { readFileSync } from 'fs';
import pg from 'pg';
const { Client } = pg;

// Prismaスキーマからモデル（テーブル）名を抽出する関数
function extractPrismaModels(prismaSchema) {
  const modelRegex = /model\s+(\w+)\s+{/g;
  const models = [];
  let match;

  while ((match = modelRegex.exec(prismaSchema)) !== null) {
    models.push(match[1]);
  }

  return models;
}

// メイン実行関数
async function compareSchemas() {
  // Prismaスキーマのファイルを読み込み
  const prismaSchema = readFileSync('./prisma/schema.prisma', 'utf8');

  // Prismaモデル一覧を取得
  const prismaModels = extractPrismaModels(prismaSchema);
  console.log('Prismaモデル一覧:', prismaModels);

  // データベース接続
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();

    // データベースのテーブル一覧を取得
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    const dbTables = res.rows.map((row) => row.table_name);
    console.log('データベーステーブル一覧:', dbTables);

    // Prismaにないテーブルを特定
    const tablesToDrop = dbTables.filter((table) => !prismaModels.includes(table));
    console.log('削除対象テーブル:', tablesToDrop);

    // 削除用SQLの生成
    if (tablesToDrop.length > 0) {
      console.log('\n削除用SQL:');
      tablesToDrop.forEach((table) => {
        console.log(`DROP TABLE IF EXISTS "${table}" CASCADE;`);
      });
    } else {
      console.log('\n削除対象のテーブルはありません');
    }
  } finally {
    await client.end();
  }
}

compareSchemas().catch(console.error);