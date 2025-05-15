// app/api/qrcode/create/route.ts
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
      // nameEn, headerText, textColorは使用しない
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

    // 既存のQRコードページを検索
    const existingQrCode = await prisma.qrCodePage.findUnique({
      where: { slug },
    });

    if (existingQrCode) {
      return NextResponse.json({ error: 'このスラグは既に使用されています' }, { status: 409 });
    }

    // 新しいQRコードページのデータを準備（スキーマに合わせて必要なフィールドのみを含む）
    const createData = {
      slug,
      userId: session.user.id,
      userName: userName || '',
      profileUrl,
      template,
      primaryColor,
      secondaryColor: secondaryColor || primaryColor,
      accentColor: accentColor || '#FFFFFF',
      // headerText, textColor, nameEnは含めない
    };

    console.log('Creating QR code with data:', createData); // デバッグ用

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