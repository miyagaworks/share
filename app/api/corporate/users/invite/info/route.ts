// app/api/corporate/users/invite/info/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'トークンが必要です' }, { status: 400 });
    }

    // トークンに関連するユーザー情報を取得
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken || resetToken.expires < new Date()) {
      return NextResponse.json({ error: 'トークンが無効または期限切れです' }, { status: 400 });
    }

    // ユーザー情報を返す
    return NextResponse.json({
      userId: resetToken.userId,
      email: resetToken.user.email,
      name: resetToken.user.name || '',
    });
  } catch (error) {
    console.error('招待情報取得エラー:', error);
    return NextResponse.json(
      { error: 'ユーザー情報の取得中にエラーが発生しました' },
      { status: 500 },
    );
  }
}