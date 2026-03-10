// lib/features.ts
// ホワイトラベル（買取型）の機能フラグ
// 環境変数が未設定の場合はすべて有効（Share本体の動作を維持）

export const features = {
  superAdmin: process.env.FEATURE_SUPER_ADMIN !== 'false',
  financialAdmin: process.env.FEATURE_FINANCIAL_ADMIN !== 'false',
  partnerModule: process.env.FEATURE_PARTNER_MODULE !== 'false',
  stripePayment: !!process.env.STRIPE_SECRET_KEY,
  nfcSealOrder: process.env.FEATURE_NFC_SEAL_ORDER !== 'false',
};
