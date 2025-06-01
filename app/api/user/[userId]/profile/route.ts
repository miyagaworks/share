// app/api/user/[userId]/profile/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from "@/lib/utils/logger";
import { prisma } from '@/lib/prisma';
export async function GET(request: Request, { params }: { params: { userId: string } }) {
  try {
    const userId = params.userId;
    if (!userId) {
      return NextResponse.json({ error: 'ユーザーIDが指定されていません' }, { status: 400 });
    }
    // ユーザー情報を取得（必要なフィールドのみ）
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        nameEn: true,
        image: true,
        headerText: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }
    return NextResponse.json({ user });
  } catch (error) {
    logger.error('ユーザープロフィール取得エラー:', error);
    return NextResponse.json(
      { error: 'ユーザープロフィールの取得に失敗しました' },
      { status: 500 },
    );
  }
}