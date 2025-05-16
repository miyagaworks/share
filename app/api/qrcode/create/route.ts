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
    console.log('QRコードデータ受信:', body); // デバッグ用
    console.log('textColor値:', body.textColor); // 特にtextColorをチェック

    const { slug, template, primaryColor, secondaryColor, accentColor, userName, profileUrl } =
      body;

    // 必須フィールドのバリデーション
    if (!slug || !template || !primaryColor || !profileUrl) {
      return NextResponse.json({ error: '必須フィールドが不足しています' }, { status: 400 });
    }

    // 既存のQRコードページを検索
    const existingQrCode = await prisma.qrCodePage.findUnique({
      where: { slug },
    });

    if (existingQrCode) {
      // 自分のものかチェック
      if (existingQrCode.userId !== session.user.id) {
        return NextResponse.json({ error: 'このスラグは既に使用されています' }, { status: 409 });
      }

      // 自分のものなら更新
      try {
        const updatedQrCode = await prisma.qrCodePage.update({
          where: { id: existingQrCode.id },
          data: {
            primaryColor,
            secondaryColor: secondaryColor || primaryColor,
            accentColor: accentColor || '#FFFFFF',
            textColor: body.textColor || '#FFFFFF',
            userName: userName || '',
            profileUrl,
          },
        });

        console.log('Updated existing QR code:', updatedQrCode);

        return NextResponse.json({
          success: true,
          qrCode: updatedQrCode,
          url: `/qr/${slug}`,
        });
      } catch (prismaError) {
        console.error('Prisma update error:', prismaError);
        // Prismaエラーの詳細を確認
        return NextResponse.json(
          { error: `データベース更新エラー: ${prismaError}` },
          { status: 500 },
        );
      }
    }

    // ユーザーの既存QRコードを検索
    const existingUserQrCode = await prisma.qrCodePage.findFirst({
      where: { userId: session.user.id },
    });

    // ユーザーがすでにQRコードを持っている場合は更新
    if (existingUserQrCode) {
      try {
        const updatedQrCode = await prisma.qrCodePage.update({
          where: { id: existingUserQrCode.id },
          data: {
            slug,
            primaryColor,
            secondaryColor: secondaryColor || primaryColor,
            accentColor: accentColor || '#FFFFFF',
            textColor: body.textColor || '#FFFFFF',
            userName: userName || '',
            profileUrl,
          },
        });

        console.log('Updated user QR code:', updatedQrCode);

        return NextResponse.json({
          success: true,
          qrCode: updatedQrCode,
          url: `/qr/${slug}`,
        });
      } catch (prismaError) {
        console.error('Prisma update error:', prismaError);
        return NextResponse.json(
          { error: `データベース更新エラー: ${prismaError}` },
          { status: 500 },
        );
      }
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
      textColor: body.textColor || '#FFFFFF',
    };

    console.log('Creating new QR code with data:', createData);

    try {
      // 新しいQRコードを作成
      const newQrCode = await prisma.qrCodePage.create({
        data: createData,
      });

      console.log('Created new QR code:', newQrCode);

      return NextResponse.json({
        success: true,
        qrCode: newQrCode,
        url: `/qr/${slug}`,
      });
    } catch (prismaError) {
      console.error('Prisma create error:', prismaError);
      return NextResponse.json(
        { error: `データベース作成エラー: ${prismaError}` },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('QRコードページ作成エラー:', error);
    return NextResponse.json(
      { error: `QRコードページの作成に失敗しました: ${error}` },
      { status: 500 },
    );
  }
}