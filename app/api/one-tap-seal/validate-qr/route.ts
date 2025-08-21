// app/api/one-tap-seal/validate-qr/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isValidQrSlug } from '@/lib/one-tap-seal/qr-slug-manager';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'スラッグが必要です' }, { status: 400 });
    }

    // 基本的なバリデーション
    if (!isValidQrSlug(slug)) {
      return NextResponse.json({
        isValid: false,
        isAvailable: false,
        message: '英小文字、数字、ハイフンのみ使用できます',
      });
    }

    if (slug.length < 3) {
      return NextResponse.json({
        isValid: false,
        isAvailable: false,
        message: '3文字以上入力してください',
      });
    }

    // 既存のQRコードページとの重複チェック
    const existingQrCode = await prisma.qrCodePage.findUnique({
      where: { slug },
      select: {
        id: true,
        userId: true,
      },
    });

    if (existingQrCode) {
      const isOwn = existingQrCode.userId === session.user.id;

      return NextResponse.json({
        isValid: true,
        isAvailable: false,
        isOwn,
        message: isOwn ? '既に使用中のスラッグです' : '他のユーザーが使用中です',
        qrCodeId: existingQrCode.id,
      });
    }

    // 利用可能
    return NextResponse.json({
      isValid: true,
      isAvailable: true,
      message: '使用可能です',
    });
  } catch (error) {
    logger.error('QRスラッグ検証エラー:', error);
    return NextResponse.json({ error: '検証に失敗しました' }, { status: 500 });
  }
}