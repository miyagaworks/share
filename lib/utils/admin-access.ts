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
      select: { email: true, subscriptionStatus: true },
    });

    if (!user) return false;

    // 条件1: メールアドレスが管理者リストに含まれている
    const isAdminEmail = ADMIN_EMAILS.includes(user.email.toLowerCase());

    // 条件2: subscriptionStatus が "admin" または "permanent" に設定されている
    const hasAdminStatus =
      user.subscriptionStatus === 'admin' || user.subscriptionStatus === 'permanent';

    // どちらかの条件を満たしていれば管理者
    return isAdminEmail || hasAdminStatus;
  } catch (error) {
    console.error('管理者権限チェックエラー:', error);
    return false;
  }
}