// app/api/touch-seal/validate-qr/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isValidQrSlug } from '@/lib/touch-seal/qr-slug-manager';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { error: 'スラグが指定されていません', isValid: false },
        { status: 400 },
      );
    }

    // 形式チェック
    if (!isValidQrSlug(slug)) {
      return NextResponse.json({
        isValid: false,
        error: 'スラグは3〜20文字の英小文字、数字、ハイフンのみ使用できます',
      });
    }

    // 既存チェック
    const existingQrCode = await prisma.qrCodePage.findUnique({
      where: { slug },
      select: { userId: true, id: true },
    });

    if (!existingQrCode) {
      return NextResponse.json({
        isValid: true,
        isAvailable: true,
        message: '使用可能なスラグです',
      });
    }

    // 自分のQRコードかチェック
    const isOwn = existingQrCode.userId === session.user.id;

    return NextResponse.json({
      isValid: true,
      isAvailable: false,
      isOwn,
      qrCodeId: isOwn ? existingQrCode.id : null,
      message: isOwn
        ? 'このスラグは既にあなたが使用しています'
        : 'このスラグは既に使用されています',
    });
  } catch (error) {
    logger.error('QRスラッグ検証エラー:', error);
    return NextResponse.json(
      { error: 'スラグの検証に失敗しました', isValid: false },
      { status: 500 },
    );
  }
}