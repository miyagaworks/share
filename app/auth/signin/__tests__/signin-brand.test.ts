// app/auth/signin/__tests__/signin-brand.test.ts
// ログインページのブランド解決テスト
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPrismaMock, type PrismaMock } from '@/__tests__/helpers/prisma-mock';

// Prisma をモック
vi.mock('@/lib/prisma', () => ({
  prisma: createPrismaMock(),
}));

// getBrandConfig をモック
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
import { resolveBrandByPartnerId, resolveBrandByHostname } from '@/lib/brand/resolve';

const prismaMock = prisma as unknown as PrismaMock;

const mockPartner = {
  id: 'partner-login-1',
  brandName: 'LoginTestBrand',
  logoUrl: 'https://example.com/login-logo.png',
  logoWidth: 180,
  logoHeight: 45,
  faviconUrl: 'https://example.com/login-favicon.ico',
  primaryColor: '#E11D48',
  secondaryColor: '#9333EA',
  companyName: 'ログインテスト株式会社',
  companyAddress: '東京都港区',
  supportEmail: 'support@logintest.com',
  privacyPolicyUrl: 'https://logintest.com/privacy',
  termsUrl: 'https://logintest.com/terms',
  emailFromName: 'LoginTestBrand',
  emailFromAddress: 'noreply@logintest.com',
  customDomain: 'card.logintest.com',
  domainVerified: true,
  accountStatus: 'active',
};

describe('ログインページ ブランド解決', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('パートナードメインアクセス時', () => {
    it('x-partner-id からパートナーブランドを解決できる', async () => {
      prismaMock.partner.findUnique.mockResolvedValueOnce(mockPartner);

      const brand = await resolveBrandByPartnerId('partner-login-1');
      expect(brand.name).toBe('LoginTestBrand');
      expect(brand.isPartner).toBe(true);
      expect(brand.primaryColor).toBe('#E11D48');
      expect(brand.logoUrl).toBe('https://example.com/login-logo.png');
      expect(brand.partnerId).toBe('partner-login-1');
    });

    it('カスタムドメインからパートナーブランドを解決できる', async () => {
      prismaMock.partner.findUnique.mockResolvedValueOnce(mockPartner);
      prismaMock.partner.findUnique.mockResolvedValueOnce(mockPartner);

      const brand = await resolveBrandByHostname('card.logintest.com');
      expect(brand.name).toBe('LoginTestBrand');
      expect(brand.isPartner).toBe(true);
      expect(brand.primaryColor).toBe('#E11D48');
    });

    it('パートナーのロゴURL、幅、高さが正しく解決される', async () => {
      prismaMock.partner.findUnique.mockResolvedValueOnce(mockPartner);

      const brand = await resolveBrandByPartnerId('partner-login-1');
      expect(brand.logoUrl).toBe('https://example.com/login-logo.png');
      expect(brand.logoWidth).toBe(180);
      expect(brand.logoHeight).toBe(45);
    });
  });

  describe('メインドメインアクセス時', () => {
    it('app.sns-share.com ではデフォルトブランドを返す', async () => {
      const brand = await resolveBrandByHostname('app.sns-share.com');
      expect(brand.name).toBe('Share');
      expect(brand.isPartner).toBe(false);
      expect(brand.primaryColor).toBe('#3B82F6');
      expect(brand.partnerId).toBeNull();
    });

    it('存在しないパートナーIDではデフォルトブランドを返す', async () => {
      prismaMock.partner.findUnique.mockResolvedValueOnce(null);

      const brand = await resolveBrandByPartnerId('non-existent');
      expect(brand.name).toBe('Share');
      expect(brand.isPartner).toBe(false);
    });

    it('suspendedパートナーではデフォルトブランドを返す', async () => {
      prismaMock.partner.findUnique.mockResolvedValueOnce({
        ...mockPartner,
        accountStatus: 'suspended',
      });

      const brand = await resolveBrandByPartnerId('partner-login-1');
      expect(brand.name).toBe('Share');
      expect(brand.isPartner).toBe(false);
    });
  });
});
