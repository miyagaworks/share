export const dynamic = "force-dynamic";
// app/api/auth/verify-reset-token/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ message: 'トークンが必要です' }, { status: 400 });
    }

    // ログ出力を統合ロガーを使用
    logger.debug(`トークン検証リクエスト受信`, { tokenPrefix: token.substring(0, 4) });

    // トークンの検証
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    // トークンが存在しない、または期限切れの場合
    if (!resetToken) {
      logger.debug(`無効なトークン`, { exists: false });
      return NextResponse.json({ message: '無効または期限切れのトークンです' }, { status: 400 });
    }

    // 期限切れかどうか別途チェック
    if (resetToken.expires < new Date()) {
      logger.debug(`期限切れのトークン`, { expired: true });
      return NextResponse.json({ message: '無効または期限切れのトークンです' }, { status: 400 });
    }

    logger.debug(`有効なトークンを確認`, { userId: resetToken.userId });
    return NextResponse.json({ message: '有効なトークンです' }, { status: 200 });
  } catch (error) {
    logger.error('トークン検証エラー:', error);
    return NextResponse.json({ message: '処理中にエラーが発生しました' }, { status: 500 });
  }
}