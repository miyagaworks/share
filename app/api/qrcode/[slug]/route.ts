// app/api/qrcode/[slug]/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  try {
    const slug = params.slug;

    if (!slug) {
      return NextResponse.json({ error: 'スラグが指定されていません' }, { status: 400 });
    }

    // QRコードページを検索（select句を使用しない）
    const qrCode = await prisma.qrCodePage.findUnique({
      where: { slug },
      // select句は使用せず、デフォルトでモデルに存在するフィールドのみ取得
    });

    if (!qrCode) {
      return NextResponse.json({ error: 'QRコードページが見つかりません' }, { status: 404 });
    }

    // アクセスカウントを増やす
    await prisma.qrCodePage.update({
      where: { id: qrCode.id },
      data: {
        views: { increment: 1 },
        lastAccessed: new Date(),
      },
    });

    return NextResponse.json({ qrCode });
  } catch (error) {
    console.error('QRコードページ取得エラー:', error);
    return NextResponse.json({ error: 'QRコードページの取得に失敗しました' }, { status: 500 });
  }
}