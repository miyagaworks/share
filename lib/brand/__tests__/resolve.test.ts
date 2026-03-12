// lib/brand/__tests__/resolve.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPrismaMock, type PrismaMock } from '@/__tests__/helpers/prisma-mock';

// Prisma をモック
vi.mock('@/lib/prisma', () => ({
  prisma: createPrismaMock(),
}));

// getBrandConfig をモック（環境変数に依存しない安定したテスト）
vi.mock('@/lib/brand/config', () => ({
  getBrandConfig: () => ({
    name: 'Share',
    logoUrl: '/logo.svg',
    faviconUrl: '/pwa/favicon.ico',
    primaryColor: '#3B82F6',
    secondaryColor: '',
    companyName: '株式会社Senrigan',
    companyUrl: 'https://senrigan.systems',
    companyAddress: '〒731-0137 広島県広島市安佐南区山本2-3-35',
    supportEmail: 'support@sns-share.com',
    privacyUrl: '/legal/privacy',
    termsUrl: '/legal/terms',
    fromName: 'Share',
    fromEmail: 'noreply@sns-share.com',
    appUrl: 'https://app.sns-share.com',
    tagline: 'すべてのSNS、ワンタップで',
    companyPhone: '082-209-0181',
    companyRepresentative: '宮川 清実',
    isBuyout: false,
  }),
}));

import { prisma } from '@/lib/prisma';
import {
  resolveBrandByHostname,
  resolveBrandByPartnerId,
  resolveBrandByUserId,
  getDefaultBrand,
} from '@/lib/brand/resolve';

const prismaMock = prisma as unknown as PrismaMock;

const mockPartner = {
  id: 'partner-1',
  brandName: 'TestBrand',
  logoUrl: 'https://example.com/logo.png',
  logoWidth: 200,
  logoHeight: 50,
  faviconUrl: 'https://example.com/favicon.ico',
  primaryColor: '#FF0000',
  secondaryColor: '#00FF00',
  companyName: 'テスト株式会社',
  companyAddress: '東京都渋谷区',
  supportEmail: 'support@test.com',
  privacyPolicyUrl: 'https://test.com/privacy',
  termsUrl: 'https://test.com/terms',
  emailFromName: 'TestBrand',
  emailFromAddress: 'noreply@test.com',
  customDomain: 'card.test.com',
  domainVerified: true,
  accountStatus: 'active',
};

describe('resolveBrandByHostname', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('メインドメインの場合、デフォルトブランドを返す', async () => {
    const brand = await resolveBrandByHostname('app.sns-share.com');
    expect(brand.name).toBe('Share');
    expect(brand.isPartner).toBe(false);
    expect(brand.partnerId).toBeNull();
  });

  it('サブドメイン（*.sns-share.com）の場合、デフォルトブランドを返す', async () => {
    const brand = await resolveBrandByHostname('staging.sns-share.com');
    expect(brand.name).toBe('Share');
    expect(brand.isPartner).toBe(false);
  });

  it('カスタムドメインの場合、パートナーブランドを返す', async () => {
    prismaMock.partner.findUnique.mockResolvedValueOnce(mockPartner);
    // resolveBrandByPartnerId 内部でもう一度呼ばれる
    prismaMock.partner.findUnique.mockResolvedValueOnce(mockPartner);

    const brand = await resolveBrandByHostname('card.test.com');
    expect(brand.name).toBe('TestBrand');
    expect(brand.isPartner).toBe(true);
    expect(brand.partnerId).toBe('partner-1');
    expect(brand.primaryColor).toBe('#FF0000');
  });

  it('未知のドメインの場合、デフォルトブランドを返す', async () => {
    prismaMock.partner.findUnique.mockResolvedValueOnce(null);

    const brand = await resolveBrandByHostname('unknown.example.com');
    expect(brand.name).toBe('Share');
    expect(brand.isPartner).toBe(false);
  });

  it('suspendedパートナーのドメインの場合、デフォルトブランドを返す', async () => {
    prismaMock.partner.findUnique.mockResolvedValueOnce({
      ...mockPartner,
      accountStatus: 'suspended',
    });

    const brand = await resolveBrandByHostname('card.test.com');
    expect(brand.name).toBe('Share');
    expect(brand.isPartner).toBe(false);
  });

  it('domainVerified=falseのパートナーの場合、デフォルトブランドを返す', async () => {
    prismaMock.partner.findUnique.mockResolvedValueOnce({
      ...mockPartner,
      domainVerified: false,
    });

    const brand = await resolveBrandByHostname('card.test.com');
    expect(brand.name).toBe('Share');
    expect(brand.isPartner).toBe(false);
  });
});

describe('resolveBrandByPartnerId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('有効なパートナーIDの場合、パートナーブランドを返す', async () => {
    prismaMock.partner.findUnique.mockResolvedValueOnce(mockPartner);

    const brand = await resolveBrandByPartnerId('partner-1');
    expect(brand.name).toBe('TestBrand');
    expect(brand.isPartner).toBe(true);
    expect(brand.isBuyout).toBe(false);
    expect(brand.appUrl).toBe('https://card.test.com');
    expect(brand.fromName).toBe('TestBrand');
    expect(brand.fromEmail).toBe('noreply@test.com');
  });

  it('suspendedパートナーの場合、デフォルトブランドを返す', async () => {
    prismaMock.partner.findUnique.mockResolvedValueOnce({
      ...mockPartner,
      accountStatus: 'suspended',
    });

    const brand = await resolveBrandByPartnerId('partner-1');
    expect(brand.name).toBe('Share');
    expect(brand.isPartner).toBe(false);
  });

  it('存在しないパートナーIDの場合、デフォルトブランドを返す', async () => {
    prismaMock.partner.findUnique.mockResolvedValueOnce(null);

    const brand = await resolveBrandByPartnerId('non-existent');
    expect(brand.name).toBe('Share');
    expect(brand.isPartner).toBe(false);
  });

  it('emailFromName/emailFromAddress が未設定の場合、brandName/デフォルトfromEmailを使用', async () => {
    prismaMock.partner.findUnique.mockResolvedValueOnce({
      ...mockPartner,
      emailFromName: null,
      emailFromAddress: null,
    });

    const brand = await resolveBrandByPartnerId('partner-1');
    expect(brand.fromName).toBe('TestBrand');
    expect(brand.fromEmail).toBe('noreply@sns-share.com');
  });

  it('customDomain が未設定の場合、デフォルト appUrl を使用', async () => {
    prismaMock.partner.findUnique.mockResolvedValueOnce({
      ...mockPartner,
      customDomain: null,
    });

    const brand = await resolveBrandByPartnerId('partner-1');
    expect(brand.appUrl).toBe('https://app.sns-share.com');
  });
});

describe('resolveBrandByUserId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('直接パートナー紐付きユーザーの場合、パートナーブランドを返す', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      partnerId: 'partner-1',
      tenantId: null,
    });
    prismaMock.partner.findUnique.mockResolvedValueOnce(mockPartner);

    const brand = await resolveBrandByUserId('user-1');
    expect(brand.name).toBe('TestBrand');
    expect(brand.isPartner).toBe(true);
  });

  it('テナント経由でパートナーに紐づくユーザーの場合、パートナーブランドを返す', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      partnerId: null,
      tenantId: 'tenant-1',
    });
    prismaMock.corporateTenant.findUnique.mockResolvedValueOnce({
      partnerId: 'partner-1',
    });
    prismaMock.partner.findUnique.mockResolvedValueOnce(mockPartner);

    const brand = await resolveBrandByUserId('user-2');
    expect(brand.name).toBe('TestBrand');
    expect(brand.isPartner).toBe(true);
  });

  it('パートナー未所属ユーザーの場合、デフォルトブランドを返す', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      partnerId: null,
      tenantId: null,
    });

    const brand = await resolveBrandByUserId('user-3');
    expect(brand.name).toBe('Share');
    expect(brand.isPartner).toBe(false);
  });

  it('存在しないユーザーの場合、デフォルトブランドを返す', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);

    const brand = await resolveBrandByUserId('non-existent');
    expect(brand.name).toBe('Share');
    expect(brand.isPartner).toBe(false);
  });

  it('テナントにパートナーが紐づいていない場合、デフォルトブランドを返す', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      partnerId: null,
      tenantId: 'tenant-2',
    });
    prismaMock.corporateTenant.findUnique.mockResolvedValueOnce({
      partnerId: null,
    });

    const brand = await resolveBrandByUserId('user-4');
    expect(brand.name).toBe('Share');
    expect(brand.isPartner).toBe(false);
  });
});

describe('getDefaultBrand', () => {
  it('デフォルトブランドを返す', () => {
    const brand = getDefaultBrand();
    expect(brand.name).toBe('Share');
    expect(brand.isPartner).toBe(false);
    expect(brand.isBuyout).toBe(false);
    expect(brand.partnerId).toBeNull();
    expect(brand.primaryColor).toBe('#3B82F6');
    expect(brand.appUrl).toBe('https://app.sns-share.com');
  });
});
