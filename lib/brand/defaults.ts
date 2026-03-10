// lib/brand/defaults.ts
// クライアントコンポーネントでも使用可能なブランドデフォルト定数
// サーバーサイドでは getBrandConfig() を使用すること

/** デフォルトのプライマリカラー（サーバー側では getBrandConfig().primaryColor を使用） */
export const DEFAULT_PRIMARY_COLOR = '#3B82F6';

/** デフォルトのブランド名（サーバー側では getBrandConfig().name を使用） */
export const DEFAULT_BRAND_NAME = process.env.NEXT_PUBLIC_BRAND_NAME || 'Share';

/** デフォルトのタグライン（サーバー側では getBrandConfig().tagline を使用） */
export const DEFAULT_TAGLINE = process.env.NEXT_PUBLIC_BRAND_TAGLINE || 'すべてのSNS、ワンタップで';

/** デフォルトの会社名（サーバー側では getBrandConfig().companyName を使用） */
export const DEFAULT_COMPANY_NAME = process.env.NEXT_PUBLIC_BRAND_COMPANY_NAME || '株式会社Senrigan';

/** デフォルトの会社住所（サーバー側では getBrandConfig().companyAddress を使用） */
export const DEFAULT_COMPANY_ADDRESS = process.env.NEXT_PUBLIC_BRAND_COMPANY_ADDRESS || '〒731-0137 広島県広島市安佐南区山本2-3-35';

/** デフォルトのサポートメール（サーバー側では getBrandConfig().supportEmail を使用） */
export const DEFAULT_SUPPORT_EMAIL = process.env.NEXT_PUBLIC_BRAND_SUPPORT_EMAIL || 'support@sns-share.com';

/** デフォルトの会社URL（サーバー側では getBrandConfig().companyUrl を使用） */
export const DEFAULT_COMPANY_URL = process.env.NEXT_PUBLIC_BRAND_COMPANY_URL || 'https://senrigan.systems';

/** デフォルトのアプリURL（サーバー側では getBrandConfig().appUrl を使用） */
export const DEFAULT_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.sns-share.com';

/** 買取型デプロイかどうか（サーバー側では getBrandConfig().isBuyout を使用） */
export const DEFAULT_IS_BUYOUT = process.env.NEXT_PUBLIC_DEPLOYMENT_MODE === 'buyout';
