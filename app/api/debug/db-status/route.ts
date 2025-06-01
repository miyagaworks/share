// app/api/debug/db-status/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { checkDatabaseHealth, getPrismaConnectionStatus } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';

export async function GET() {
  try {
    logger.info('[Debug] データベース状況確認開始');
    
    // データベース接続状況の確認
    const healthCheck = await checkDatabaseHealth();
    const connectionStatus = getPrismaConnectionStatus();
    
    // 環境変数の状況（機密情報は除く）
    const envStatus = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? '設定あり' : 'なし',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '設定あり' : 'なし',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    };
    
    const response = {
      timestamp: new Date().toISOString(),
      health: healthCheck,
      connection: connectionStatus,
      environment: envStatus,
      success: healthCheck.connected,
    };
    
    logger.info('[Debug] データベース状況:', response);
    
    return NextResponse.json(response, {
      status: healthCheck.connected ? 200 : 500,
    });
    
  } catch (error) {
    logger.error('[Debug] データベース状況確認エラー:', error);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      success: false,
    }, {
      status: 500,
    });
  }
}