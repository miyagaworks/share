// lib/utils/emailVerification.ts
import { prisma } from '@/lib/prisma';

// メール認証状況をチェックするヘルパー関数
export async function checkUserEmailVerification(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true },
    });

    return !!(user && user.emailVerified);
  } catch (error) {
    console.error('メール認証状況確認エラー:', error);
    return false; // エラー時は未認証として扱う
  }
}

// 認証トークンの有効性をチェック
export async function validateEmailVerificationToken(token: string) {
  try {
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationToken) {
      return { valid: false, error: 'トークンが見つかりません' };
    }

    if (verificationToken.expires < new Date()) {
      return { valid: false, error: 'トークンの有効期限が切れています' };
    }

    return {
      valid: true,
      userId: verificationToken.userId,
      user: verificationToken.user,
    };
  } catch (error) {
    console.error('トークン検証エラー:', error);
    return { valid: false, error: 'トークンの検証中にエラーが発生しました' };
  }
}