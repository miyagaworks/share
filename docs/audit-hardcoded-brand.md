# ホワイトラベル対応 ハードコード調査結果

> **調査日**: 2026-03-10
> **対象**: アプリケーションコードのみ（`docs/`・`share_db_backup.sql`・`.playwright-mcp/`は除外）

---

## 1. ブランド名「Share」（ユーザー表示箇所のみ）

| # | ファイルパス | 行番号 | 現在のコード（該当部分） | パターン種別 | 修正方針 |
|---|---|---|---|---|---|
| 1 | `app/layout.tsx` | 22 | `title: 'Share'` | ブランド名 | 環境変数/BrandConfig |
| 2 | `app/layout.tsx` | 56 | `content="Share"` (apple-mobile-web-app-title) | ブランド名 | 環境変数/BrandConfig |
| 3 | `app/page.tsx` | 83,89,199 | `alt="Share Logo"`, `alt="Share Text"` 等 | ブランド名 | BrandConfig |
| 4 | `app/page.tsx` | 219,233,235 | `「Share」を使えば…`, `Shareの活用シーン` | ブランド名 | BrandConfig |
| 5 | `app/page.tsx` | 284 | `© 2025 Share. All rights reserved.` | ブランド名 | BrandConfig |
| 6 | `app/not-found.tsx` | 117 | `© {year} Share. すべての権利を保有します。` | ブランド名 | BrandConfig |
| 7 | `app/[slug]/page.tsx` | 124-125 | `| Share`, `Shareでプロフィールをチェック` | ブランド名 | BrandConfig |
| 8 | `app/[slug]/page.tsx` | 622 | `Powered by Share` | ブランド名 | BrandConfig |
| 9 | `app/company/service/page.tsx` | 5-6,19,21,24,80 | `| Share`, `Shareとは`, `Shareは…` (計5箇所) | ブランド名 | BrandConfig |
| 10 | `app/company/about/page.tsx` | 7-8,71 | `| Share`, `Shareを運営する…`, `「Share」の企画` | ブランド名 | BrandConfig |
| 11 | `app/support/help/page.tsx` | 6-7 | `| Share`, `Shareサービスの…` | ブランド名 | BrandConfig |
| 12 | `app/support/faq/page.tsx` | 7-8,13,16,24,26,28,32,113,147 | `| Share`, `Shareとは何ですか？`等 (計9箇所) | ブランド名 | BrandConfig |
| 13 | `app/support/contact/ContactPageContent.tsx` | 128 | `Shareに関するお問い合わせ` | ブランド名 | BrandConfig |
| 14 | `app/legal/terms/page.tsx` | 5-6,21 | `| Share`, `サービス「Share」` | ブランド名 | BrandConfig |
| 15 | `app/legal/privacy/page.tsx` | 5-6,21 | `| Share`, `サービス「Share」` | ブランド名 | BrandConfig |
| 16 | `app/legal/transactions/page.tsx` | 5-6,51 | `| Share`, 販売商品名`Share` | ブランド名 | BrandConfig |
| 17 | `app/auth/signin/page.tsx` | 483,494,509 | `Share`タイトル, 説明文, ロゴalt | ブランド名 | BrandConfig |
| 18 | `app/auth/signup/page.tsx` | 292,303,347 | 同上 | ブランド名 | BrandConfig |
| 19 | `app/auth/error/page.tsx` | 99,104,118 | 同上 | ブランド名 | BrandConfig |
| 20 | `app/auth/forgot-password/page.tsx` | 63,68,82 | 同上 | ブランド名 | BrandConfig |
| 21 | `app/auth/reset-password/page.tsx` | 158,188,193,207 | 同上 | ブランド名 | BrandConfig |
| 22 | `app/auth/email-verification/page.tsx` | 135,140,155 | 同上 | ブランド名 | BrandConfig |
| 23 | `app/auth/invite/page.tsx` | 172,198,227,389,394 | 同上(計5箇所) | ブランド名 | BrandConfig |
| 24 | `app/jikogene/layout.tsx` | 9 | `| Share` | ブランド名 | BrandConfig |
| 25 | `app/qr/[slug]/page.tsx` | 25,30,33 | `| Share`, `| Share QR` | ブランド名 | BrandConfig |
| 26 | `app/qrcode/layout.tsx` | 6 | `| Share` | ブランド名 | BrandConfig |
| 27 | `app/dashboard/tutorial/page.tsx` | 12,17,47 | `Shareのプロフィール作成`, `Shareの機能` | ブランド名 | BrandConfig |
| 28 | `app/partner/layout.tsx` | 6,8,10 | `Share`, `Shareのホワイトラベル` | ブランド名 | BrandConfig |
| 29 | `app/partner/components/HeroSection.tsx` | 59 | `「Share」のホワイトラベルなら` | ブランド名 | BrandConfig |
| 30 | `app/partner/components/SolutionSection.tsx` | 24,44,47,145 | `Share`, `Shareが担当` 等 | ブランド名 | BrandConfig |
| 31 | `app/partner/components/Differentiator.tsx` | 31,262,292,293,328,338,348 | `Share`（計7箇所） | ブランド名 | BrandConfig |
| 32 | `app/partner/components/PartnerHeader.tsx` | 23,33,41 | `alt="Share"`, `Shareとは`, `Shareを試してみる` | ブランド名 | BrandConfig |
| 33 | `components/layout/Header.tsx` | 58 | `alt="Share Logo"` | ブランド名 | BrandConfig |
| 34 | `components/layout/DashboardHeader.tsx` | 97 | `alt="Share Logo"` | ブランド名 | BrandConfig |
| 35 | `components/dashboard/ImprovedDesignPreview.tsx` | 257 | `Powered by Share` | ブランド名 | BrandConfig |
| 36 | `components/corporate/ImprovedBrandingPreview.tsx` | 285 | `Powered by Share` | ブランド名 | BrandConfig |
| 37 | `components/corporate/EnhancedBrandingPreview.tsx` | 253 | `Powered by Share` | ブランド名 | BrandConfig |
| 38 | `components/corporate/BrandingPreview.tsx` | 386 | `Powered by Share` | ブランド名 | BrandConfig |
| 39 | `components/YouTubeGuideCard.tsx` | 37,64 | `Shareのプロフィール作成`, `Shareの便利な機能` | ブランド名 | BrandConfig |
| 40 | `public/manifest.json` | 2-3 | `"name": "Share"`, `"short_name": "Share"` | ブランド名 | ビルド時動的生成 or 環境変数 |
| 41 | `lib/email/index.ts` | 76 | `'Share'` (FROM_NAME) | ブランド名 | 環境変数 |
| 42 | `lib/email/index.ts` | 309 | `【Share】テストメール送信` | ブランド名 | BrandConfig |

## 2. メールテンプレート内「Share」ブランド名

| # | ファイルパス | 行番号 | 現在のコード（該当部分） | パターン種別 | 修正方針 |
|---|---|---|---|---|---|
| 43 | `lib/email/templates/email-verification.ts` | 16,31,69,126,236,240,255,277,285,294 | `Share`(計10箇所) | ブランド名 | テンプレート変数化 |
| 44 | `lib/email/templates/trial-ending.ts` | 12,37,264 | `Share`(計3箇所) | ブランド名 | テンプレート変数化 |
| 45 | `lib/email/templates/cancel-request.ts` | 36,51,165,225,232 | `Share`(計5箇所) | ブランド名 | テンプレート変数化 |
| 46 | `lib/email/templates/invite-email.ts` | 9,17,32,194 | `Share`(計4箇所) | ブランド名 | テンプレート変数化 |
| 47 | `lib/email/templates/admin-notification.ts` | 13,63,174 | `Share`(計3箇所) | ブランド名 | テンプレート変数化 |
| 48 | `lib/email/templates/grace-period-expired.ts` | 17,75,271 | `Share`(計3箇所) | ブランド名 | テンプレート変数化 |
| 49 | `lib/email/templates/expense-approval-result.ts` | 41,64,198,254 | `Share`(計4箇所) | ブランド名 | テンプレート変数化 |
| 50 | `lib/email/templates/expense-approval.ts` | 41,64,248,310 | `Share`(計4箇所) | ブランド名 | テンプレート変数化 |
| 51 | `lib/email/templates/shipping-notification.ts` | 41,45,97,100,240,345,349 | `Share`(計7箇所) | ブランド名 | テンプレート変数化 |
| 52 | `lib/email/templates/partner-inquiry.ts` | 28,47,71,150,185,205 | `Share`(計6箇所) | ブランド名 | テンプレート変数化 |
| 53 | `app/api/support/contact/route.ts` | 56,99,100,108,151,152,160,259,260,268,307,308,316 | `Share`(計13箇所) | ブランド名 | テンプレート変数化 |
| 54 | `app/api/auth/forgot-password/route.ts` | 62,84 | `Share` | ブランド名 | テンプレート変数化 |
| 55 | `app/api/subscription/cancel-request/route.ts` | 182 | `【Share】新しい解約申請` | ブランド名 | テンプレート変数化 |
| 56 | `app/api/admin/cancel-requests/[id]/route.ts` | 123 | `【Share】解約申請…` | ブランド名 | テンプレート変数化 |
| 57 | `app/partner/actions/submitPartnerInquiry.ts` | 99,123 | `'Share <noreply@…>'` | ブランド名 | BrandConfig |

## 3. ドメイン `sns-share.com` / `app.sns-share.com`

| # | ファイルパス | 行番号 | 現在のコード（該当部分） | パターン種別 | 修正方針 |
|---|---|---|---|---|---|
| 58 | `next.config.mjs` | 6 | `assetPrefix: 'https://app.sns-share.com'` | app.sns-share.com | `NEXT_PUBLIC_APP_URL`環境変数 |
| 59 | `next.config.mjs` | 58-63 | CSPヘッダー内`https://app.sns-share.com` **6箇所** | app.sns-share.com | 環境変数で動的生成 |
| 60 | `lib/email/index.ts` | 75 | `'noreply@sns-share.com'` | @sns-share.com | `FROM_EMAIL`環境変数 |
| 61 | `lib/email/templates/email-verification.ts` | 197,199,212,217,274,275,287,288 | `support@sns-share.com`, `app.sns-share.com` (計8箇所) | ドメイン | テンプレート変数化 |
| 62 | `lib/email/templates/trial-ending.ts` | 118,175,177,190,195,236,255,256,266,267 | 同上 (計10箇所) | ドメイン | テンプレート変数化 |
| 63 | `lib/email/templates/cancel-request.ts` | 166,168,226 | `support@sns-share.com` (計3箇所) | ドメイン | テンプレート変数化 |
| 64 | `lib/email/templates/invite-email.ts` | 131,133,146,151,183,184,196,197 | `support@sns-share.com`, `app.sns-share.com` (計8箇所) | ドメイン | テンプレート変数化 |
| 65 | `lib/email/templates/admin-notification.ts` | 114,116,129,134,165,166,176,177 | 同上 (計8箇所) | ドメイン | テンプレート変数化 |
| 66 | `lib/email/templates/grace-period-expired.ts` | 28,173,260 | `app.sns-share.com` (計3箇所) | ドメイン | テンプレート変数化 |
| 67 | `lib/email/templates/expense-approval-result.ts` | 169,248 | `app.sns-share.com` (計2箇所) | ドメイン | テンプレート変数化 |
| 68 | `lib/email/templates/shipping-notification.ts` | 32,93,94,101,102,292,339,340,350,351 | `app.sns-share.com`, `support@sns-share.com` (計10箇所) | ドメイン | テンプレート変数化 |
| 69 | `lib/email/templates/partner-inquiry.ts` | 20,24,155,156,206 | `app.sns-share.com`, `support@sns-share.com` (計5箇所) | ドメイン | テンプレート変数化 |
| 70 | `app/api/support/contact/route.ts` | 103,105,111,115,116,155,157,163,167,168,176,177,190,263,265,271,275,276,311,313,319,323,324,332,333,346 | `sns-share.com` (計26箇所) | ドメイン | テンプレート変数化 |
| 71 | `app/api/auth/forgot-password/route.ts` | 57,66,82,88,89 | `app.sns-share.com`, `noreply@sns-share.com` (計5箇所) | ドメイン | 環境変数化 |
| 72 | `app/[slug]/page.tsx` | 653 | `href="https://sns-share.com"` | sns-share.com | BrandConfig |
| 73 | `app/company/about/page.tsx` | 88 | `info@sns-share.com` | @sns-share.com | BrandConfig |
| 74 | `app/support/contact/ContactPageContent.tsx` | 311 | `support@sns-share.com` | @sns-share.com | BrandConfig |
| 75 | `app/legal/transactions/page.tsx` | 47 | `info@sns-share.com` | @sns-share.com | BrandConfig |
| 76 | `app/legal/privacy/page.tsx` | 89 | `privacy@sns-share.com` | @sns-share.com | BrandConfig |
| 77 | `app/partner/layout.tsx` | 13,21 | `https://sns-share.com/partner` (計2箇所) | sns-share.com | BrandConfig |
| 78 | `app/partner/components/AffinitySection.tsx` | 163 | `https://app.sns-share.com/miyagawa` | app.sns-share.com | BrandConfig |
| 79 | `app/partner/components/PostScript.tsx` | 40 | `https://app.sns-share.com/miyagawa` | app.sns-share.com | BrandConfig |
| 80 | `app/partner/components/PartnerHeader.tsx` | 28,36 | `https://sns-share.com`, `https://app.sns-share.com` | ドメイン | BrandConfig |
| 81 | `app/partner/actions/submitPartnerInquiry.ts` | 99,103,107,123 | `noreply@sns-share.com`, `support@sns-share.com` (計4箇所) | ドメイン | 環境変数化 |
| 82 | `lib/one-tap-seal/profile-slug-manager.ts` | 15 | `https://app.sns-share.com/` | app.sns-share.com | `NEXT_PUBLIC_APP_URL` |
| 83 | `lib/utils/expense-email.ts` | 19 | `https://app.sns-share.com/…` | app.sns-share.com | `NEXT_PUBLIC_APP_URL` |
| 84 | `lib/profit-allocation.ts` | 96,102 | `yoshitsune@sns-share.com`, `kensei@sns-share.com` | @sns-share.com | 環境変数化 |
| 85 | `app/api/subscription/create/route.ts` | 456 | `https://app.sns-share.com/qr/…` | app.sns-share.com | `NEXT_PUBLIC_APP_URL` |
| 86 | `app/api/one-tap-seal/validate-profile/route.ts` | 51 | `https://app.sns-share.com/` | app.sns-share.com | `NEXT_PUBLIC_APP_URL` |
| 87 | `app/api/vcard/[userId]/route.ts` | 289 | `'https://app.sns-share.com'` | app.sns-share.com | `NEXT_PUBLIC_APP_URL` |
| 88 | `app/api/corporate/users/invite/route.ts` | 110 | `'https://app.sns-share.com'` | app.sns-share.com | `NEXT_PUBLIC_APP_URL` |
| 89 | `app/api/corporate/users/[id]/route.ts` | 305 | `'https://app.sns-share.com'` | app.sns-share.com | `NEXT_PUBLIC_APP_URL` |
| 90 | `app/api/corporate/users/[id]/resend-invite/route.ts` | 62 | `'https://app.sns-share.com'` | app.sns-share.com | `NEXT_PUBLIC_APP_URL` |
| 91 | `app/api/test-email/route.ts` | 34 | `support@sns-share.com` | @sns-share.com | 環境変数化 |
| 92 | `components/one-tap-seal/OneTapSealUrlManager.tsx` | 133,146,206,224,276 | `app.sns-share.com` (計5箇所) | app.sns-share.com | `NEXT_PUBLIC_APP_URL` |
| 93 | `components/one-tap-seal/OneTapSealOrderSummary.tsx` | 158 | `app.sns-share.com` | app.sns-share.com | `NEXT_PUBLIC_APP_URL` |
| 94 | `components/subscription/SubscriptionWithOneTapSeal.tsx` | 303,311 | `app.sns-share.com` (計2箇所) | app.sns-share.com | `NEXT_PUBLIC_APP_URL` |
| 95 | `app/dashboard/admin/email/page.tsx` | 715 | `placeholder="https://app.sns-share.com/dashboard"` | app.sns-share.com | BrandConfig |

## 4. 株式会社Senrigan / Senrigan / senrigan.systems

| # | ファイルパス | 行番号 | 現在のコード（該当部分） | パターン種別 | 修正方針 |
|---|---|---|---|---|---|
| 96 | `app/company/about/page.tsx` | 7,8,13,16,33 | `株式会社Senrigan` (計5箇所) | 会社名 | BrandConfig |
| 97 | `app/legal/terms/page.tsx` | 21,247 | `株式会社Senrigan` (計2箇所) | 会社名 | BrandConfig |
| 98 | `app/legal/privacy/page.tsx` | 21,87 | `株式会社Senrigan` (計2箇所) | 会社名 | BrandConfig |
| 99 | `app/legal/transactions/page.tsx` | 23 | `株式会社Senrigan` | 会社名 | BrandConfig |
| 100 | `app/support/contact/ContactPageContent.tsx` | 324 | `株式会社Senrigan Share運営事務局宛` | 会社名 | BrandConfig |
| 101 | `components/layout/Footer.tsx` | 58 | `株式会社Senrigan`（リンクテキスト） | 会社名 | BrandConfig |
| 102 | `app/partner/layout.tsx` | 39 | `Senrigan. All rights reserved.` | 会社名 | BrandConfig |
| 103 | `app/partner/components/AffinitySection.tsx` | 154 | `株式会社Senrigan 代表` | 会社名 | BrandConfig |
| 104 | `app/partner/components/PostScript.tsx` | 89 | `株式会社Senrigan` | 会社名 | BrandConfig |
| 105 | `app/api/support/contact/route.ts` | 100,112,152,164,260,272,308,320 | `株式会社Senrigan` (計8箇所) | 会社名 | テンプレート変数化 |
| 106 | `app/api/auth/forgot-password/route.ts` | 86 | `株式会社Senrigan` | 会社名 | テンプレート変数化 |
| 107 | `lib/email/templates/email-verification.ts` | 209,284 | `株式会社Senrigan` (計2箇所) | 会社名 | テンプレート変数化 |
| 108 | `lib/email/templates/trial-ending.ts` | 187,263 | `株式会社Senrigan` (計2箇所) | 会社名 | テンプレート変数化 |
| 109 | `lib/email/templates/cancel-request.ts` | 178,229 | `株式会社Senrigan` (計2箇所) | 会社名 | テンプレート変数化 |
| 110 | `lib/email/templates/invite-email.ts` | 143,193 | `株式会社Senrigan` (計2箇所) | 会社名 | テンプレート変数化 |
| 111 | `lib/email/templates/admin-notification.ts` | 126,173 | `株式会社Senrigan` (計2箇所) | 会社名 | テンプレート変数化 |
| 112 | `lib/email/templates/grace-period-expired.ts` | 212,270 | `株式会社Senrigan` (計2箇所) | 会社名 | テンプレート変数化 |
| 113 | `lib/email/templates/expense-approval-result.ts` | 208,258 | `株式会社Senrigan` (計2箇所) | 会社名 | テンプレート変数化 |
| 114 | `lib/email/templates/expense-approval.ts` | 258,314 | `株式会社Senrigan` (計2箇所) | 会社名 | テンプレート変数化 |
| 115 | `lib/email/templates/partner-inquiry.ts` | 163,207 | `株式会社Senrigan` (計2箇所) | 会社名 | テンプレート変数化 |
| 116 | `app/company/about/page.tsx` | 28 | `https://senrigan.systems` | 会社URL | BrandConfig |
| 117 | `app/partner/components/PostScript.tsx` | 84 | `https://senrigan.systems/` | 会社URL | BrandConfig |
| 118 | `app/api/support/contact/route.ts` | 112,164,272,320 | `https://senrigan.systems` (計4箇所) | 会社URL | テンプレート変数化 |

## 5. 広島（住所）

| # | ファイルパス | 行番号 | 現在のコード（該当部分） | パターン種別 | 修正方針 |
|---|---|---|---|---|---|
| 119 | `app/company/about/page.tsx` | 64 | `広島県広島市安佐南区山本2-3-35` | 住所 | BrandConfig |
| 120 | `app/support/contact/ContactPageContent.tsx` | 322 | `広島県広島市安佐南区山本2-3-35` | 住所 | BrandConfig |
| 121 | `app/legal/transactions/page.tsx` | 34 | `広島県広島市安佐南区山本2-3-35` | 住所 | BrandConfig |
| 122 | `lib/email/templates/invite-email.ts` | 140,192 | `〒731-0137 広島県…` (計2箇所) | 住所 | テンプレート変数化 |
| 123 | `lib/email/templates/email-verification.ts` | 206,283 | 同上 (計2箇所) | 住所 | テンプレート変数化 |
| 124 | `lib/email/templates/trial-ending.ts` | 184,262 | 同上 (計2箇所) | 住所 | テンプレート変数化 |
| 125 | `lib/email/templates/cancel-request.ts` | 175,228 | 同上 (計2箇所) | 住所 | テンプレート変数化 |
| 126 | `lib/email/templates/admin-notification.ts` | 123,172 | 同上 (計2箇所) | 住所 | テンプレート変数化 |
| 127 | `lib/email/templates/grace-period-expired.ts` | 209,269 | 同上 (計2箇所) | 住所 | テンプレート変数化 |
| 128 | `lib/email/templates/expense-approval-result.ts` | 205,257 | 同上 (計2箇所) | 住所 | テンプレート変数化 |
| 129 | `lib/email/templates/expense-approval.ts` | 255,313 | 同上 (計2箇所) | 住所 | テンプレート変数化 |
| 130 | `lib/email/templates/partner-inquiry.ts` | 166,208 | 同上 (計2箇所) | 住所 | テンプレート変数化 |
| 131 | `app/api/support/contact/route.ts` | 111,163,271,319 | `〒731-0137 広島県…` (計4箇所) | 住所 | テンプレート変数化 |
| 132 | `app/api/auth/forgot-password/route.ts` | 85 | `〒731-0137 広島県…` | 住所 | テンプレート変数化 |

## 6. #3B82F6 ブランドカラー（ユーザー表示部分）

| # | ファイルパス | 行番号 | 現在のコード（該当部分） | パターン種別 | 修正方針 |
|---|---|---|---|---|---|
| 133 | `app/layout.tsx` | 57 | `<meta name="theme-color" content="#3B82F6" />` | ブランドカラー | BrandConfig |
| 134 | `public/manifest.json` | 8 | `"theme_color": "#3B82F6"` | ブランドカラー | ビルド時生成 |
| 135 | `public/qrcode-manifest.json` | 10 | `"theme_color": "#3B82F6"` | ブランドカラー | ビルド時生成 |
| 136 | `app/not-found.tsx` | 79,88,97,104 | `stroke="#3B82F6"`, `fill="#3B82F6"` (計4箇所) | ブランドカラー | BrandConfig |
| 137 | `app/styles/base/variables.css` | 7,32 | `--individual-primary: #3B82F6`, `--ring: #3B82F6` | ブランドカラー | CSS変数を動的化 |
| 138 | `lib/email/templates/email-verification.ts` | 26,31,82,84,135,198 | ヘッダー背景/ボタン/リンク色 `#3B82F6` (計6箇所) | ブランドカラー | テンプレートでBrandConfig参照 |
| 139 | `lib/email/templates/trial-ending.ts` | 32,37,117,119,176 | `#3B82F6` (計5箇所) | ブランドカラー | テンプレートでBrandConfig参照 |
| 140 | `lib/email/templates/cancel-request.ts` | 46,51,167 | `#3B82F6` (計3箇所) | ブランドカラー | テンプレートでBrandConfig参照 |
| 141 | `lib/email/templates/invite-email.ts` | 27,32,52,65,80,82,132 | `#3B82F6` (計7箇所) | ブランドカラー | テンプレートでBrandConfig参照 |
| 142 | `lib/email/templates/admin-notification.ts` | 21,23,58,63,115 | `#3B82F6` (計5箇所) | ブランドカラー | テンプレートでBrandConfig参照 |
| 143 | `lib/email/templates/grace-period-expired.ts` | 70,75,144,160,172,174 | `#3B82F6` (計6箇所) | ブランドカラー | テンプレートでBrandConfig参照 |
| 144 | `lib/email/templates/expense-approval-result.ts` | 151,168,170 | `#3B82F6` (計3箇所) | ブランドカラー | テンプレートでBrandConfig参照 |
| 145 | `lib/email/templates/expense-approval.ts` | 206,208,229 | `#3B82F6` (計3箇所) | ブランドカラー | テンプレートでBrandConfig参照 |
| 146 | `app/api/support/contact/route.ts` | 101,103,105,107,112,115,116,153,155,157,159,164,167,168,261,263,265,267,272,275,276,309,311,313,315,320,323,324 | `#3B82F6` (計28箇所) | ブランドカラー | テンプレート変数化 |
| 147 | `components/subscription/EnhancedTrialBanner.tsx` | 57 | `linear-gradient(135deg, #3B82F6 0%…)` | ブランドカラー | BrandConfig |
| 148 | `auth.ts` | 172 | `mainColor: '#3B82F6'` | デフォルトカラー | 定数化/環境変数 |
| 149 | `prisma/schema.prisma` | 20 | `@default("#3B82F6")` | DBデフォルト値 | マイグレーション対応 |
| 150 | `app/api/auth/register/route.ts` | 120 | `mainColor: '#3B82F6'` | デフォルトカラー | 定数化/環境変数 |
| 151 | `app/api/webhook/stripe/route.ts` | 232 | `primaryColor: '#3B82F6'` | デフォルトカラー | 定数化/環境変数 |
| 152 | `app/api/subscription/create/route.ts` | 334,458 | `primaryColor: '#3B82F6'` (計2箇所) | デフォルトカラー | 定数化/環境変数 |
| 153 | `app/api/admin/grant-permanent/route.ts` | 156 | `primaryColor: '#3B82F6'` | デフォルトカラー | 定数化/環境変数 |
| 154 | `app/api/corporate/tenant/route.ts` | 15 | `primaryColor: '#3B82F6'` | デフォルトカラー | 定数化/環境変数 |
| 155 | `app/api/corporate/branding/route.ts` | 47,48 | `'#3B82F6'` (計2箇所) | デフォルトカラー | 定数化/環境変数 |
| 156 | `app/api/corporate-member/links/route.ts` | 38,172,207,232 | `'#3B82F6'` (計4箇所) | デフォルトカラー | 定数化/環境変数 |
| 157 | `lib/corporateAccess/virtualTenant.ts` | 91 | `primaryColor: '#3B82F6'` | デフォルトカラー | 定数化/環境変数 |
| 158 | `app/dashboard/corporate-member/page.tsx` | 118,137 | `secondaryColor: '#3B82F6'` (計2箇所) | デフォルトカラー | 定数化/環境変数 |
| 159 | `app/dashboard/corporate/branding/page.tsx` | 42,471 | `'#3B82F6'` (計2箇所) | デフォルトカラー | 定数化/環境変数 |
| 160 | `app/qr/[slug]/QrCodeClient.tsx` | 46 | `'#3b82f6'` | デフォルトカラー | 定数化/環境変数 |
| 161 | `app/qrcode/page.tsx` | 136 | `primaryColor: '#3B82F6'` | デフォルトカラー | 定数化/環境変数 |
| 162 | `components/qrcode/QrCodeGenerator.tsx` | 49 | `'#3B82F6'` | デフォルトカラー | 定数化/環境変数 |
| 163 | `components/forms/ImprovedDesignForm.tsx` | 54,145 | `'#3B82F6'` (計2箇所) | デフォルトカラー | 定数化/環境変数 |
| 164 | `components/dashboard/ImprovedDesignPreview.tsx` | 26 | `'#3B82F6'` | デフォルトカラー | 定数化/環境変数 |

## 7. admin@sns-share.com（Super Admin判定）

| # | ファイルパス | 行番号 | 現在のコード（該当部分） | パターン種別 | 修正方針 |
|---|---|---|---|---|---|
| 165 | `auth.ts` | 142 | `email === 'admin@sns-share.com'` | admin判定 | `SUPER_ADMIN_EMAIL`環境変数 |
| 166 | `auth.ts` | 274 | `userEmail === 'admin@sns-share.com'` | admin判定 | 同上 |
| 167 | `middleware.ts` | 54 | `userEmail === 'admin@sns-share.com'` | admin判定 | 同上 |
| 168 | `app/dashboard/page.tsx` | 72 | `session.user?.email === 'admin@sns-share.com'` | admin判定 | 同上 |
| 169 | `lib/utils/admin-access.ts` | 5 | `ADMIN_EMAILS = ['admin@sns-share.com']` | admin判定 | 同上 |
| 170 | `lib/utils/admin-access-api.ts` | 28,83 | `'admin@sns-share.com'` (計2箇所) | admin判定 | 同上 |
| 171 | `lib/utils/admin-access-server.ts` | 6,172 | `SUPER_ADMIN_EMAIL = 'admin@sns-share.com'` (計2箇所) | admin判定 | 同上 |
| 172 | `lib/utils/subscription-server.ts` | 136 | `adminEmail = 'admin@sns-share.com'` | admin判定 | 同上 |
| 173 | `lib/utils/expense-email.ts` | 27 | `to: 'admin@sns-share.com'` | admin通知先 | 同上 |
| 174 | `lib/corporateAccess/adminAccess.ts` | 4,43,44 | `'admin@sns-share.com'` (計3箇所) | admin判定 | 同上 |
| 175 | `app/dashboard/admin/users/page.tsx` | 540 | `user.email === 'admin@sns-share.com'` | admin判定 | 同上 |
| 176 | `app/api/admin/grant-permanent/route.ts` | 16 | `session.user.email !== 'admin@sns-share.com'` | admin判定 | 同上 |
| 177 | `app/api/admin/users/delete/route.ts` | 55 | `user.email === 'admin@sns-share.com'` | admin保護 | 同上 |
| 178 | `app/api/admin/users/search/route.ts` | 56 | `email: { not: 'admin@sns-share.com' }` | admin除外 | 同上 |
| 179 | `app/api/admin/users/export/route.ts` | 39,188 | `'admin@sns-share.com'` (計2箇所) | admin判定 | 同上 |
| 180 | `app/api/admin/stripe/webhook-logs/route.ts` | 205 | `user?.email === 'admin@sns-share.com'` | admin判定 | 同上 |
| 181 | `app/api/admin/company-expenses/route.ts` | 310 | `email: 'admin@sns-share.com'` | admin取得 | 同上 |
| 182 | `app/api/admin/one-tap-seal/orders/route.ts` | 28 | `'admin@sns-share.com'` | admin判定 | 同上 |
| 183 | `app/api/admin/one-tap-seal/orders/[id]/route.ts` | 42,180 | `'admin@sns-share.com'` (計2箇所) | admin判定 | 同上 |
| 184 | `app/api/admin/cancel-requests/[id]/route.ts` | 30 | `'admin@sns-share.com'` | admin判定 | 同上 |
| 185 | `app/api/auth/dashboard-redirect/route.ts` | 20 | `session.user.email === 'admin@sns-share.com'` | admin判定 | 同上 |
| 186 | `app/api/subscription/cancel-request/route.ts` | 196 | `'admin@sns-share.com'` | admin通知先 | 同上 |
| 187 | `app/api/corporate/access/route.ts` | 114 | `ADMIN_EMAILS = ['admin@sns-share.com']` | admin判定 | 同上 |
| 188 | `app/api/user/dashboard-info/route.ts` | 10 | `SUPER_ADMIN_EMAIL = 'admin@sns-share.com'` | admin判定 | 同上 |

## 8. @sns-share.com ドメイン判定（財務管理者等）

| # | ファイルパス | 行番号 | 現在のコード（該当部分） | パターン種別 | 修正方針 |
|---|---|---|---|---|---|
| 189 | `auth.ts` | 277 | `userEmail.endsWith('@sns-share.com')` | ドメイン判定 | `ADMIN_EMAIL_DOMAIN`環境変数 |
| 190 | `lib/utils/admin-access-api.ts` | 32,62 | `email.includes('@sns-share.com')` (計2箇所) | ドメイン判定 | 同上 |
| 191 | `app/api/admin/users/export/route.ts` | 43 | `email.includes('@sns-share.com')` | ドメイン判定 | 同上 |
| 192 | `app/api/admin/cancel-requests/[id]/route.ts` | 34 | `email.includes('@sns-share.com')` | ドメイン判定 | 同上 |
| 193 | `app/api/user/dashboard-info/route.ts` | 9 | `FINANCIAL_ADMIN_DOMAIN = '@sns-share.com'` | ドメイン判定 | 同上 |

---

## サマリ

| パターン種別 | ファイル数 | ハードコード箇所数（概算） |
|---|---|---|
| ブランド名「Share」 | ~45ファイル | ~120箇所 |
| ドメイン `sns-share.com` / `app.sns-share.com` | ~30ファイル | ~130箇所 |
| `株式会社Senrigan` / `senrigan.systems` | ~20ファイル | ~50箇所 |
| 広島（住所） | ~15ファイル | ~30箇所 |
| `#3B82F6`（ユーザー表示＋デフォルト値） | ~25ファイル | ~100箇所 |
| `admin@sns-share.com` | ~20ファイル | ~30箇所 |
| `@sns-share.com` ドメイン判定 | 5ファイル | ~7箇所 |
| **合計** | **~50ファイル（重複含む）** | **~470箇所** |
