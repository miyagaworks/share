// lib/partner/__tests__/report.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPrismaMock, type PrismaMock } from '@/__tests__/helpers/prisma-mock';

vi.mock('@/lib/prisma', () => ({
  prisma: createPrismaMock(),
}));

import { prisma } from '@/lib/prisma';
import { generateMonthlyReport, reportToCSV } from '@/lib/partner/report';

const prismaMock = prisma as unknown as PrismaMock;

describe('generateMonthlyReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('指定月のレポートデータを正しく集計する', async () => {
    // 当月データ
    prismaMock.user.count
      .mockResolvedValueOnce(80)   // accountsStart
      .mockResolvedValueOnce(100)  // accountsEnd
      .mockResolvedValueOnce(20);  // newUsers
    prismaMock.corporateTenant.count.mockResolvedValueOnce(2); // newTenants
    prismaMock.profile.aggregate.mockResolvedValueOnce({
      _sum: { views: 5000 },
    });

    // 前月データ
    prismaMock.user.count
      .mockResolvedValueOnce(75)   // prevAccountsEnd
      .mockResolvedValueOnce(15);  // prevNewUsers
    prismaMock.corporateTenant.count.mockResolvedValueOnce(1); // prevNewTenants
    prismaMock.profile.aggregate.mockResolvedValueOnce({
      _sum: { views: 4000 },
    });

    const report = await generateMonthlyReport('partner-1', 2026, 3);

    expect(report.year).toBe(2026);
    expect(report.month).toBe(3);
    expect(report.totalAccountsStart).toBe(80);
    expect(report.totalAccountsEnd).toBe(100);
    expect(report.accountsChange).toBe(20);
    expect(report.newTenants).toBe(2);
    expect(report.newUsers).toBe(20);
    expect(report.totalProfileViews).toBe(5000);
    expect(report.previousMonth).not.toBeNull();
    expect(report.previousMonth!.totalAccountsEnd).toBe(75);
    expect(report.previousMonth!.newTenants).toBe(1);
    expect(report.previousMonth!.newUsers).toBe(15);
  });

  it('閲覧数がnullの場合は0を返す', async () => {
    prismaMock.user.count.mockResolvedValue(0);
    prismaMock.corporateTenant.count.mockResolvedValue(0);
    prismaMock.profile.aggregate.mockResolvedValue({
      _sum: { views: null },
    });

    const report = await generateMonthlyReport('partner-1', 2026, 1);
    expect(report.totalProfileViews).toBe(0);
  });
});

describe('reportToCSV', () => {
  it('レポートデータをCSV形式に変換する', () => {
    const reports = [
      {
        year: 2026,
        month: 3,
        totalAccountsStart: 80,
        totalAccountsEnd: 100,
        accountsChange: 20,
        newTenants: 2,
        newUsers: 20,
        totalProfileViews: 5000,
        previousMonth: null,
      },
      {
        year: 2026,
        month: 2,
        totalAccountsStart: 70,
        totalAccountsEnd: 80,
        accountsChange: 10,
        newTenants: 1,
        newUsers: 10,
        totalProfileViews: 4000,
        previousMonth: null,
      },
    ];

    const csv = reportToCSV(reports);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('年月,月初アカウント数,月末アカウント数,増減,新規テナント数,新規ユーザー数,プロフィール閲覧数');
    expect(lines[1]).toBe('2026/03,80,100,+20,2,20,5000');
    expect(lines[2]).toBe('2026/02,70,80,+10,1,10,4000');
  });

  it('マイナスの増減を正しく表示する', () => {
    const reports = [
      {
        year: 2026,
        month: 1,
        totalAccountsStart: 50,
        totalAccountsEnd: 45,
        accountsChange: -5,
        newTenants: 0,
        newUsers: 0,
        totalProfileViews: 1000,
        previousMonth: null,
      },
    ];

    const csv = reportToCSV(reports);
    const lines = csv.split('\n');
    expect(lines[1]).toContain('-5');
  });
});
