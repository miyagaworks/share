// app/api/corporate-member/links/custom/[id]/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// バリデーションスキーマ
const CustomLinkUpdateSchema = z.object({
  name: z.string().min(1, '名前は必須です'),
  url: z.string().url({ message: '有効なURLを入力してください' }),
  displayOrder: z.number().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // リクエストボディの取得
    const body = await req.json();

    // データの検証
    const validationResult = CustomLinkUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.flatten();
      return NextResponse.json({ error: '入力データが無効です', details: errors }, { status: 400 });
    }

    const data = validationResult.data;

    // 指定されたカスタムリンクを検索
    const customLink = await prisma.customLink.findUnique({
      where: {
        id: params.id,
      },
    });

    // リンクが存在しない場合はエラー
    if (!customLink) {
      return NextResponse.json({ error: 'カスタムリンクが見つかりません' }, { status: 404 });
    }

    // 権限チェック
    if (customLink.userId !== session.user.id) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }

    // カスタムリンクを更新
    const updatedCustomLink = await prisma.customLink.update({
      where: {
        id: params.id,
      },
      data: {
        name: data.name,
        url: data.url,
        displayOrder: data.displayOrder || customLink.displayOrder,
      },
    });

    return NextResponse.json({
      success: true,
      customLink: updatedCustomLink,
    });
  } catch (error) {
    console.error('カスタムリンク更新エラー:', error);
    return NextResponse.json({ error: 'カスタムリンクの更新に失敗しました' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // 指定されたカスタムリンクを検索
    const customLink = await prisma.customLink.findUnique({
      where: {
        id: params.id,
      },
    });

    // リンクが存在しない場合はエラー
    if (!customLink) {
      return NextResponse.json({ error: 'カスタムリンクが見つかりません' }, { status: 404 });
    }

    // 権限チェック
    if (customLink.userId !== session.user.id) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }

    // カスタムリンクを削除
    await prisma.customLink.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'カスタムリンクを削除しました',
    });
  } catch (error) {
    console.error('カスタムリンク削除エラー:', error);
    return NextResponse.json({ error: 'カスタムリンクの削除に失敗しました' }, { status: 500 });
  }
}
