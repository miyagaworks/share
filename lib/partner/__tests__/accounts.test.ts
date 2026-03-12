// lib/partner/__tests__/accounts.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPrismaMock, type PrismaMock } from '@/__tests__/helpers/prisma-mock';

// Prisma をモック
vi.mock('@/lib/prisma', () => ({
  prisma: createPrismaMock(),
}));

import { prisma } from '@/lib/prisma';
import { countPartnerAccounts, checkAccountLimit } from '@/lib/partner/accounts';

const prismaMock = prisma as unknown as PrismaMock;

describe('countPartnerAccounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('テナントユーザー + 個人ユーザーの合算を返す', async () => {
    prismaMock.user.count
      .mockResolvedValueOnce(80)  // テナントユーザー
      .mockResolvedValueOnce(20); // 個人ユーザー

    const count = await countPartnerAccounts('partner-1');
    expect(count).toBe(100);
  });

  it('ユーザーが0の場合は0を返す', async () => {
    prismaMock.user.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    const count = await countPartnerAccounts('partner-1');
    expect(count).toBe(0);
  });

  it('テナントユーザーのみの場合', async () => {
    prismaMock.user.count
      .mockResolvedValueOnce(50)
      .mockResolvedValueOnce(0);

    const count = await countPartnerAccounts('partner-1');
    expect(count).toBe(50);
  });

  it('個人ユーザーのみの場合', async () => {
    prismaMock.user.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(30);

    const count = await countPartnerAccounts('partner-1');
    expect(count).toBe(30);
  });
});

describe('checkAccountLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('パートナーが存在しない場合はcriticalを返す', async () => {
    prismaMock.partner.findUnique.mockResolvedValueOnce(null);

    const result = await checkAccountLimit('non-existent');
    expect(result.canAddMore).toBe(false);
    expect(result.warningLevel).toBe('critical');
    expect(result.currentCount).toBe(0);
    expect(result.maxAccounts).toBe(0);
  });

  it('上限未到達の場合はcanAddMore=true, warningLevel=normal', async () => {
    prismaMock.partner.findUnique.mockResolvedValueOnce({ maxAccounts: 300 });
    prismaMock.user.count
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(50);

    const result = await checkAccountLimit('partner-1');
    expect(result.canAddMore).toBe(true);
    expect(result.warningLevel).toBe('normal');
    expect(result.currentCount).toBe(150);
    expect(result.maxAccounts).toBe(300);
  });

  it('80%以上使用の場合はwarningLevel=warning', async () => {
    prismaMock.partner.findUnique.mockResolvedValueOnce({ maxAccounts: 300 });
    prismaMock.user.count
      .mockResolvedValueOnce(200)
      .mockResolvedValueOnce(50);

    const result = await checkAccountLimit('partner-1');
    expect(result.canAddMore).toBe(true);
    expect(result.warningLevel).toBe('warning');
    expect(result.currentCount).toBe(250);
  });

  it('90%以上使用の場合はwarningLevel=critical', async () => {
    prismaMock.partner.findUnique.mockResolvedValueOnce({ maxAccounts: 300 });
    prismaMock.user.count
      .mockResolvedValueOnce(250)
      .mockResolvedValueOnce(25);

    const result = await checkAccountLimit('partner-1');
    expect(result.canAddMore).toBe(true);
    expect(result.warningLevel).toBe('critical');
    expect(result.currentCount).toBe(275);
  });

  it('上限到達の場合はcanAddMore=false', async () => {
    prismaMock.partner.findUnique.mockResolvedValueOnce({ maxAccounts: 300 });
    prismaMock.user.count
      .mockResolvedValueOnce(200)
      .mockResolvedValueOnce(100);

    const result = await checkAccountLimit('partner-1');
    expect(result.canAddMore).toBe(false);
    expect(result.warningLevel).toBe('critical');
    expect(result.currentCount).toBe(300);
  });

  it('上限超過の場合もcanAddMore=false', async () => {
    prismaMock.partner.findUnique.mockResolvedValueOnce({ maxAccounts: 300 });
    prismaMock.user.count
      .mockResolvedValueOnce(250)
      .mockResolvedValueOnce(100);

    const result = await checkAccountLimit('partner-1');
    expect(result.canAddMore).toBe(false);
    expect(result.warningLevel).toBe('critical');
  });
});
