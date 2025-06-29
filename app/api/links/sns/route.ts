// app/api/links/sns/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/utils/logger";
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
// バリデーションスキーマ
const SnsLinkCreateSchema = z.object({
  platform: z.string(),
  username: z.string().nullable().optional(),
  url: z.string().url({ message: '有効なURLを入力してください' }),
});
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }
    const body = await req.json();
    const validationResult = SnsLinkCreateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ error: '入力データが無効です' }, { status: 400 });
    }
    const data = validationResult.data;
    // 同じプラットフォームのリンクが既に存在するか確認
    const existingSnsLink = await prisma.snsLink.findFirst({
      where: {
        userId: session.user.id,
        platform: data.platform,
      },
    });
    if (existingSnsLink) {
      return NextResponse.json(
        { error: `既に${data.platform}のリンクが登録されています` },
        { status: 400 },
      );
    }
    // 最大表示順を取得
    const maxOrderResult = await prisma.snsLink.findFirst({
      where: { userId: session.user.id },
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true },
    });
    const nextOrder = maxOrderResult ? maxOrderResult.displayOrder + 1 : 1;
    // SNSリンクを作成
    const newSnsLink = await prisma.snsLink.create({
      data: {
        userId: session.user.id,
        platform: data.platform,
        username: data.username,
        url: data.url,
        displayOrder: nextOrder,
      },
    });
    return NextResponse.json({
      success: true,
      snsLink: newSnsLink,
    });
  } catch (error) {
    logger.error('SNSリンク作成エラー:', error);
    return NextResponse.json({ error: 'SNSリンクの作成に失敗しました' }, { status: 500 });
  }
}