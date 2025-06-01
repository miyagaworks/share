// app/api/qrcode/update/[id]/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    // 認証チェック
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // リクエストボディを取得
    const body = await request.json();
    logger.debug('Update request body:', body); // デバッグ用

    // 既存のQRコードページを検索
    const existingQrCode = await prisma.qrCodePage.findUnique({
      where: { id },
    });

    if (!existingQrCode) {
      return NextResponse.json({ error: 'QRコードページが見つかりません' }, { status: 404 });
    }

    // 所有者チェック
    if (existingQrCode.userId !== session.user.id) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }

    // スラグの更新がある場合は重複チェック
    if (body.slug && body.slug !== existingQrCode.slug) {
      const slugExists = await prisma.qrCodePage.findUnique({
        where: { slug: body.slug },
      });
      if (slugExists) {
        return NextResponse.json(
          {
            error: 'このスラグは既に使用されています',
            currentSlug: existingQrCode.slug,
          },
          { status: 409 },
        );
      }
    }

    // 更新データを準備
    const updateData = {
      primaryColor: body.primaryColor,
      secondaryColor: body.secondaryColor || body.primaryColor,
      accentColor: body.accentColor || '#FFFFFF',
      textColor: body.textColor || '#FFFFFF',
      userName: body.userName || existingQrCode.userName,
      // nameEn フィールドはスキーマに存在しない場合は除外
      slug: body.slug || existingQrCode.slug, // スラグも更新可能に
    };

    // QRコードページを更新
    const updatedQrCode = await prisma.qrCodePage.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      qrCode: updatedQrCode,
      url: `/qr/${updatedQrCode.slug}`,
    });
  } catch (error) {
    logger.error('QRコードページ更新エラー:', error);
    return NextResponse.json(
      { error: `QRコードページの更新に失敗しました: ${error}` },
      { status: 500 },
    );
  }
}