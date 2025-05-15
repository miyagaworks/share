// app/api/qrcode/update/[id]/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    // 認証チェック
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // リクエストボディを取得
    const body = await request.json();
    console.log('Update request body:', body); // デバッグ用

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

    // 更新データを準備
    const updateData = {
      primaryColor: body.primaryColor,
      secondaryColor: body.secondaryColor || body.primaryColor,
      accentColor: body.accentColor || '#FFFFFF',
      // 他のフィールドも必要に応じて追加
    };

    // QRコードページを更新
    const updatedQrCode = await prisma.qrCodePage.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      qrCode: updatedQrCode,
      url: `/qr/${existingQrCode.slug}`,
    });
  } catch (error) {
    console.error('QRコードページ更新エラー:', error);
    return NextResponse.json(
      { error: `QRコードページの更新に失敗しました: ${error}` },
      { status: 500 },
    );
  }
}