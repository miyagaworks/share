// lib/brand/config.ts
// ホワイトラベル（買取型）のブランド設定ユーティリティ
// 環境変数が未設定の場合はShare本体のデフォルト値を使用

export interface BrandConfig {
  name: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  companyName: string;
  companyUrl: string;
  companyAddress: string;
  supportEmail: string;
  privacyUrl: string;
  termsUrl: string;
  fromName: string;
  fromEmail: string;
  appUrl: string;
  tagline: string;
  companyPhone: string;
  companyRepresentative: string;
  isBuyout: boolean;
}

export function getBrandConfig(): BrandConfig {
  const isBuyout = process.env.DEPLOYMENT_MODE === 'buyout';

  return {
    name: process.env.BRAND_NAME || 'Share',
    logoUrl: process.env.BRAND_LOGO_URL || '/logo.svg',
    faviconUrl: process.env.BRAND_FAVICON_URL || '/pwa/favicon.ico',
    primaryColor: process.env.BRAND_PRIMARY_COLOR || '#3B82F6',
    secondaryColor: process.env.BRAND_SECONDARY_COLOR || '',
    companyName: process.env.BRAND_COMPANY_NAME || '株式会社Senrigan',
    companyUrl: process.env.BRAND_COMPANY_URL || 'https://senrigan.systems',
    companyAddress: process.env.BRAND_COMPANY_ADDRESS || '〒731-0137 広島県広島市安佐南区山本2-3-35',
    supportEmail: process.env.BRAND_SUPPORT_EMAIL || 'support@sns-share.com',
    privacyUrl: process.env.BRAND_PRIVACY_URL || '/legal/privacy',
    termsUrl: process.env.BRAND_TERMS_URL || '/legal/terms',
    fromName: process.env.FROM_NAME || 'Share',
    fromEmail: process.env.FROM_EMAIL || 'noreply@sns-share.com',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://app.sns-share.com',
    tagline: process.env.BRAND_TAGLINE || 'すべてのSNS、ワンタップで',
    companyPhone: process.env.BRAND_COMPANY_PHONE || '082-209-0181',
    companyRepresentative: process.env.BRAND_COMPANY_REPRESENTATIVE || '宮川 清実',
    isBuyout,
  };
}
