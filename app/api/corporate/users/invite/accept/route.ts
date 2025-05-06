export const dynamic = "force-dynamic";
// app/api/corporate/users/invite/accept/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { token, password, name } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'トークンとパスワードが必要です' }, { status: 400 });
    }

    // トークンを検証
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken || resetToken.expires < new Date()) {
      return NextResponse.json({ error: 'トークンが無効または期限切れです' }, { status: 400 });
    }

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    // トランザクションでユーザー情報を更新
    await prisma.$transaction([
      // ユーザー情報を更新
      prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          name: name || undefined,
          password: hashedPassword,
          emailVerified: new Date(), // 認証済みにする
        },
      }),
      // 使用済みトークンを削除
      prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('招待受け入れエラー:', error);
    return NextResponse.json({ error: '招待の受け入れ中にエラーが発生しました' }, { status: 500 });
  }
}