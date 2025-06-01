// app/api/cron/cleanup-idempotency/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from "@/lib/utils/logger";
import { cleanUpExpiredIdempotencyRequests } from '@/lib/utils/idempotency';
export async function GET(request: Request) {
  try {
    // リクエスト元が許可されたものか確認（Vercel Cron など）
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: '不正なアクセスです' }, { status: 401 });
    }
    const deletedCount = await cleanUpExpiredIdempotencyRequests();
    return NextResponse.json({
      success: true,
      deletedCount,
      message: `${deletedCount}件の期限切れ冪等性リクエストを削除しました`,
    });
  } catch (error) {
    logger.error('クリーンアップエラー:', error);
    return NextResponse.json({ error: 'クリーンアップに失敗しました' }, { status: 500 });
  }
}