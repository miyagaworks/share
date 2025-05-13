// app/api/test-db/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 単純なデータベースクエリを実行
    const count = await prisma.user.count();

    return NextResponse.json({
      status: 'success',
      message: 'データベース接続が正常です',
      userCount: count,
    });
  } catch (error) {
    console.error('データベース接続テストエラー:', error);

    return NextResponse.json(
      {
        status: 'error',
        message: 'データベース接続エラー',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
