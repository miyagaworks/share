// app/api/qrcode/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from "@/lib/utils/logger";
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
export async function GET() {
  try {
    // 認証チェック
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }
    // ユーザーのQRコードページ一覧を取得
    const qrCodes = await prisma.qrCodePage.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ qrCodes });
  } catch (error) {
    logger.error('QRコードページ一覧取得エラー:', error);
    return NextResponse.json({ error: 'QRコードページ一覧の取得に失敗しました' }, { status: 500 });
  }
}