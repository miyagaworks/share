// app/api/qrcode/create/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    // 認証チェック
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // リクエストボディを取得
    const body = await request.json();
    console.log('Request body:', body); // デバッグ用

    const {
      slug,
      template,
      primaryColor,
      secondaryColor,
      accentColor,
      userName,
      profileUrl,
    } = body;

    // 必須フィールドのバリデーション
    if (!slug || !template || !primaryColor || !profileUrl) {
      return NextResponse.json({ error: '必須フィールドが不足しています' }, { status: 400 });
    }

    // スラグの形式チェック
    if (!/^[a-z0-9-]{3,20}$/.test(slug)) {
      return NextResponse.json(
        {
          error: 'スラグは3〜20文字の英小文字、数字、ハイフンのみ使用できます',
        },
        { status: 400 },
      );
    }

    // 既存のQRコードページを検索（slug単位のチェック）
    const existingQrCode = await prisma.qrCodePage.findUnique({
      where: { slug },
    });

    if (existingQrCode) {
      // 自分のものかチェック
      if (existingQrCode.userId !== session.user.id) {
        return NextResponse.json({ error: 'このスラグは既に使用されています' }, { status: 409 });
      }

      // 自分のものなら更新
      const updatedQrCode = await prisma.qrCodePage.update({
        where: { id: existingQrCode.id },
        data: {
          primaryColor,
          secondaryColor: secondaryColor || primaryColor,
          accentColor: accentColor || '#FFFFFF',
          userName: userName || '',
          profileUrl,
        },
      });

      return NextResponse.json({
        success: true,
        qrCode: updatedQrCode,
        url: `/qr/${slug}`,
      });
    }

    // ユーザーの既存QRコードを検索（ユーザーIDによる検索）
    const existingUserQrCode = await prisma.qrCodePage.findFirst({
      where: { userId: session.user.id },
    });

    // ユーザーがすでにQRコードを持っている場合は更新
    if (existingUserQrCode) {
      const updatedQrCode = await prisma.qrCodePage.update({
        where: { id: existingUserQrCode.id },
        data: {
          slug,
          primaryColor,
          secondaryColor: secondaryColor || primaryColor,
          accentColor: accentColor || '#FFFFFF',
          userName: userName || '',
          profileUrl,
        },
      });

      return NextResponse.json({
        success: true,
        qrCode: updatedQrCode,
        url: `/qr/${slug}`,
      });
    }

    // 新しいQRコードページのデータを準備
    const createData = {
      slug,
      userId: session.user.id,
      userName: userName || '',
      profileUrl,
      template,
      primaryColor,
      secondaryColor: secondaryColor || primaryColor,
      accentColor: accentColor || '#FFFFFF',
    };

    console.log('Creating QR code with data:', createData); // デバッグ用

    // 新しいQRコードを作成
    const newQrCode = await prisma.qrCodePage.create({
      data: createData,
    });

    return NextResponse.json({
      success: true,
      qrCode: newQrCode,
      url: `/qr/${slug}`,
    });
  } catch (error) {
    console.error('QRコードページ作成エラー:', error);
    return NextResponse.json(
      { error: `QRコードページの作成に失敗しました: ${error}` },
      { status: 500 },
    );
  }
}