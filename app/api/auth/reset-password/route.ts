export const dynamic = "force-dynamic";
// app/api/auth/reset-password/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { logger } from '@/lib/utils/logger';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json({ message: 'トークンとパスワードが必要です' }, { status: 400 });
    }

    // 統合ロガーを使用
    logger.debug(`パスワードリセット試行`, { tokenPrefix: token.substring(0, 4) });

    // トークンの検証
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    // トークンが存在しない場合
    if (!resetToken) {
      logger.debug(`無効なトークン`, { exists: false });
      return NextResponse.json({ message: '無効または期限切れのトークンです' }, { status: 400 });
    }

    // 期限切れかどうか別途チェック
    if (resetToken.expires < new Date()) {
      logger.debug(`期限切れのトークン`, { expired: true });
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

    logger.debug(`パスワードリセット完了`, { userId: resetToken.userId });
    return NextResponse.json({ message: 'パスワードが正常にリセットされました' }, { status: 200 });
  } catch (error) {
    logger.error('パスワードリセットエラー:', error);
    return NextResponse.json({ message: '処理中にエラーが発生しました' }, { status: 500 });
  }
}