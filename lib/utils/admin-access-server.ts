// lib/utils/admin-access-server.ts
import { logger } from '@/lib/utils/logger';
import { prisma } from '@/lib/prisma';

// 管理者メールアドレスのリスト（拡張）
const SUPER_ADMIN_EMAILS = ['admin@sns-share.com'];
const FINANCIAL_ADMIN_EMAILS = [
  'admin@sns-share.com', // スーパーAdmin（全権限）
  'yoshitsune@sns-share.com', // 小河原義経（財務Admin）
  'kensei@sns-share.com', // 福島健世（財務Admin）
];

/**
 * ユーザーがスーパー管理者かどうかをチェックする（サーバーサイド専用）
 * @param userId ユーザーID
 * @returns boolean スーパー管理者の場合true
 */
export async function isSuperAdminUser(userId: string | undefined | null): Promise<boolean> {
  if (!userId) return false;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, subscriptionStatus: true },
    });

    if (!user) return false;

    const userEmail = user.email.toLowerCase();
    const isSuperAdminEmail = SUPER_ADMIN_EMAILS.includes(userEmail);

    // 永久利用権ユーザーは管理者から除外（メールベース管理者は除く）
    if (user.subscriptionStatus === 'permanent' && !isSuperAdminEmail) {
      return false;
    }

    // スーパーAdmin判定
    return (
      isSuperAdminEmail ||
      (user.subscriptionStatus === 'admin' && userEmail === 'admin@sns-share.com')
    );
  } catch (error) {
    logger.error('スーパー管理者権限チェックエラー:', error);
    return false;
  }
}

/**
 * ユーザーが財務管理者かどうかをチェックする（サーバーサイド専用）
 * @param userId ユーザーID
 * @returns boolean 財務管理者の場合true
 */
export async function isFinancialAdminUser(userId: string | undefined | null): Promise<boolean> {
  if (!userId) return false;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, subscriptionStatus: true },
    });

    if (!user) return false;

    const userEmail = user.email.toLowerCase();
    const isFinancialAdminEmail = FINANCIAL_ADMIN_EMAILS.includes(userEmail);

    // 永久利用権ユーザーは管理者から除外（メールベース管理者は除く）
    if (user.subscriptionStatus === 'permanent' && !isFinancialAdminEmail) {
      return false;
    }

    // 財務Admin判定（スーパーAdminも財務権限を持つ）
    return isFinancialAdminEmail || user.subscriptionStatus === 'admin';
  } catch (error) {
    logger.error('財務管理者権限チェックエラー:', error);
    return false;
  }
}

/**
 * ユーザーが管理者かどうかをチェックする（後方互換性のため残す）
 * この関数は財務管理者権限をチェックします
 */
export async function isAdminUser(userId: string | undefined | null): Promise<boolean> {
  return isFinancialAdminUser(userId);
}

/**
 * ユーザーの管理者情報を取得する
 * @param userId ユーザーID
 * @returns 管理者情報オブジェクト
 */
export async function getAdminInfo(userId: string | undefined | null): Promise<{
  isSuperAdmin: boolean;
  isFinancialAdmin: boolean;
  userType: 'super_admin' | 'financial_admin' | 'user';
}> {
  if (!userId) {
    return {
      isSuperAdmin: false,
      isFinancialAdmin: false,
      userType: 'user',
    };
  }

  const isSuperAdmin = await isSuperAdminUser(userId);
  const isFinancialAdmin = await isFinancialAdminUser(userId);

  return {
    isSuperAdmin,
    isFinancialAdmin,
    userType: isSuperAdmin ? 'super_admin' : isFinancialAdmin ? 'financial_admin' : 'user',
  };
}