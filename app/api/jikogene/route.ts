// app/api/jikogene/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';

// Prismaクライアントのインスタンスを作成
const prisma = new PrismaClient();

/**
 * 自己紹介生成APIのルートハンドラー
 * ユーザー情報を取得し、ジェネレーターへ必要な情報を渡す
 */
export async function GET() {
  try {
    // セッションからユーザー情報を取得（新しい認証方法に対応）
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // ユーザー情報をデータベースから取得
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        phone: true,
        nameEn: true,
        bio: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 自己紹介生成に必要な情報を返す
    return NextResponse.json({
      success: true,
      user: {
        name: user.name,
        nameEn: user.nameEn,
        occupation: user.company || '',
        phone: user.phone || '',
        currentBio: user.bio || '',
      },
    });
  } catch (error) {
    console.error('自己紹介情報取得エラー:', error);
    return NextResponse.json(
      { error: '自己紹介情報の取得中にエラーが発生しました' },
      { status: 500 },
    );
  }
}
