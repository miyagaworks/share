// app/api/system/connection-status/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { checkDatabaseHealth, prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // データベース接続のヘルスチェック
    const healthCheck = await checkDatabaseHealth();

    // 簡単な統計情報を取得
    const userCount = await prisma.user.count();

    return NextResponse.json({
      database: {
        connected: healthCheck.connected,
        timestamp: healthCheck.timestamp,
        userCount,
      },
      server: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      },
    });
  } catch (error) {
    console.error('Connection status check failed:', error);

    return NextResponse.json(
      {
        database: {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
        server: {
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
        },
      },
      { status: 500 },
    );
  }
}