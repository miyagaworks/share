// scripts/update-permanent-users-plan.ts
import { PrismaClient } from '@prisma/client';

// 具体的な型を定義してany型を避ける
interface LogData {
  [key: string]: string | number | boolean | object | undefined | null;
}

// loggerの代わりに直接consoleを使用する
const simpleLogger = {
  info: (message: string, data?: LogData) => {
    console.log(`[INFO] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message: string, data?: LogData) => {
    console.error(`[ERROR] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
};

// ユーザー結果の型定義
interface UserUpdateResult {
  userId: string;
  name: string | null;
  success: boolean;
  oldPlan: string;
  newPlan?: string;
  error?: string;
}

// スクリプト実行結果の型定義
interface ScriptResult {
  total: number;
  updated: number;
  failed: number;
  results: UserUpdateResult[];
}

// 永久利用権ユーザーのプランを business_plus に更新するスクリプト
async function updatePermanentUsersPlans(): Promise<ScriptResult> {
  const prisma = new PrismaClient();

  try {
    // ログ出力開始
    simpleLogger.info('永久利用権ユーザーのプラン更新を開始します');

    // 永久利用権ユーザーの検索 - adminOfTenant 情報も取得
    const permanentUsers = await prisma.user.findMany({
      where: {
        subscriptionStatus: 'permanent',
      },
      include: {
        subscription: true,
        adminOfTenant: true, // 法人管理者情報を含める
      },
    });

    console.log(`永久利用権ユーザー数: ${permanentUsers.length}人`);

    // 更新対象ユーザーの集計
    const usersWithSubscription = permanentUsers.filter((user) => user.subscription);
    console.log(`サブスクリプション情報あり: ${usersWithSubscription.length}人`);

    const usersWithWrongPlan = usersWithSubscription.filter(
      (user) => user.subscription && user.subscription.plan !== 'business_plus',
    );
    console.log(`プラン更新対象: ${usersWithWrongPlan.length}人`);

    // 更新処理
    const updatedResults: UserUpdateResult[] = await Promise.all(
      usersWithWrongPlan.map(async (user) => {
        // 現在のプラン情報をログ出力
        const oldPlan = user.subscription?.plan || 'なし';

        try {
          // サブスクリプション更新
          await prisma.subscription.update({
            where: { userId: user.id },
            data: {
              plan: 'business_plus',
            },
          });

          // テナント情報も更新（ユーザー上限を50人に）
          if (user.adminOfTenant) {
            await prisma.corporateTenant.update({
              where: { id: user.adminOfTenant.id },
              data: {
                maxUsers: 50,
              },
            });
          }

          console.log(
            `ユーザー ${user.id} (${user.name || 'ユーザー名なし'}): ${oldPlan} → business_plus に更新完了`,
          );
          return {
            userId: user.id,
            name: user.name,
            success: true,
            oldPlan,
            newPlan: 'business_plus',
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`ユーザー ${user.id} の更新に失敗:`, errorMessage);
          return { userId: user.id, name: user.name, success: false, oldPlan, error: errorMessage };
        }
      }),
    );

    // 更新結果の集計
    const successCount = updatedResults.filter((r) => r.success).length;
    const failCount = updatedResults.filter((r) => !r.success).length;

    console.log('\n===== 更新結果サマリー =====');
    console.log(`成功: ${successCount}件`);
    console.log(`失敗: ${failCount}件`);

    if (failCount > 0) {
      console.log('\n失敗したユーザー:');
      updatedResults
        .filter((r) => !r.success)
        .forEach((r) => {
          console.log(`- ${r.userId} (${r.name || 'ユーザー名なし'}): ${r.error}`);
        });
    }

    simpleLogger.info('永久利用権ユーザーのプラン更新が完了しました', {
      total: permanentUsers.length,
      updated: successCount,
      failed: failCount,
    });

    return {
      total: permanentUsers.length,
      updated: successCount,
      failed: failCount,
      results: updatedResults,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('スクリプト実行中にエラーが発生しました:', errorMessage);
    simpleLogger.error('永久利用権ユーザーのプラン更新中にエラーが発生しました', {
      error: errorMessage,
    });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// メインの実行関数
const main = async () => {
  try {
    const result = await updatePermanentUsersPlans();
    console.log('スクリプト実行完了:', result);
    process.exit(0);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('スクリプト実行エラー:', errorMessage);
    process.exit(1);
  }
};

// ファイルが直接実行された場合はmain関数を実行
// ESMでは import.meta.url を使ってモジュールの URL を取得できる
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// モジュールとしてインポートできるようにエクスポート
export { updatePermanentUsersPlans };