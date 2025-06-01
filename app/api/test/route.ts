// app/api/test/route.ts (まずこれでテスト)
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from "@/lib/utils/logger";
export async function GET() {
  try {
    logger.debug('🔧 テストAPI呼び出し');
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'API is working',
    });
  } catch (error) {
    logger.error('🔧 テストAPIエラー:', error);
    return NextResponse.json(
      {
        error: 'Test API failed',
        details: String(error),
      },
      { status: 500 },
    );
  }
}