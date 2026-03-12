// lib/email/__tests__/brand-email.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// getBrandConfig をモック
const mockGetBrandConfig = vi.fn();
vi.mock('@/lib/brand/config', () => ({
  getBrandConfig: () => mockGetBrandConfig(),
}));

// logger をモック
vi.mock('@/lib/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import { emailHeader, emailFooter, textFooter } from '@/lib/email/templates/base';

const defaultBrand = {
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
};

const partnerBrand = {
  ...defaultBrand,
  name: 'PartnerBrand',
  primaryColor: '#FF0000',
  companyName: 'パートナー株式会社',
  companyAddress: '大阪府大阪市',
  supportEmail: 'support@partner.com',
  fromName: 'PartnerBrand',
  fromEmail: 'noreply@partner.com',
  appUrl: 'https://card.partner.com',
};

describe('emailHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('デフォルトブランドでヘッダーを生成', () => {
    mockGetBrandConfig.mockReturnValue(defaultBrand);
    const html = emailHeader();
    expect(html).toContain('Share');
    expect(html).toContain('#3B82F6');
  });

  it('パートナーブランドでヘッダーを生成', () => {
    mockGetBrandConfig.mockReturnValue(partnerBrand);
    const html = emailHeader();
    expect(html).toContain('PartnerBrand');
    expect(html).toContain('#FF0000');
  });

  it('サブタイトル付きでヘッダーを生成', () => {
    mockGetBrandConfig.mockReturnValue(defaultBrand);
    const html = emailHeader({ subtitle: '管理者通知' });
    expect(html).toContain('管理者通知');
  });

  it('カスタムヘッダーカラーを適用', () => {
    mockGetBrandConfig.mockReturnValue(defaultBrand);
    const html = emailHeader({ headerColor: '#00FF00' });
    expect(html).toContain('#00FF00');
  });
});

describe('emailFooter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('デフォルトブランドでフッターを生成', () => {
    mockGetBrandConfig.mockReturnValue(defaultBrand);
    const html = emailFooter();
    expect(html).toContain('Share サポートチーム');
    expect(html).toContain('support@sns-share.com');
    expect(html).toContain('株式会社Senrigan');
  });

  it('パートナーブランドでフッターを生成', () => {
    mockGetBrandConfig.mockReturnValue(partnerBrand);
    const html = emailFooter();
    expect(html).toContain('PartnerBrand サポートチーム');
    expect(html).toContain('support@partner.com');
    expect(html).toContain('パートナー株式会社');
  });

  it('プライバシーリンクが相対パスの場合、appUrlを付加', () => {
    mockGetBrandConfig.mockReturnValue(defaultBrand);
    const html = emailFooter();
    expect(html).toContain('https://app.sns-share.com/legal/privacy');
    expect(html).toContain('https://app.sns-share.com/legal/terms');
  });

  it('サポートメール表示を無効化できる', () => {
    mockGetBrandConfig.mockReturnValue(defaultBrand);
    const html = emailFooter({ showSupportEmail: false });
    expect(html).not.toContain('mailto:');
  });

  it('プライバシーリンク表示を無効化できる', () => {
    mockGetBrandConfig.mockReturnValue(defaultBrand);
    const html = emailFooter({ showPrivacyLinks: false });
    expect(html).not.toContain('プライバシーポリシー');
  });
});

describe('textFooter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('デフォルトブランドでテキストフッターを生成', () => {
    mockGetBrandConfig.mockReturnValue(defaultBrand);
    const text = textFooter();
    expect(text).toContain('Share サポートチーム');
    expect(text).toContain('support@sns-share.com');
    expect(text).toContain('株式会社Senrigan');
  });

  it('パートナーブランドでテキストフッターを生成', () => {
    mockGetBrandConfig.mockReturnValue(partnerBrand);
    const text = textFooter();
    expect(text).toContain('PartnerBrand サポートチーム');
    expect(text).toContain('support@partner.com');
    expect(text).toContain('パートナー株式会社');
  });

  it('サポート情報の表示を無効化できる', () => {
    mockGetBrandConfig.mockReturnValue(defaultBrand);
    const text = textFooter({ showSupportInfo: false });
    expect(text).not.toContain('サポート情報');
  });

  it('会社情報の表示を無効化できる', () => {
    mockGetBrandConfig.mockReturnValue(defaultBrand);
    const text = textFooter({ showCompanyInfo: false });
    expect(text).not.toContain('運営会社情報');
  });
});
