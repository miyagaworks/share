// lib/prisma.ts (Prisma v5対応版)
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/utils/logger';

// グローバル型宣言
declare global {
  let prisma: PrismaClient | undefined;
}

// 接続の統計情報
let connectionAttempts = 0;
let lastConnectionError: Error | null = null;
let lastSuccessfulConnection = 0;
let queryCount = 0;

// ブラウザ環境検出
const isServer = typeof window === 'undefined';

// 効率的な接続プールを設定したPrismaClientを作成する関数
function createPrismaClient() {
  // ブラウザ環境での実行を防止
  if (!isServer) {
    logger.warn(
      'ブラウザ環境での実行は許可されていません。サーバーコンポーネントまたはAPI Routeを使用してください。',
    );
    // ブラウザ環境用のダミーオブジェクト（エラーを投げるプロキシ）
    return new Proxy({} as PrismaClient, {
      get() {
        throw new Error(
          'PrismaClientはブラウザ環境で実行できません。サーバーコンポーネントまたはAPIルートを使用してください。',
        );
      },
    });
  }

  // 接続試行回数を記録
  connectionAttempts++;
  logger.debug(`接続試行 #${connectionAttempts}`);

  // Prismaクライアントの作成（Prisma v5対応）
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
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
if (process.env.NODE_ENV !== 'production' && isServer) {
  globalWithPrisma.prisma = prisma;
}

// 明示的な接続解放関数
export async function disconnectPrisma(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info(`切断完了 (${new Date().toISOString()})`);
  } catch (e) {
    logger.error('切断エラー:', e);
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
    lastSuccessfulConnection = Date.now();
    return {
      connected: true,
      timestamp: new Date().toISOString(),
      stats: getPrismaConnectionStatus(),
    };
  } catch (error) {
    lastConnectionError = error as Error;
    return {
      connected: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
      stats: getPrismaConnectionStatus(),
    };
  }
}

// safeQuery関数
export async function safeQuery<T>(queryFn: () => Promise<T>): Promise<T> {
  const isServer = typeof window === 'undefined';

  if (!isServer) {
    throw new Error('safeQueryはサーバーサイドでのみ実行可能です');
  }

  try {
    queryCount++;
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`クエリ #${queryCount} 実行中`);
    }

    const result = await queryFn();

    // 成功時の統計更新
    if (!lastSuccessfulConnection) {
      lastSuccessfulConnection = Date.now();
      logger.info(`接続成功 (${new Date(lastSuccessfulConnection).toISOString()})`);
    }

    return result;
  } catch (error) {
    logger.error('safeQuery エラー:', error);

    // 特定のエラーコードに対する処理
    if (error instanceof Error) {
      // 接続エラーの場合
      if (error.message.includes('connection') || error.message.includes('timeout')) {
        logger.error('データベース接続エラーが発生しました');
        lastConnectionError = error;
        lastSuccessfulConnection = 0;
      }

      // テーブルが存在しないエラーの場合
      if (error.message.includes('does not exist') || error.message.includes('relation')) {
        logger.error('データベーステーブルまたはリレーションエラー');
      }
    }

    throw error;
  }
}

// ensurePrismaConnection関数
export async function ensurePrismaConnection(): Promise<boolean> {
  const isServer = typeof window === 'undefined';

  if (!isServer) return false;

  try {
    // シンプルな接続テスト
    await prisma.$queryRaw`SELECT 1 as test`;
    logger.debug('Prisma接続確認: OK');
    lastSuccessfulConnection = Date.now();
    return true;
  } catch (error) {
    logger.error('Prisma接続確認エラー:', error);
    lastConnectionError = error as Error;
    return false;
  }
}