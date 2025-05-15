// app/api/qrcode/check-slug/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // URLからクエリパラメータを取得
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { error: 'スラグが指定されていません', available: false },
        { status: 400 },
      );
    }

    // スラグの形式チェック
    if (!/^[a-z0-9-]{3,20}$/.test(slug)) {
      return NextResponse.json(
        {
          error: 'スラグは3〜20文字の英小文字、数字、ハイフンのみ使用できます',
          available: false,
        },
        { status: 400 },
      );
    }

    // 既存のQRコードページを検索
    const existingQrCode = await prisma.qrCodePage.findUnique({
      where: { slug },
    });

    // 存在しなければ使用可能
    return NextResponse.json({
      available: !existingQrCode,
      message: existingQrCode ? 'このスラグは既に使用されています' : '使用可能なスラグです',
    });
  } catch (error) {
    console.error('スラグチェックエラー:', error);
    return NextResponse.json(
      { error: 'スラグのチェックに失敗しました', available: false },
      { status: 500 },
    );
  }
}