// lib/utils/admin-access-api.ts
import { prisma } from '@/lib/prisma';

/**
 * API用の管理者権限チェック
 * スーパー管理者と財務管理者の両方をサポート
 */
export async function checkAdminAccess(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        financialAdminRecord: {
          select: {
            isActive: true,
          },
        },
      },
    });

    if (!user) {
      return false;
    }

    // スーパー管理者チェック
    const isSuperAdmin =
      user.email === process.env.ADMIN_EMAIL || user.email === 'admin@sns-share.com';

    // 財務管理者チェック（@sns-share.comドメインかつ有効な財務管理者レコードを持つ）
    const isFinancialAdmin =
      user.email.includes('@sns-share.com') && user.financialAdminRecord?.isActive === true;

    return isSuperAdmin || isFinancialAdmin;
  } catch (error) {
    console.error('管理者権限チェックエラー:', error);
    return false;
  }
}

/**
 * 財務管理者権限のみをチェック
 */
export async function checkFinancialAdminAccess(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        financialAdminRecord: {
          select: {
            isActive: true,
          },
        },
      },
    });

    if (!user) {
      return false;
    }

    return user.email.includes('@sns-share.com') && user.financialAdminRecord?.isActive === true;
  } catch (error) {
    console.error('財務管理者権限チェックエラー:', error);
    return false;
  }
}

/**
 * スーパー管理者権限のみをチェック
 */
export async function checkSuperAdminAccess(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      return false;
    }

    return user.email === process.env.ADMIN_EMAIL || user.email === 'admin@sns-share.com';
  } catch (error) {
    console.error('スーパー管理者権限チェックエラー:', error);
    return false;
  }
}