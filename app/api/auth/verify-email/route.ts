// app/api/auth/verify-email/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    if (!token) {
      logger.debug('トークンが提供されていません');
      return NextResponse.redirect(new URL('/auth/signin?error=invalid_token', request.url));
    }
    logger.debug(`メール認証トークン受信`, { tokenPrefix: token.substring(0, 8) });
    // トークンの検証とユーザー情報の取得
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            emailVerified: true,
          },
        },
      },
    });
    // トークンが存在しない場合
    if (!verificationToken) {
      logger.debug('無効なトークン', { exists: false });
      return NextResponse.redirect(new URL('/auth/signin?error=invalid_token', request.url));
    }
    // トークンの期限切れチェック
    if (verificationToken.expires < new Date()) {
      logger.debug('期限切れのトークン', { expired: true });
      // 期限切れトークンを削除
      await prisma.emailVerificationToken.delete({
        where: { token },
      });
      return NextResponse.redirect(new URL('/auth/signin?error=token_expired', request.url));
    }
    // 既に認証済みの場合
    if (verificationToken.user.emailVerified) {
      logger.debug('既に認証済みのユーザー', { userId: verificationToken.user.id });
      // トークンを削除
      await prisma.emailVerificationToken.delete({
        where: { token },
      });
      return NextResponse.redirect(new URL('/auth/signin?message=already_verified', request.url));
    }
    // メール認証を実行
    await prisma.$transaction(async (tx) => {
      // ユーザーのemailVerifiedを更新
      await tx.user.update({
        where: { id: verificationToken.user.id },
        data: {
          emailVerified: new Date(),
        },
      });
      // 認証トークンを削除
      await tx.emailVerificationToken.delete({
        where: { token },
      });
    });
    logger.debug('メール認証完了', { userId: verificationToken.user.id });
    // 認証完了後、ログイン画面にリダイレクト（成功メッセージ付き）
    return NextResponse.redirect(new URL('/auth/signin?message=email_verified', request.url));
  } catch (error) {
    logger.error('メール認証処理エラー:', error);
    return NextResponse.redirect(new URL('/auth/signin?error=verification_failed', request.url));
  }
}