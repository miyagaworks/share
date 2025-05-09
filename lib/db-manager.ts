// lib/db-manager.ts
import { prisma, disconnectPrisma } from '@/lib/prisma';

// 接続カウント用の型定義
interface PoolStatRecord {
  connection_count: number;
}

/**
 * 型安全なデータベーストランザクションラッパー
 * @param operation 実行するデータベース操作
 * @returns 操作結果
 */
export async function withDatabase<T>(operation: () => Promise<T>): Promise<T> {
  let connected = false;
  try {
    // 操作の実行
    const result = await operation();
    connected = true;
    return result;
  } finally {
    // 接続の解放
    if (connected) {
      await disconnectPrisma();
    }
  }
}

/**
 * 接続のステータスを確認する
 * @returns DBのヘルスチェック結果
 */
export async function checkDatabaseHealth(): Promise<{
  isConnected: boolean;
  connectionCount?: number;
  error?: string;
}> {
  try {
    // 単純なデータベースクエリを実行してヘルスチェック
    const result = await prisma.$queryRaw`SELECT 1 as health`;

    // 接続プールの状態確認（可能であれば）
    let connectionCount: number | undefined;
    try {
      // この部分はPostgreSQLに依存し、実装が不可能な場合は省略可能
      const poolStats = await prisma.$queryRaw<PoolStatRecord[]>`
        SELECT count(*) as connection_count 
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `;
      connectionCount = poolStats[0]?.connection_count;
    } catch (e) {
      // 接続カウント取得に失敗しても続行
      console.warn('接続カウントの取得に失敗:', e);
    }

    return {
      isConnected: Array.isArray(result) && result.length > 0,
      connectionCount,
    };
  } catch (error) {
    console.error('データベース健全性チェックエラー:', error);
    return {
      isConnected: false,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    await disconnectPrisma();
  }
}