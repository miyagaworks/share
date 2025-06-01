// app/api/system/connection-status/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getPrismaConnectionStatus, prisma } from '@/lib/prisma';
export async function GET() {
  try {
    // 簡単なデータベースクエリを実行してヘルスチェック
    const isConnected = await prisma.$queryRaw`SELECT 1 as health`
      .then(() => true)
      .catch(() => false);
    // 現在の接続統計を取得
    const connectionStats = getPrismaConnectionStatus();
    return NextResponse.json({
      isConnected,
      stats: connectionStats,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
    });
  } catch (error) {
    return NextResponse.json(
      {
        isConnected: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}