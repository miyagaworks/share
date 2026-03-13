// lib/partner/accounts.ts
// パートナーのアカウント数管理・上限チェック

import { prisma } from '@/lib/prisma';

export type WarningLevel = 'normal' | 'warning' | 'critical';

export interface AccountLimitStatus {
  currentCount: number;
  maxAccounts: number;
  canAddMore: boolean;
  warningLevel: WarningLevel;
}

/**
 * パートナー配下の全アカウント数を計算
 * = テナント所属ユーザー数 + パートナー直属の個人ユーザー数
 */
export async function countPartnerAccounts(partnerId: string): Promise<number> {
  const [tenantUsers, personalUsers] = await Promise.all([
    // パートナー配下の全テナントに属するユーザー数（デモアカウント除外）
    prisma.user.count({
      where: { tenant: { partnerId }, isDemo: false },
    }),
    // パートナー経由の個人ユーザー数（デモアカウント除外）
    prisma.user.count({
      where: { partnerId, isDemo: false },
    }),
  ]);

  return tenantUsers + personalUsers;
}

/**
 * アカウント上限チェック（警告レベル付き）
 */
export async function checkAccountLimit(partnerId: string): Promise<AccountLimitStatus> {
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    select: { maxAccounts: true },
  });

  if (!partner) {
    return {
      currentCount: 0,
      maxAccounts: 0,
      canAddMore: false,
      warningLevel: 'critical',
    };
  }

  const currentCount = await countPartnerAccounts(partnerId);
  const ratio = currentCount / partner.maxAccounts;

  return {
    currentCount,
    maxAccounts: partner.maxAccounts,
    canAddMore: currentCount < partner.maxAccounts,
    warningLevel: ratio >= 0.9 ? 'critical' : ratio >= 0.8 ? 'warning' : 'normal',
  };
}
