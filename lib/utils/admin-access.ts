// lib/utils/admin-access.ts
import { prisma } from '@/lib/prisma';

// 管理者メールアドレスのリスト
const ADMIN_EMAILS = ['admin@sns-share.com'];

/**
 * ユーザーが管理者かどうかをチェックする
 */
export async function isAdminUser(userId: string | undefined | null): Promise<boolean> {
  if (!userId) return false;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) return false;

    // メールアドレスが管理者リストに含まれているかチェック
    return ADMIN_EMAILS.includes(user.email.toLowerCase());
  } catch (error) {
    console.error('管理者権限チェックエラー:', error);
    return false;
  }
}