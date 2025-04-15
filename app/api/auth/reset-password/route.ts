// app/api/auth/reset-password/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json({ message: 'トークンとパスワードが必要です' }, { status: 400 });
    }

    // 本番環境のログ出力を制限
    if (process.env.NODE_ENV !== 'production') {
      console.log(`パスワードリセット試行: トークン ${token.substring(0, 8)}...`);
    }

    // トークンの検証
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    // トークンが存在しない、または期限切れの場合
    if (!resetToken || resetToken.expires < new Date()) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`無効なトークン: ${!resetToken ? 'トークンが存在しません' : '期限切れです'}`);
      }

      return NextResponse.json({ message: '無効または期限切れのトークンです' }, { status: 400 });
    }

    // パスワードのハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    // ユーザーのパスワードを更新
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    // 使用済みのトークンを削除
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`パスワードがリセットされました: ユーザーID ${resetToken.userId}`);
    }

    return NextResponse.json({ message: 'パスワードが正常にリセットされました' }, { status: 200 });
  } catch (error) {
    console.error('パスワードリセットエラー:', error);
    return NextResponse.json({ message: '処理中にエラーが発生しました' }, { status: 500 });
  }
}