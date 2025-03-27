// scripts/generate-prisma-migration.js
// Prismaマイグレーションを生成するためのスクリプト
// このスクリプトは直接実行するものではなく、必要なコマンドをガイドするものです

console.log('Prismaマイグレーションの準備ガイド');
console.log('----------------------------------------');
console.log('このスクリプトはPrismaマイグレーションを実行するための手順を示しています。\n');

console.log('1. スキーマの変更を検証する:');
console.log('   npx prisma validate\n');

console.log('2. マイグレーションファイルを生成する:');
console.log('   npx prisma migrate dev --name add_subscription_models\n');

console.log('3. 開発環境でマイグレーションを適用する:');
console.log('   npx prisma migrate dev\n');

console.log('4. Prismaクライアントを生成する:');
console.log('   npx prisma generate\n');

console.log('5. 本番環境でマイグレーションを適用する:');
console.log('   npx prisma migrate deploy\n');

console.log('注意事項:');
console.log('- マイグレーション前にデータベースのバックアップを取ることをお勧めします');
console.log('- 本番環境でマイグレーションを実行する前に、必ずステージング環境でテストしてください');
console.log('- マイグレーション後、コメントアウトされたコードを有効化してください\n');

console.log('----------------------------------------');
console.log('サブスクリプション関連のコードをアンコメントするファイル:');
console.log('1. app/api/webhook/stripe/route.ts');
console.log('2. app/api/subscription/route.ts');
console.log('3. app/api/subscription/create/route.ts');
console.log('4. app/api/subscription/reactivate/route.ts');
console.log('5. app/api/subscription/cancel/route.ts');
console.log('6. app/api/subscription/change-plan/route.ts\n');

console.log('注: このスクリプトはガイドを表示するだけで、実際のマイグレーションは行いません。');
console.log('上記のコマンドをターミナルで順番に実行してください。');