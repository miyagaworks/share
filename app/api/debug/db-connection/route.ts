// app/api/debug/db-connection/route.ts (修正版)
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import {
  prisma,
  checkDatabaseHealth,
  ensurePrismaConnection,
  getPrismaConnectionStatus,
  // 🔧 修正: 存在しない関数を削除
  // reconnectPrisma, ← これを削除
} from '@/lib/prisma';

export async function GET() {
  const startTime = Date.now();

  try {
    logger.info('データベース接続デバッグAPI開始');

    // 1. 基本的な接続チェック
    const healthCheck = await checkDatabaseHealth();

    // 2. 接続統計情報
    const connectionStats = getPrismaConnectionStatus();

    // 3. 環境変数チェック
    const envCheck = {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasDirectUrl: !!process.env.DIRECT_URL,
      nodeEnv: process.env.NODE_ENV,
    };

    // 4. 簡単なクエリテスト
    let queryTest = null;
    try {
      const result = await prisma.$queryRaw`SELECT current_timestamp as now, version() as version`;
      queryTest = {
        success: true,
        result: result,
      };
    } catch (error) {
      queryTest = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }

    // 5. テーブル存在確認
    let tableCheck = null;
    try {
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `;
      tableCheck = {
        success: true,
        tableCount: Array.isArray(tables) ? tables.length : 0,
        tables: Array.isArray(tables) ? tables.slice(0, 10) : [],
      };
    } catch (error) {
      tableCheck = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }

    const response = {
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - startTime,
      healthCheck,
      connectionStats,
      envCheck,
      queryTest,
      tableCheck,
      diagnostics: {
        isServerSide: typeof window === 'undefined',
        prismaVersion: '5.x',
      },
    };

    logger.info('データベース接続デバッグ完了', {
      connected: healthCheck.connected,
      processingTime: Date.now() - startTime,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error('データベース接続デバッグエラー:', error);

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}

// POST: 🔧 修正: 簡易的な再初期化処理
export async function POST() {
  const startTime = Date.now();

  try {
    logger.info('データベース接続確認開始');

    // 接続確認のみ実行
    const isConnected = await ensurePrismaConnection();

    // 再接続後のヘルスチェック
    const healthCheck = await checkDatabaseHealth();

    const response = {
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - startTime,
      reconnectResult: isConnected,
      healthCheck,
      message: isConnected ? '接続確認が成功しました' : '接続確認に失敗しました',
    };

    logger.info('データベース接続確認完了', {
      success: isConnected,
      processingTime: Date.now() - startTime,
    });

    return NextResponse.json(response, {
      status: isConnected ? 200 : 500,
    });
  } catch (error) {
    logger.error('データベース接続確認エラー:', error);

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
        message: '接続確認中にエラーが発生しました',
      },
      { status: 500 },
    );
  }
}