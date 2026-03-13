// lib/partner/report.ts
// パートナー利用レポート集計ロジック

import { prisma } from '@/lib/prisma';

export interface MonthlyReportData {
  year: number;
  month: number;
  // アカウント数
  totalAccountsStart: number;
  totalAccountsEnd: number;
  accountsChange: number;
  // 新規
  newTenants: number;
  newUsers: number;
  // プロフィール
  totalProfileViews: number;
  // 前月比
  previousMonth: {
    totalAccountsEnd: number;
    newTenants: number;
    newUsers: number;
    totalProfileViews: number;
  } | null;
}

/**
 * 指定月のレポートデータを集計
 */
export async function generateMonthlyReport(
  partnerId: string,
  year: number,
  month: number,
): Promise<MonthlyReportData> {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
  const startOfPrevMonth = new Date(year, month - 2, 1);
  const endOfPrevMonth = new Date(year, month - 1, 0, 23, 59, 59, 999);

  // 月初のアカウント数（月初日より前に作成されたユーザー数）
  const [accountsStart, accountsEnd, newTenants, newUsers, profileViews] =
    await Promise.all([
      // 月初時点のアカウント数
      prisma.user.count({
        where: {
          isDemo: false,
          createdAt: { lt: startOfMonth },
          OR: [
            { partnerId },
            { tenant: { partnerId } },
          ],
        },
      }),
      // 月末時点のアカウント数
      prisma.user.count({
        where: {
          isDemo: false,
          createdAt: { lte: endOfMonth },
          OR: [
            { partnerId },
            { tenant: { partnerId } },
          ],
        },
      }),
      // 新規テナント数
      prisma.corporateTenant.count({
        where: {
          partnerId,
          createdAt: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      // 新規ユーザー数
      prisma.user.count({
        where: {
          isDemo: false,
          createdAt: { gte: startOfMonth, lte: endOfMonth },
          OR: [
            { partnerId },
            { tenant: { partnerId } },
          ],
        },
      }),
      // プロフィール閲覧数合計（全期間の累計からの差分は取れないため、全プロフィールの views 合計を使用）
      prisma.profile.aggregate({
        _sum: { views: true },
        where: {
          user: {
            OR: [
              { partnerId },
              { tenant: { partnerId } },
            ],
          },
        },
      }),
    ]);

  // 前月データ
  const [prevAccountsEnd, prevNewTenants, prevNewUsers, prevProfileViews] =
    await Promise.all([
      prisma.user.count({
        where: {
          isDemo: false,
          createdAt: { lte: endOfPrevMonth },
          OR: [
            { partnerId },
            { tenant: { partnerId } },
          ],
        },
      }),
      prisma.corporateTenant.count({
        where: {
          partnerId,
          createdAt: { gte: startOfPrevMonth, lte: endOfPrevMonth },
        },
      }),
      prisma.user.count({
        where: {
          isDemo: false,
          createdAt: { gte: startOfPrevMonth, lte: endOfPrevMonth },
          OR: [
            { partnerId },
            { tenant: { partnerId } },
          ],
        },
      }),
      prisma.profile.aggregate({
        _sum: { views: true },
        where: {
          user: {
            OR: [
              { partnerId },
              { tenant: { partnerId } },
            ],
          },
        },
      }),
    ]);

  return {
    year,
    month,
    totalAccountsStart: accountsStart,
    totalAccountsEnd: accountsEnd,
    accountsChange: accountsEnd - accountsStart,
    newTenants,
    newUsers,
    totalProfileViews: profileViews._sum.views || 0,
    previousMonth: {
      totalAccountsEnd: prevAccountsEnd,
      newTenants: prevNewTenants,
      newUsers: prevNewUsers,
      totalProfileViews: prevProfileViews._sum.views || 0,
    },
  };
}

/**
 * レポートデータをCSV文字列に変換
 */
export function reportToCSV(reports: MonthlyReportData[]): string {
  const headers = [
    '年月',
    '月初アカウント数',
    '月末アカウント数',
    '増減',
    '新規テナント数',
    '新規ユーザー数',
    'プロフィール閲覧数',
  ];

  const rows = reports.map((r) => [
    `${r.year}/${String(r.month).padStart(2, '0')}`,
    r.totalAccountsStart,
    r.totalAccountsEnd,
    r.accountsChange >= 0 ? `+${r.accountsChange}` : r.accountsChange,
    r.newTenants,
    r.newUsers,
    r.totalProfileViews,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
