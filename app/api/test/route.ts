// app/api/test/route.ts (まずこれでテスト)
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔧 テストAPI呼び出し');

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'API is working',
    });
  } catch (error) {
    console.error('🔧 テストAPIエラー:', error);
    return NextResponse.json(
      {
        error: 'Test API failed',
        details: String(error),
      },
      { status: 500 },
    );
  }
}