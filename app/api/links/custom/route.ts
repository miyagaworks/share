// app/api/links/custom/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/utils/logger';
const CustomLinkCreateSchema = z.object({
  name: z.string().min(1, { message: 'リンク名を入力してください' }),
  url: z.string().url({ message: '有効なURLを入力してください' }),
});
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }
    const body = await req.json();
    const validationResult = CustomLinkCreateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ error: '入力データが無効です' }, { status: 400 });
    }
    const data = validationResult.data;
    // 最大表示順を取得
    const maxOrderResult = await prisma.customLink.findFirst({
      where: { userId: session.user.id },
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true },
    });
    const nextOrder = maxOrderResult ? maxOrderResult.displayOrder + 1 : 1;
    // カスタムリンクを作成
    const newCustomLink = await prisma.customLink.create({
      data: {
        userId: session.user.id,
        name: data.name,
        url: data.url,
        displayOrder: nextOrder,
      },
    });
    return NextResponse.json({
      success: true,
      customLink: newCustomLink,
    });
  } catch (error) {
    logger.error('カスタムリンク作成エラー:', error);
    return NextResponse.json({ error: 'カスタムリンクの作成に失敗しました' }, { status: 500 });
  }
}