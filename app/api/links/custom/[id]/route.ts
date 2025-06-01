// app/api/links/custom/[id]/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/utils/logger";
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
// 更新リクエストのスキーマ
const UpdateCustomLinkSchema = z.object({
  name: z.string().min(1, { message: 'リンク名を入力してください' }),
  url: z.string().url({ message: '有効なURLを入力してください' }),
});
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }
    const linkId = params.id;
    // リンクの存在確認
    const link = await prisma.customLink.findFirst({
      where: {
        id: linkId,
        userId: session.user.id,
      },
    });
    if (!link) {
      return NextResponse.json({ error: 'リンクが見つかりません' }, { status: 404 });
    }
    // リクエストボディの取得
    const body = await req.json();
    // バリデーション
    const validatedFields = UpdateCustomLinkSchema.safeParse(body);
    if (!validatedFields.success) {
      return NextResponse.json({ error: '入力データが無効です' }, { status: 400 });
    }
    const { name, url } = validatedFields.data;
    // リンクの更新
    const updatedLink = await prisma.customLink.update({
      where: { id: linkId },
      data: {
        name,
        url,
      },
    });
    // キャッシュの更新
    revalidatePath('/dashboard/links');
    revalidatePath('/dashboard');
    return NextResponse.json({
      success: true,
      link: updatedLink,
    });
  } catch (error) {
    logger.error('カスタムリンク更新エラー:', error);
    return NextResponse.json({ error: 'カスタムリンクの更新に失敗しました' }, { status: 500 });
  }
}
// 削除用のエンドポイントも同じファイルに追加しておく
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }
    const linkId = params.id;
    // リンクの存在確認
    const link = await prisma.customLink.findFirst({
      where: {
        id: linkId,
        userId: session.user.id,
      },
    });
    if (!link) {
      return NextResponse.json({ error: 'リンクが見つかりません' }, { status: 404 });
    }
    // リンクを削除
    await prisma.customLink.delete({
      where: { id: linkId },
    });
    // 残りのリンクの表示順を再調整
    const remainingLinks = await prisma.customLink.findMany({
      where: { userId: session.user.id },
      orderBy: { displayOrder: 'asc' },
    });
    // 表示順を更新
    for (let i = 0; i < remainingLinks.length; i++) {
      await prisma.customLink.update({
        where: { id: remainingLinks[i].id },
        data: { displayOrder: i + 1 },
      });
    }
    // キャッシュの更新
    revalidatePath('/dashboard/links');
    revalidatePath('/dashboard');
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('カスタムリンク削除エラー:', error);
    return NextResponse.json({ error: 'カスタムリンクの削除に失敗しました' }, { status: 500 });
  }
}
