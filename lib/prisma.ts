// lib/prisma.ts
import { PrismaClient, Prisma } from '@prisma/client';

// グローバル型宣言を修正
declare global {
  // 正しい型定義
  let prisma: PrismaClient | undefined;
}

// 接続の統計情報
let connectionAttempts = 0;
let lastConnectionError: Error | null = null;
let lastSuccessfulConnection = 0;
let queryCount = 0;

// 効率的な接続プールを設定したPrismaClientを作成する関数
function createPrismaClient() {
  // 接続試行回数を記録
  connectionAttempts++;
  console.log(`[Prisma] 接続試行 #${connectionAttempts}`);

  // 正確なログレベルの型を使用
  const logLevels: Prisma.LogLevel[] =
    process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'];

  // Prismaクライアントの作成
  const client = new PrismaClient({
    log: logLevels,
  });

  // ミドルウェアを使用して接続状態を管理
  client.$use(async (params, next) => {
    try {
      // クエリ実行前の処理
      const startTime = Date.now();
      queryCount++;

      // 開発環境でのみクエリをログ出力
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Prisma] クエリ #${queryCount}: ${params.model}.${params.action}`);
      }

      // クエリ実行（成功したら接続も成功と判断）
      const result = await next(params);

      // 接続成功を記録
      if (!lastSuccessfulConnection) {
        lastSuccessfulConnection = Date.now();
        console.log(`[Prisma] 接続成功 (${new Date(lastSuccessfulConnection).toISOString()})`);
      }

      // 開発環境でのみクエリ完了をログ出力
      if (process.env.NODE_ENV === 'development') {
        const duration = Date.now() - startTime;
        console.log(`[Prisma] クエリ #${queryCount} 完了: ${duration}ms`);
      }

      return result;
    } catch (error) {
      // エラーオブジェクトのプロパティアクセスを型安全に行う
      const prismaError = error as { code?: string; message?: string };

      // 接続エラーの特別処理
      if (
        prismaError.code?.includes('P1001') ||
        prismaError.code?.includes('P1017') ||
        prismaError.code?.includes('P2024')
      ) {
        console.error(`[Prisma] 接続エラー [${prismaError.code}]:`, prismaError.message);

        // 接続エラー統計の更新
        lastConnectionError = error as Error;
        lastSuccessfulConnection = 0; // 接続成功フラグをリセット
      } else {
        // その他のエラー
        console.error(`[Prisma] クエリエラー:`, error);
      }

      throw error;
    }
  });

  return client;
}

// 型安全なグローバルオブジェクト
const globalWithPrisma = global as typeof global & {
  prisma?: PrismaClient;
};

// プロセスの再起動と環境を考慮したクライアント初期化
export const prisma = globalWithPrisma.prisma || createPrismaClient();

// 開発環境でのみグローバル変数に保存（本番環境では毎回新しいインスタンスを作成）
if (process.env.NODE_ENV !== 'production') {
  globalWithPrisma.prisma = prisma;
}

// 明示的な接続解放関数
export async function disconnectPrisma(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log(`[Prisma] 切断完了 (${new Date().toISOString()})`);
  } catch (e) {
    console.error('[Prisma] 切断エラー:', e);
  }
}

// 現在の接続状態を取得する関数
export function getPrismaConnectionStatus() {
  return {
    attempts: connectionAttempts,
    queryCount,
    lastError: lastConnectionError
      ? {
          message: lastConnectionError.message,
          stack: lastConnectionError.stack,
          time: new Date().toISOString(),
        }
      : null,
    lastSuccess: lastSuccessfulConnection ? new Date(lastSuccessfulConnection).toISOString() : null,
    uptime: lastSuccessfulConnection
      ? Math.floor((Date.now() - lastSuccessfulConnection) / 1000)
      : 0,
  };
}

// データベース接続のヘルスチェック関数
export async function checkDatabaseHealth() {
  try {
    // 単純なクエリで接続確認
    await prisma.$queryRaw`SELECT 1 as health`;
    return {
      connected: true,
      timestamp: new Date().toISOString(),
      stats: getPrismaConnectionStatus(),
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
      stats: getPrismaConnectionStatus(),
    };
  }
}