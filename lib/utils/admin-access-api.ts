// lib/utils/admin-access-api.ts
import { prisma } from '@/lib/prisma';
import { SUPER_ADMIN_EMAIL, isSuperAdmin as isSuperAdminEmail, isAdminEmailDomain } from '@/lib/auth/constants';

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
      user.email === process.env.ADMIN_EMAIL || isSuperAdminEmail(user.email);

    // 財務管理者チェック（管理者ドメインかつ有効な財務管理者レコードを持つ）
    const isFinancialAdmin =
      isAdminEmailDomain(user.email) && user.financialAdminRecord?.isActive === true;

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

    return isAdminEmailDomain(user.email) && user.financialAdminRecord?.isActive === true;
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

    return user.email === process.env.ADMIN_EMAIL || isSuperAdminEmail(user.email);
  } catch (error) {
    console.error('スーパー管理者権限チェックエラー:', error);
    return false;
  }
}