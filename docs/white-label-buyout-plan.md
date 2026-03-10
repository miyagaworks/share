# ホワイトラベル実装計画書（買取型）

**文書バージョン:** 1.3
**作成日:** 2026-03-10
**対象:** 買取プラン（ライセンス一括購入 + 月額保守）

---

## 1. 概要

### 1-1. 買取型の特徴

| 項目 | 内容 |
|------|------|
| **インフラ** | パートナー専用のSupabase / Vercelで稼働（物理分離） |
| **デプロイ** | パートナーごとに独立したアプリケーションインスタンス |
| **ドメイン** | パートナー独自ドメインで完全独立運用 |
| **アップデート** | Share側がリモートで適用（保守契約に含む） |
| **運用責任** | インフラ費用はパートナー負担、管理・更新はShare |

### 1-2. 料金体系

| 項目 | 金額（税抜） |
|------|-------------|
| **ライセンス（一括）** | ¥600,000 |
| **月額保守費** | ¥10,000 |
| **アカウント上限** | 無制限 |
| **保守内容** | サーバー管理・アップデート・技術サポート |

**パートナー負担のインフラ費（月額）:**

| サービス | 費用 | 用途 |
|----------|------|------|
| Supabase Pro | 約¥3,750/月（$25） | データベース・認証基盤 |
| Vercel Pro | 約¥3,000/月（$20） | ホスティング・CDN |
| 独自ドメイン | 約¥3,000/年 | パートナーブランドURL |

→ インフラ合計: 約¥7,000/月 + 保守費¥10,000 = **月額約¥17,000**

### 1-3. 月額型との根本的な違い

| 観点 | 月額型 | 買取型 |
|------|--------|--------|
| **インフラ** | Share管理の共有環境 | パートナー専用の独立環境 |
| **データベース** | 同一DB（テナントIDで論理分離） | **別DB（物理分離）** |
| **デプロイ** | 単一アプリ | **パートナーごとに個別デプロイ** |
| **コードベース** | Share本体そのもの | **設定ファイルで分岐する同一コード** |
| **アカウント数** | プラン上限あり（300〜1,000） | **無制限** |
| **データ主権** | Share側にデータ存在 | **パートナーのSupabaseにデータ存在** |
| **障害影響** | 全パートナーに波及しうる | **パートナーごとに独立** |

---

## 2. アーキテクチャ設計

### 2-1. デプロイ構成

```
┌─────────────────────────────────────────────────────┐
│ Share本体（sns-share.com）                            │
│  Vercel: share-production                            │
│  Supabase: share-production-db                       │
│  ※月額型パートナーもここで稼働                         │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 買取パートナーA（card.printcompany.co.jp）            │
│  Vercel: share-partner-a        ← 独立プロジェクト    │
│  Supabase: share-partner-a-db   ← 独立DB             │
│  同一GitHubリポジトリ、環境変数で分岐                   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 買取パートナーB（digital-meishi.example.com）         │
│  Vercel: share-partner-b        ← 独立プロジェクト    │
│  Supabase: share-partner-b-db   ← 独立DB             │
│  同一GitHubリポジトリ、環境変数で分岐                   │
└─────────────────────────────────────────────────────┘
```

### 2-2. コード管理戦略

**方式: 単一リポジトリ + 環境変数による分岐**

フォーク（コピー）方式は採用しない。理由：
- アップデートの適用が困難になる
- コードの品質管理が分散する
- 保守コストが台数分に比例して増大する

代わりに、**同一のGitHubリポジトリ**を全パートナーのVercelプロジェクトが参照し、
**環境変数**でブランディング・接続先を切り替える。

```
GitHub リポジトリ: share (1つ)
  ├── main ブランチ → Share本体 & 月額型パートナー（Vercel: share-production）
  ├── main ブランチ → 買取パートナーA（Vercel: share-partner-a）
  └── main ブランチ → 買取パートナーB（Vercel: share-partner-b）
      ↑ すべて同じブランチ。環境変数だけが異なる。
```

### 2-3. 環境変数によるブランド分岐

新規追加する環境変数（買取パートナー用）:

```env
# ── デプロイモード ──
DEPLOYMENT_MODE=buyout                    # "shared"（本体/月額） or "buyout"（買取）

# ── ブランディング ──
BRAND_NAME=デジカード                       # サービスブランド名
BRAND_LOGO_URL=/images/brand/logo.png     # ロゴ画像パス
BRAND_FAVICON_URL=/images/brand/favicon.ico
BRAND_PRIMARY_COLOR=#1B2A4A               # メインカラー
BRAND_SECONDARY_COLOR=#B8860B             # サブカラー

# ── 会社情報（フッター・メール等） ──
BRAND_COMPANY_NAME=株式会社プリントカンパニー
BRAND_COMPANY_ADDRESS=東京都千代田区...
BRAND_SUPPORT_EMAIL=support@printcompany.co.jp
BRAND_PRIVACY_URL=https://printcompany.co.jp/privacy
BRAND_TERMS_URL=https://printcompany.co.jp/terms

# ── メール設定 ──
FROM_NAME=デジカード                        # メール差出人名
FROM_EMAIL=noreply@printcompany.co.jp     # メール差出人アドレス
SUPPORT_EMAIL=support@printcompany.co.jp

# ── 接続先（パートナー専用） ──
DATABASE_URL=postgresql://...@partner-a-db:6543/postgres
DIRECT_URL=postgresql://...@partner-a-db:5432/postgres
NEXTAUTH_URL=https://card.printcompany.co.jp
NEXT_PUBLIC_APP_URL=https://card.printcompany.co.jp

# ── Stripe（パートナーの課金は不要、エンドユーザー課金用） ──
# パートナーが自社顧客に課金する場合のみ設定
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=       # 空 or パートナー独自のStripeキー
STRIPE_SECRET_KEY=                        # 空 or パートナー独自のStripeキー

# ── 機能フラグ ──
FEATURE_FINANCIAL_ADMIN=false             # 財務管理機能は無効
FEATURE_PARTNER_MODULE=false              # パートナー募集モジュールは無効
FEATURE_SUPER_ADMIN=false                 # Super Admin機能は無効（別の仕組みで管理）

# ── auth.ts ハードコード解消用 ──
SUPER_ADMIN_EMAIL=                        # 空にしてsuper-admin判定を無効化
ADMIN_EMAIL_DOMAIN=                       # 空にしてfinancial-admin判定を無効化

# ── 認証基盤（パートナーごとに必須） ──
NEXTAUTH_SECRET=<パートナー固有のランダム値>  # ⚠️ 環境間で絶対に同じ値にしない
# NEXTAUTH_URL は既に上記で定義済み

# ── Google OAuth（パートナー自前GCPプロジェクト推奨） ──
GOOGLE_CLIENT_ID=<パートナーのGCP Client ID>
GOOGLE_CLIENT_SECRET=<パートナーのGCP Client Secret>

# ── reCAPTCHA（現在バイパス中。有効化する場合はパートナーごとに発行） ──
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=<パートナー用サイトキー>
RECAPTCHA_SECRET_KEY=<パートナー用シークレットキー>
# ※ 現在RecaptchaWrapper.tsxがダミートークンを返すバイパス実装。
#   有効化する場合はRecaptchaWrapper.tsxの正規実装復活が前提。
```

> **⚠️ reCAPTCHAの現状（2026-03-10調査）:**
> `RecaptchaWrapper.tsx` がダミートークン（`'bypass-token-pat-issue'`）を返すバイパス実装になっており、
> サーバー側もバイパストークンを検出すると検証をスキップする。**reCAPTCHAは事実上無効。**
> `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` はコード中で一切参照されていない。
> 買取型リリースまでにバイパスを解消するかは別途判断が必要。

### 2-4. ブランド設定ユーティリティ

```typescript
// lib/brand/config.ts（新規作成）

export interface BrandConfig {
  name: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  companyName: string;
  companyAddress: string;
  supportEmail: string;
  privacyUrl: string;
  termsUrl: string;
  fromName: string;
  fromEmail: string;
  appUrl: string;
  isBuyout: boolean;
}

export function getBrandConfig(): BrandConfig {
  const isBuyout = process.env.DEPLOYMENT_MODE === 'buyout';

  return {
    name: process.env.BRAND_NAME || 'Share',
    logoUrl: process.env.BRAND_LOGO_URL || '/images/share-logo.png',
    faviconUrl: process.env.BRAND_FAVICON_URL || '/favicon.ico',
    primaryColor: process.env.BRAND_PRIMARY_COLOR || '#3B82F6',
    secondaryColor: process.env.BRAND_SECONDARY_COLOR || '',
    companyName: process.env.BRAND_COMPANY_NAME || '株式会社Senrigan',
    companyAddress: process.env.BRAND_COMPANY_ADDRESS || '',
    supportEmail: process.env.BRAND_SUPPORT_EMAIL || 'support@sns-share.com',
    privacyUrl: process.env.BRAND_PRIVACY_URL || '/privacy',
    termsUrl: process.env.BRAND_TERMS_URL || '/terms',
    fromName: process.env.FROM_NAME || 'Share',
    fromEmail: process.env.FROM_EMAIL || 'noreply@sns-share.com',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://sns-share.com',
    isBuyout,
  };
}
```

---

## 3. 機能の取捨選択

買取型ではShare運営向けの機能を無効化し、パートナーに不要な機能を除外する。

### 3-1. 機能マトリクス

| 機能カテゴリ | Share本体 | 買取型 | 備考 |
|-------------|-----------|--------|------|
| **個人プロフィール** | ✅ | ✅ | そのまま利用 |
| **法人テナント管理** | ✅ | ✅ | そのまま利用 |
| **法人メンバー管理** | ✅ | ✅ | そのまま利用 |
| **ブランディング設定** | ✅ | ✅ | そのまま利用 |
| **部署管理** | ✅ | ✅ | そのまま利用 |
| **SNSリンク管理** | ✅ | ✅ | そのまま利用 |
| **NFCシール注文** | ✅ | ⚙️ | パートナーの運用方針次第 |
| **QRコードページ** | ✅ | ✅ | そのまま利用 |
| **Super Admin** | ✅ | ❌ | FEATURE_SUPER_ADMIN=false |
| **財務管理** | ✅ | ❌ | FEATURE_FINANCIAL_ADMIN=false |
| **パートナー募集LP** | ✅ | ❌ | FEATURE_PARTNER_MODULE=false |
| **Stripe課金（個人）** | ✅ | ⚙️ | パートナーが独自課金する場合のみ |
| **トップページ（LP）** | ✅ | 🔄 | パートナーブランドに差し替え |
| **ログインページ** | ✅ | 🔄 | パートナーブランドに差し替え |
| **メール通知** | ✅ | 🔄 | パートナーブランドで送信 |

凡例: ✅そのまま / 🔄ブランド差し替え / ⚙️設定次第 / ❌無効化

### 3-2. 機能フラグによる制御

```typescript
// lib/features.ts（新規作成）

export const features = {
  superAdmin: process.env.FEATURE_SUPER_ADMIN !== 'false',
  financialAdmin: process.env.FEATURE_FINANCIAL_ADMIN !== 'false',
  partnerModule: process.env.FEATURE_PARTNER_MODULE !== 'false',
  stripePayment: !!process.env.STRIPE_SECRET_KEY,
  nfcSealOrder: process.env.FEATURE_NFC_SEAL_ORDER !== 'false',
};
```

**適用箇所:**

```typescript
// middleware.ts
if (!features.superAdmin && role === 'super-admin') {
  // 買取型では super-admin ロールは存在しない
  // 代わりに最初に登録した管理者を admin として扱う
}

// app/dashboard/admin/layout.tsx
if (!features.superAdmin) {
  redirect('/dashboard');  // Super Admin画面にアクセスさせない
}

// ナビゲーション
// features.partnerModule === false なら /partner リンクを非表示
```

---

## 4. 変更が必要なファイルと実装詳細

### 4-1. ブランド適用対象の一覧

> **v1.3更新（2026-03-10 ハードコード全数調査反映）:**
> 調査結果 `audit-hardcoded-brand.md` により、ハードコード箇所は**~470箇所、~50ファイル**に及ぶことが判明。
> 以下は全対象ファイルの一覧（フェーズ1で対応するもの + 後続フェーズで対応するものを区分）。

#### A. フェーズ1: 基盤（環境変数化・BrandConfig導入）

| # | ファイル / 領域 | 変更内容 | ハードコード数 |
|---|----------------|----------|---------------|
| 1 | `lib/brand/config.ts`（新規） | BrandConfig ユーティリティ作成 | — |
| 2 | `lib/features.ts`（新規） | 機能フラグ定義 | — |
| 3 | `lib/auth/constants.ts`（新規） | SUPER_ADMIN_EMAIL / ADMIN_EMAIL_DOMAIN 定数集約 | — |
| 4 | `auth.ts` | `admin@sns-share.com` 3箇所 + `@sns-share.com` 1箇所 + `#3B82F6` 1箇所の環境変数化 | 5 |
| 5 | `middleware.ts` | `admin@sns-share.com` 1箇所 + 機能フラグルート制御 | 1 |
| 6 | `app/dashboard/page.tsx` | `admin@sns-share.com` 1箇所 | 1 |
| 7 | `app/layout.tsx` | タイトル・ファビコン・`apple-mobile-web-app-title`・`theme-color` | 3 |
| 8 | `next.config.mjs` | `assetPrefix` + CSPヘッダー6箇所の `app.sns-share.com` 環境変数化 | 7 |
| 9 | `public/manifest.json` → `app/manifest.ts` | PWAブランド名・テーマカラーの動的生成 | 3 |

#### B. フェーズ1: admin判定ハードコード（調査で大幅増）

> ⚠️ **計画v1.2では5箇所としていたが、調査により24箇所以上（20+ファイル）に判明**

| # | ファイル | `admin@sns-share.com` 箇所数 | 備考 |
|---|---------|-----|------|
| 10 | `lib/utils/admin-access.ts` | 1 | `ADMIN_EMAILS` 配列 |
| 11 | `lib/utils/admin-access-api.ts` | 2 + ドメイン判定2 | admin判定 + `@sns-share.com` |
| 12 | `lib/utils/admin-access-server.ts` | 2 | `SUPER_ADMIN_EMAIL` 定数 |
| 13 | `lib/utils/subscription-server.ts` | 1 | adminEmail |
| 14 | `lib/utils/expense-email.ts` | 1 | admin通知先 |
| 15 | `lib/corporateAccess/adminAccess.ts` | 3 | admin判定 |
| 16 | `app/dashboard/admin/users/page.tsx` | 1 | admin判定 |
| 17 | `app/api/admin/grant-permanent/route.ts` | 1 | admin判定 |
| 18 | `app/api/admin/users/delete/route.ts` | 1 | admin保護 |
| 19 | `app/api/admin/users/search/route.ts` | 1 | admin除外 |
| 20 | `app/api/admin/users/export/route.ts` | 2 + ドメイン判定1 | admin判定 |
| 21 | `app/api/admin/stripe/webhook-logs/route.ts` | 1 | admin判定 |
| 22 | `app/api/admin/company-expenses/route.ts` | 1 | admin取得 |
| 23 | `app/api/admin/one-tap-seal/orders/route.ts` | 1 | admin判定 |
| 24 | `app/api/admin/one-tap-seal/orders/[id]/route.ts` | 2 | admin判定 |
| 25 | `app/api/admin/cancel-requests/[id]/route.ts` | 1 + ドメイン判定1 | admin判定 |
| 26 | `app/api/auth/dashboard-redirect/route.ts` | 1 | admin判定 |
| 27 | `app/api/subscription/cancel-request/route.ts` | 1 | admin通知先 |
| 28 | `app/api/corporate/access/route.ts` | 1 | `ADMIN_EMAILS` 配列 |
| 29 | `app/api/user/dashboard-info/route.ts` | 1 + ドメイン判定1 | admin判定 + `FINANCIAL_ADMIN_DOMAIN` |

#### C. フェーズ1: app.sns-share.com ハードコード（調査で追加発見）

| # | ファイル | 箇所数 | 修正方針 |
|---|---------|--------|---------|
| 30 | `lib/one-tap-seal/profile-slug-manager.ts` | 1 | `NEXT_PUBLIC_APP_URL` |
| 31 | `lib/utils/expense-email.ts` | 1 | `NEXT_PUBLIC_APP_URL` |
| 32 | `lib/profit-allocation.ts` | 2 | 環境変数化（`yoshitsune@` / `kensei@`） |
| 33 | `app/api/subscription/create/route.ts` | 1 | `NEXT_PUBLIC_APP_URL` |
| 34 | `app/api/one-tap-seal/validate-profile/route.ts` | 1 | `NEXT_PUBLIC_APP_URL` |
| 35 | `app/api/vcard/[userId]/route.ts` | 1 | `NEXT_PUBLIC_APP_URL` |
| 36 | `app/api/corporate/users/invite/route.ts` | 1 | `NEXT_PUBLIC_APP_URL` |
| 37 | `app/api/corporate/users/[id]/route.ts` | 1 | `NEXT_PUBLIC_APP_URL` |
| 38 | `app/api/corporate/users/[id]/resend-invite/route.ts` | 1 | `NEXT_PUBLIC_APP_URL` |
| 39 | `app/api/test-email/route.ts` | 1 | 環境変数化 |
| 40 | `components/one-tap-seal/OneTapSealUrlManager.tsx` | 5 | `NEXT_PUBLIC_APP_URL` |
| 41 | `components/one-tap-seal/OneTapSealOrderSummary.tsx` | 1 | `NEXT_PUBLIC_APP_URL` |
| 42 | `components/subscription/SubscriptionWithOneTapSeal.tsx` | 2 | `NEXT_PUBLIC_APP_URL` |
| 43 | `app/dashboard/admin/email/page.tsx` | 1 | placeholder |

#### D. フェーズ1: メールテンプレート + メール送信APIのブランド動的化

| # | ファイル | Share/ドメイン/会社名/住所/カラー合計 |
|---|---------|------|
| 44 | `lib/email/templates/email-verification.ts` | ~28箇所 |
| 45 | `lib/email/templates/invite-email.ts` | ~23箇所 |
| 46 | `lib/email/templates/admin-notification.ts` | ~18箇所 |
| 47 | `lib/email/templates/trial-ending.ts` | ~22箇所 |
| 48 | `lib/email/templates/cancel-request.ts` | ~15箇所 |
| 49 | `lib/email/templates/grace-period-expired.ts` | ~16箇所 |
| 50 | `lib/email/templates/expense-approval.ts` | ~11箇所 |
| 51 | `lib/email/templates/expense-approval-result.ts` | ~11箇所 |
| 52 | `lib/email/templates/shipping-notification.ts` | ~17箇所 |
| 53 | `lib/email/templates/partner-inquiry.ts` | ~15箇所 |
| 54 | `lib/email/index.ts` | 2箇所（FROM_NAME / テストメール件名） |
| 55 | `app/api/support/contact/route.ts` | ~67箇所（Share/ドメイン/会社名/住所/カラー） |
| 56 | `app/api/auth/forgot-password/route.ts` | ~7箇所 |
| 57 | `app/api/subscription/cancel-request/route.ts` | 1箇所 |
| 58 | `app/api/admin/cancel-requests/[id]/route.ts` | 1箇所 |
| 59 | `app/partner/actions/submitPartnerInquiry.ts` | 4箇所 |

#### E. フェーズ1: UIページのブランド動的化

| # | ファイル | 箇所数 | 備考 |
|---|---------|--------|------|
| 60 | `app/[slug]/page.tsx` | 4 | OGP + `Powered by Share` + リンク |
| 61 | `app/page.tsx` | ~8 | トップページ全体（買取型はリダイレクト） |
| 62 | `app/not-found.tsx` | 5 | コピーライト + ブランドカラーSVG |
| 63 | `app/auth/signin/page.tsx` | 3 | ロゴ・ブランド名 |
| 64 | `app/auth/signup/page.tsx` | 3 | 同上 |
| 65 | `app/auth/error/page.tsx` | 3 | 同上 |
| 66 | `app/auth/forgot-password/page.tsx` | 3 | 同上 |
| 67 | `app/auth/reset-password/page.tsx` | 4 | 同上 |
| 68 | `app/auth/email-verification/page.tsx` | 3 | 同上 |
| 69 | `app/auth/invite/page.tsx` | 5 | 同上 |
| 70 | `app/company/about/page.tsx` | ~11 | 会社名・住所・メール・URL |
| 71 | `app/company/service/page.tsx` | 5 | ブランド名 |
| 72 | `app/support/contact/ContactPageContent.tsx` | 3 | メール・会社名・住所 |
| 73 | `app/support/help/page.tsx` | 2 | ブランド名 |
| 74 | `app/support/faq/page.tsx` | 9 | ブランド名（FAQ全体） |
| 75 | `app/legal/terms/page.tsx` | 4 | ブランド名・会社名 |
| 76 | `app/legal/privacy/page.tsx` | 4 | ブランド名・会社名・メール |
| 77 | `app/legal/transactions/page.tsx` | 4 | ブランド名・会社名・住所・メール |
| 78 | `app/jikogene/layout.tsx` | 1 | タイトル |
| 79 | `app/qr/[slug]/page.tsx` | 3 | タイトル |
| 80 | `app/qrcode/layout.tsx` | 1 | タイトル |
| 81 | `app/dashboard/tutorial/page.tsx` | 3 | ブランド名 |
| 82 | `components/layout/Header.tsx` | 1 | alt属性 |
| 83 | `components/layout/DashboardHeader.tsx` | 1 | alt属性 |
| 84 | `components/layout/Footer.tsx` | 1 | 会社名 |
| 85 | `components/dashboard/ImprovedDesignPreview.tsx` | 2 | `Powered by Share` + デフォルトカラー |
| 86 | `components/corporate/ImprovedBrandingPreview.tsx` | 1 | `Powered by Share` |
| 87 | `components/corporate/EnhancedBrandingPreview.tsx` | 1 | `Powered by Share` |
| 88 | `components/corporate/BrandingPreview.tsx` | 1 | `Powered by Share` |
| 89 | `components/YouTubeGuideCard.tsx` | 2 | ブランド名 |
| 90 | `components/subscription/EnhancedTrialBanner.tsx` | 1 | ブランドカラーグラデーション |

#### F. フェーズ1: デフォルトカラー `#3B82F6` の定数化

| # | ファイル | 箇所数 | 備考 |
|---|---------|--------|------|
| 91 | `app/api/auth/register/route.ts` | 1 | `mainColor` デフォルト |
| 92 | `app/api/webhook/stripe/route.ts` | 1 | `primaryColor` デフォルト |
| 93 | `app/api/subscription/create/route.ts` | 2 | `primaryColor` デフォルト |
| 94 | `app/api/admin/grant-permanent/route.ts` | 1 | `primaryColor` デフォルト |
| 95 | `app/api/corporate/tenant/route.ts` | 1 | `primaryColor` デフォルト |
| 96 | `app/api/corporate/branding/route.ts` | 2 | デフォルトカラー |
| 97 | `app/api/corporate-member/links/route.ts` | 4 | デフォルトカラー |
| 98 | `lib/corporateAccess/virtualTenant.ts` | 1 | デフォルトカラー |
| 99 | `app/dashboard/corporate-member/page.tsx` | 2 | デフォルトカラー |
| 100 | `app/dashboard/corporate/branding/page.tsx` | 2 | デフォルトカラー |
| 101 | `app/qr/[slug]/QrCodeClient.tsx` | 1 | デフォルトカラー |
| 102 | `app/qrcode/page.tsx` | 1 | デフォルトカラー |
| 103 | `components/qrcode/QrCodeGenerator.tsx` | 1 | デフォルトカラー |
| 104 | `components/forms/ImprovedDesignForm.tsx` | 2 | デフォルトカラー |
| 105 | `app/styles/base/variables.css` | 2 | CSS変数（動的化は要検討） |

#### G. 買取型で無効化されるため対応不要

| ファイル群 | 理由 |
|-----------|------|
| `app/partner/**` | `FEATURE_PARTNER_MODULE=false` で無効化 |
| `app/dashboard/admin/**` | `FEATURE_SUPER_ADMIN=false` で無効化（ただしadmin判定のハードコードはセクションBで対応必須） |

#### サマリ（v1.3）

| パターン種別 | ファイル数 | ハードコード箇所数（概算） |
|---|---|---|
| ブランド名「Share」 | ~45 | ~120 |
| ドメイン `sns-share.com` / `app.sns-share.com` | ~30 | ~130 |
| `株式会社Senrigan` / `senrigan.systems` | ~20 | ~50 |
| 広島（住所） | ~15 | ~30 |
| `#3B82F6`（表示＋デフォルト値） | ~25 | ~100 |
| `admin@sns-share.com` | **~20** | **~30**（v1.2の5箇所から大幅増） |
| `@sns-share.com` ドメイン判定 | 5 | ~7 |
| **合計** | **~50（重複含む）** | **~470** |

### 4-2. メールテンプレートの改修

現状、全テンプレートに `Share` のブランドがハードコードされている。
`getBrandConfig()` を使って動的に切り替える。

```typescript
// lib/email/templates/base.ts（新規: 共通ベーステンプレート）

import { getBrandConfig } from '@/lib/brand/config';

export function emailHeader(): string {
  const brand = getBrandConfig();
  return `
    <div style="background: ${brand.primaryColor}; padding: 24px; text-align: center;">
      ${brand.logoUrl
        ? `<img src="${brand.appUrl}${brand.logoUrl}" alt="${brand.name}" height="40" />`
        : `<h1 style="color: white; font-size: 24px;">${brand.name}</h1>`
      }
    </div>
  `;
}

export function emailFooter(): string {
  const brand = getBrandConfig();
  return `
    <div style="padding: 24px; text-align: center; color: #7B8794; font-size: 12px;">
      <p>${brand.companyName}</p>
      ${brand.companyAddress ? `<p>${brand.companyAddress}</p>` : ''}
      <p>
        <a href="mailto:${brand.supportEmail}">${brand.supportEmail}</a>
      </p>
    </div>
  `;
}
```

### 4-3. トップページの切り替え

```typescript
// app/page.tsx
import { getBrandConfig } from '@/lib/brand/config';

export default function Home() {
  const brand = getBrandConfig();

  if (brand.isBuyout) {
    // 買取型: パートナー独自のトップページ or ログインへリダイレクト
    redirect('/login');
    // ※パートナーが独自LPを持つ場合は外部URLへリダイレクトも可
  }

  // Share本体のトップページ（既存）
  return <ShareTopPage />;
}
```

### 4-4. next.config.mjs の調整

現在 `next.config.mjs` には `https://app.sns-share.com` が **CSPヘッダー内に6箇所**ハードコードされている。
買取型パートナーのドメインではこれらがCSP違反を引き起こすため、環境変数化が必須。

```javascript
// next.config.mjs
const isBuyout = process.env.DEPLOYMENT_MODE === 'buyout';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.sns-share.com';

const nextConfig = {
  assetPrefix: isBuyout ? undefined : appUrl,
  // 買取型はVercelのデフォルトCDNを使用するため assetPrefix 不要

  images: {
    // パートナードメインを許可
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      // 買取型: パートナーの Supabase ドメインを許可
    ],
  },

  // CSPヘッダー: app.sns-share.com を環境変数に置換（6箇所）
  async headers() {
    return [{
      source: '/(.*)',
      headers: [{
        key: 'Content-Security-Policy',
        value: [
          `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${appUrl} ...`,
          `script-src-elem 'self' 'unsafe-inline' ${appUrl} ...`,
          `style-src 'self' 'unsafe-inline' ${appUrl} ...`,
          `font-src 'self' ${appUrl} ...`,
          `connect-src 'self' ${appUrl} ...`,
        ].join('; '),
      }],
    }];
  },
  // ...
};
```

### 4-5. PWA manifest.json の動的生成

`public/manifest.json` に `"name": "Share"` がハードコードされている。
買取型ではパートナーブランド名を表示するため、Next.js 15 の manifest generation を使用する。

```typescript
// app/manifest.ts（新規作成）
import { getBrandConfig } from '@/lib/brand/config';

export default function manifest() {
  const brand = getBrandConfig();
  return {
    name: brand.name,
    short_name: brand.name,
    description: `${brand.name} - デジタル名刺サービス`,
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: brand.primaryColor,
    icons: [
      { src: '/pwa/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/pwa/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
```

### 4-6. admin判定ハードコード対応（v1.3: 5箇所→24箇所以上に増）

> **⚠️ v1.3更新:** 調査により `admin@sns-share.com` のハードコードが**24箇所以上、20+ファイル**に分散していることが判明。
> 計画v1.2では `auth.ts`（3箇所）+ `middleware.ts`（1箇所）+ `app/dashboard/page.tsx`（1箇所）の5箇所としていたが、
> 実際にはadminユーティリティ、API routes、法人アクセス制御にも広範に分散。

**修正方針:** `lib/auth/constants.ts` に定数を集約し、全24箇所以上から共通参照する。

```typescript
// lib/auth/constants.ts（新規: 共通定数として切り出し）
export const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'admin@sns-share.com';
export const ADMIN_EMAIL_DOMAIN = process.env.ADMIN_EMAIL_DOMAIN || '@sns-share.com';

// ヘルパー関数
export function isSuperAdmin(email: string | null | undefined): boolean {
  if (!email || !SUPER_ADMIN_EMAIL) return false;
  return email === SUPER_ADMIN_EMAIL;
}

export function isFinancialAdmin(email: string | null | undefined): boolean {
  if (!email || !ADMIN_EMAIL_DOMAIN) return false;
  return email.endsWith(ADMIN_EMAIL_DOMAIN);
}
```

**対応が必要な全ファイル一覧（セクション4-1 B も参照）:**

| グループ | ファイル | 箇所数 |
|---------|---------|--------|
| コア認証 | `auth.ts` | 3 + ドメイン判定1 |
| ミドルウェア | `middleware.ts` | 1 |
| ダッシュボード | `app/dashboard/page.tsx` | 1 |
| adminユーティリティ | `lib/utils/admin-access.ts` / `admin-access-api.ts` / `admin-access-server.ts` / `subscription-server.ts` / `expense-email.ts` | 8 + ドメイン判定2 |
| 法人アクセス | `lib/corporateAccess/adminAccess.ts` | 3 |
| Admin API routes | `grant-permanent` / `users/delete` / `users/search` / `users/export` / `stripe/webhook-logs` / `company-expenses` / `one-tap-seal/orders` / `cancel-requests` | 10 + ドメイン判定2 |
| その他API | `auth/dashboard-redirect` / `subscription/cancel-request` / `corporate/access` / `user/dashboard-info` | 4 + ドメイン判定1 |
| **合計** | **20+ファイル** | **~30箇所** |

```env
# 買取型環境変数例:
SUPER_ADMIN_EMAIL=      # 空 → isSuperAdmin() が常にfalseを返す
ADMIN_EMAIL_DOMAIN=     # 空 → isFinancialAdmin() が常にfalseを返す
```

---

## 5. プロビジョニング手順（新規パートナーの立ち上げ）

### 5-1. Share側の作業フロー

```
1. 契約締結（ライセンス料 ¥600,000 の入金確認）
   │
2. パートナー情報のヒアリング
   │  ├── ブランド名
   │  ├── ロゴ（PNG/SVG）、ファビコン
   │  ├── ブランドカラー（プライマリ / セカンダリ）
   │  ├── 会社情報（社名、住所、サポートメール）
   │  ├── 独自ドメイン
   │  └── 管理者のメールアドレス
   │
3. Supabase プロジェクト作成
   │  ├── リージョン: ap-northeast-1（東京）
   │  ├── プラン: Pro ($25/月)
   │  ├── Prisma マイグレーション実行
   │  └── 初期管理者ユーザーの作成
   │
4. Vercel プロジェクト作成
   │  ├── GitHubリポジトリ接続（同一リポジトリ）
   │  ├── 環境変数の設定（セクション2-3参照）
   │  ├── カスタムドメイン追加
   │  └── 初回デプロイ
   │
5. DNS 設定依頼（パートナーへ）
   │  └── CNAME: card.printcompany.co.jp → cname.vercel-dns.com
   │
6. 外部サービス設定
   │  ├── Resend: パートナードメインの追加・DNS検証
   │  ├── Google OAuth: パートナードメインの設定（下記6a参照）
   │  ├── reCAPTCHA: パートナードメインの設定（下記6b参照）
   │  └── Stripe（任意）: パートナー用アカウント or Connect設定
   │
7. 動作確認・引き渡し
   └── パートナー管理者にログイン情報を送付
```

#### 5-1a. Google OAuth 設定手順

**推奨案: パートナーが自前GCPプロジェクトを作成（案B）**

> 理由: Share側GCPに追加する案Aは簡単だが、OAuth同意画面のアプリ名が「Share」のままになる。
> パートナーブランドでの完全なホワイトラベルを実現するには案Bが必要。

| ステップ | 作業内容 | 担当 |
|---------|---------|------|
| 1 | Google Cloud Consoleで新規プロジェクト作成 | Share（or パートナーのGCPアカウントで） |
| 2 | OAuth同意画面を設定（アプリ名=パートナーブランド名） | Share |
| 3 | OAuth 2.0 クライアントIDを作成 | Share |
| 4 | 承認済みリダイレクトURIに `https://パートナードメイン/api/auth/callback/google` を追加 | Share |
| 5 | 取得した `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` をVercel環境変数に設定 | Share |

> **簡易案（案A）を選ぶ場合:**
> Share側のGCPプロジェクトにリダイレクトURI `https://パートナードメイン/api/auth/callback/google` を追加するだけ。
> OAuth同意画面は「Share」のまま。パートナーが許容する場合はこちらでも可。

#### 5-1b. reCAPTCHA 設定手順

> **現状（2026-03-10）:** reCAPTCHAはバイパス中（`RecaptchaWrapper.tsx`がダミートークンを返す）。
> バイパスを解消しない限り、パートナー環境でもreCAPTCHA設定は不要。

**バイパスを解消してreCAPTCHAを有効化する場合:**

| ステップ | 作業内容 | 担当 |
|---------|---------|------|
| 1 | Google reCAPTCHA管理画面でパートナー用v3サイトキーを新規作成 | Share |
| 2 | ドメインにパートナードメインを登録 | Share |
| 3 | サイトキーとシークレットキーをVercel環境変数に設定（`NEXT_PUBLIC_RECAPTCHA_SITE_KEY` / `RECAPTCHA_SECRET_KEY`） | Share |
| 4 | `RecaptchaWrapper.tsx` のバイパス実装を正規実装に戻す（全環境共通の前提修正） | 開発 |

> **推奨:** パートナーごとに別のサイトキー/シークレットキーを発行する。
> 同一キーだとShare + 全パートナーの統計が混在する。

```
```

### 5-1c. 画像アセット（ロゴ・ファビコン）の配置方針

> **調査結果（`audit-image-storage.md`）に基づく段階的アプローチ**

**Phase 1（即時対応）: 現行のBase64方式を活用**

- 現在 `CorporateTenant.logoUrl` にBase64 data URLで保存する仕組みが動いている
- 買取型パートナーも各自のDBにBase64で保存すれば、ストレージ実装なしで対応可能
- ファビコンは環境変数 `BRAND_FAVICON_URL` で指定（デフォルト: `/pwa/favicon.ico`）
- パートナーのロゴ画像は `BRAND_LOGO_URL` 環境変数で指定（デフォルト: `/logo.svg`）

**Phase 2（パートナー増加時）: Supabase Storageに移行**

- Base64はDBサイズを圧迫するため、パートナー数/画像数が増えたらStorage移行
- `next.config.mjs` に `remotePatterns: [{ hostname: '*.supabase.co' }]` を追加
- 各パートナーが独自Supabaseを持つ買取型の前提と合致

> **選定理由:** リポジトリに `public/images/partners/{slug}/` で配置する案もあるが、
> 全パートナーの画像が全デプロイに含まれる問題がある。Phase 1のBase64 + 環境変数が最小コスト。

### 5-2. プロビジョニング所要時間

| ステップ | 所要時間 | 担当 |
|----------|----------|------|
| 情報ヒアリング | 1営業日 | パートナー |
| Supabase + Vercel セットアップ | 2〜3時間 | Share |
| DNS設定 | 1〜2営業日（反映待ち） | パートナー |
| 外部サービス設定 | 1〜2時間 | Share |
| 動作確認 | 1時間 | Share |
| **合計** | **最短3営業日** | |

### 5-3. プロビジョニングスクリプト（自動化）

将来的に以下のスクリプトで自動化する:

```bash
# scripts/provision-partner.sh（構想）
#!/bin/bash
# 使用方法: ./scripts/provision-partner.sh <partner-slug>

PARTNER_SLUG=$1
CONFIG_FILE="partners/${PARTNER_SLUG}/config.json"

# 1. Supabase プロジェクト作成（Supabase CLI）
supabase projects create "share-${PARTNER_SLUG}" \
  --region ap-northeast-1 \
  --plan pro

# 2. マイグレーション実行
DATABASE_URL=$(supabase projects api-keys ...) \
  npx prisma migrate deploy

# 3. Vercel プロジェクト作成（Vercel CLI）
vercel project add "share-${PARTNER_SLUG}"

# 4. 環境変数設定
vercel env add DATABASE_URL production < ...
vercel env add BRAND_NAME production < ...
# ...

# 5. デプロイ
vercel deploy --prod

# 6. カスタムドメイン追加
vercel domains add card.printcompany.co.jp
```

---

## 6. アップデート・保守運用

### 6-1. アップデートの適用フロー

```
Share 開発チーム
  ↓ main ブランチにコミット & プッシュ
  ↓
GitHub リポジトリ（main ブランチ）
  ├──→ Vercel: share-production     → 自動デプロイ（Share本体）
  ├──→ Vercel: share-partner-a      → 自動デプロイ（買取パートナーA）
  └──→ Vercel: share-partner-b      → 自動デプロイ（買取パートナーB）
       ↑ すべて同一ブランチを参照しているため、自動的に全環境に反映
```

**重要な注意点:**
- DBマイグレーションを伴う更新は、各パートナーのSupabaseに個別にマイグレーションを実行する必要がある
- 破壊的変更がある場合は事前にパートナーへ通知

> ⚠️ **デプロイとマイグレーションのタイミング不整合リスク:**
> mainブランチへのpushで全VercelプロジェクトがVercel側で自動デプロイされるが、
> DBマイグレーションは手動実行のため、**アプリが新スキーマを期待しているのにDBが旧スキーマ**という
> 不整合が発生する可能性がある。これを防ぐため、以下のいずれかの対策を実施する。

### 6-2. DBマイグレーションの運用

#### 手動実行スクリプト

```bash
# 全パートナー環境にマイグレーション適用スクリプト
# scripts/migrate-all.sh

#!/bin/bash
set -e  # エラー時に停止

PARTNERS=("partner-a" "partner-b" "partner-c")
FAILED=()

for partner in "${PARTNERS[@]}"; do
  echo "Migrating: ${partner}"
  source "partners/${partner}/.env"
  if npx prisma migrate deploy; then
    echo "✅ Done: ${partner}"
  else
    echo "❌ Failed: ${partner}"
    FAILED+=("${partner}")
  fi
done

if [ ${#FAILED[@]} -gt 0 ]; then
  echo "⚠️ Migration failed for: ${FAILED[*]}"
  exit 1
fi
```

#### CI/CD統合方針（GitHub Actions）

マイグレーションを伴うPRには `db-migration` ラベルを付け、
マージ時に自動でマイグレーションを実行する。

```yaml
# .github/workflows/migrate-partners.yml
name: Migrate Partner DBs
on:
  push:
    branches: [main]
    paths:
      - 'prisma/migrations/**'

jobs:
  migrate:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        partner: [partner-a, partner-b]  # パートナーが増えたら追加
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - name: Run migration
        env:
          DATABASE_URL: ${{ secrets[format('DATABASE_URL_{0}', matrix.partner)] }}
          DIRECT_URL: ${{ secrets[format('DIRECT_URL_{0}', matrix.partner)] }}
        run: npx prisma migrate deploy
```

> **運用ルール:** マイグレーションを含むデプロイは以下の手順で実施する:
> 1. PRに `db-migration` ラベルを付ける
> 2. PRマージ前に各パートナーの Vercel Auto Deploy を一時停止（Vercel管理画面 or API）
> 3. PRをマージ → GitHub Actions が `prisma/migrations/` 変更を検知し、全パートナーDBにマイグレーション自動実行
> 4. GitHub Actions のマイグレーション成功を確認
> 5. 各パートナーの Vercel Auto Deploy を再開 → 自動デプロイが走る
> 6. 各パートナー環境の動作確認
>
> ※ マイグレーションがGitHub Actionsで**自動実行**され、成功確認後にデプロイが走る順序を保証するため、
> Auto Deployの一時停止・再開をワークフローに組み込む。手動スクリプト（`scripts/migrate-all.sh`）はフォールバック用として残す。

### 6-3. パートナー環境管理ディレクトリ

```
partners/                              # .gitignore に追加（機密情報）
├── partner-a/
│   ├── config.json                    # ブランド設定（非機密）
│   ├── .env                           # 環境変数（機密）
│   └── README.md                      # 運用メモ
├── partner-b/
│   ├── config.json
│   ├── .env
│   └── README.md
└── _template/
    ├── config.json                    # テンプレート
    └── .env.example                   # 環境変数テンプレート
```

### 6-4. 保守業務の一覧

月額保守費 ¥10,000 に含まれる業務:

| 業務 | 頻度 | 内容 |
|------|------|------|
| アプリケーション更新 | 随時 | mainブランチの更新が自動反映 |
| DBマイグレーション | 必要時 | スキーマ変更時に手動実行 |
| セキュリティパッチ | 随時 | 依存パッケージの更新 |
| Supabase監視 | 常時 | DB容量・接続数の監視 |
| Vercel監視 | 常時 | デプロイ状態・エラー監視 |
| 技術サポート | メール | 操作方法・トラブル対応 |
| SSL証明書更新 | 自動 | Vercelが自動管理 |

### 6-5. 保守に含まれないもの（別途見積）

- パートナー独自のカスタム機能開発
- パートナー独自デザインのLP制作
- Supabase Pro / Vercel Pro のプラン超過分
- Stripe決済の導入支援（別途相談）

---

## 7. セキュリティ設計

### 7-1. データの物理分離

月額型と異なり、買取型はデータが完全に物理分離される:

```
Share本体DB（Supabase share-production-db）
  └── Share本体 + 月額型パートナーのデータ

パートナーA DB（Supabase share-partner-a-db）  ← 完全独立
  └── パートナーAのユーザー・テナントデータのみ

パートナーB DB（Supabase share-partner-b-db）  ← 完全独立
  └── パートナーBのユーザー・テナントデータのみ
```

→ 他パートナーのデータには原理的にアクセス不可能

### 7-2. アクセス権限

| 権限 | Share | パートナー |
|------|-------|-----------|
| ソースコード（GitHub） | フルアクセス | **アクセス不可** |
| Supabase管理画面 | フルアクセス | **アクセス不可**（Share側で管理） |
| Vercel管理画面 | フルアクセス | **アクセス不可**（Share側で管理） |
| アプリケーション管理画面 | ー | フルアクセス（admin） |
| 環境変数 | 管理 | 閲覧不可 |

※ パートナーにはソースコード・インフラの直接アクセス権を**渡さない**。
  あくまでアプリケーション画面（管理ダッシュボード）を通じた操作のみ。

### 7-3. パートナー環境の管理者ロール

買取型ではsuper-adminは存在しない。代わりに:

```
admin（最初に設定した管理者）
  ├── テナントの作成・管理
  ├── ブランディング変更（アプリ内設定のみ。環境変数レベルの変更はShareに依頼）
  ├── ユーザー管理
  └── 利用状況確認

member（法人テナントのメンバー）
  └── 通常の機能利用

personal（個人ユーザー）
  └── 通常の機能利用
```

### 7-4. Google OAuthの注意点

パートナードメインでGoogleログインを使う場合:
- Google Cloud ConsoleでリダイレクトURIにパートナードメインを追加
- **Share側のGoogle OAuthプロジェクトを共用**する（パートナーには見えない）
- または、パートナーが独自のGoogle OAuthプロジェクトを持ち、そのキーを環境変数に設定

---

## 8. NFCシール運用の選択肢

買取型パートナーのNFCシール対応は3パターン:

| パターン | 概要 | メリット | デメリット |
|----------|------|----------|-----------|
| **(A) Share代行** | パートナーの顧客からの注文をShareが受注・発送 | パートナーの在庫リスクゼロ | マージンが小さい |
| **(B) パートナー独自** | パートナーが独自にNFCシールを仕入れ・販売 | 自由な価格設定 | 在庫管理が必要 |
| **(C) 無効化** | NFCシール注文機能を無効化 | シンプル | NFCの訴求力低下 |

→ `FEATURE_NFC_SEAL_ORDER` 環境変数で制御

---

## 9. Stripe課金の選択肢

パートナーが自社顧客に課金する場合の選択肢:

| パターン | 概要 | 推奨度 |
|----------|------|--------|
| **(A) 課金なし** | パートナーが独自に請求書で回収。アプリ内課金機能は無効 | 初期推奨 |
| **(B) パートナー独自Stripe** | パートナーがStripeアカウントを開設、そのキーを環境変数に設定 | 中期 |
| **(C) Stripe Connect** | ShareのStripe経由でパートナーにペイアウト | 複雑 |

→ フェーズ1では **(A)** を推奨。パートナーが顧客に課金したい場合は **(B)** を案内。

---

## 10. 実装スケジュール

### フェーズ1: 買取型対応の基盤（4〜5週間）

> ※ v1.3見積もり（v1.2の3〜4週間から増加）。理由: ハードコード全数調査により、
> admin判定が5箇所→24箇所以上、`app.sns-share.com` がAPI/コンポーネントに追加15箇所以上、
> デフォルトカラー `#3B82F6` が20+箇所に分散、全体で~470箇所の対応が必要と判明。

| # | タスク | 所要時間 | 備考（v1.2からの変更） |
|---|--------|----------|---------------------|
| 1 | `lib/brand/config.ts` の作成 | 2時間 | 変更なし |
| 2 | `lib/features.ts` の作成（機能フラグ） | 1時間 | 変更なし |
| 3 | `lib/auth/constants.ts` 作成 + admin判定ハードコード**24箇所以上（20+ファイル）**の環境変数化 | **8〜10時間** | ⬆️ v1.2の3〜4時間から大幅増。admin-access系ユーティリティ・API routes全体に分散 |
| 4 | メールテンプレート + メール送信API のブランド動的化（**10テンプレート + 4 API route**） | **12〜16時間** | ⬆️ `app/api/support/contact/route.ts` 単体で67箇所。`forgot-password`等も追加 |
| 5 | `app.sns-share.com` ハードコードの `NEXT_PUBLIC_APP_URL` 化（**API routes + コンポーネント15箇所以上**） | **4〜6時間** | 🆕 OneTapSeal系・vCard・招待API等 |
| 6 | `app/[slug]/page.tsx` のOGP・ブランド分岐 | 3時間 | 変更なし |
| 7 | `app/layout.tsx` のファビコン・タイトル・メタタグ分岐 | 2時間 | 変更なし |
| 8 | `next.config.mjs` のassetPrefix + CSPヘッダー環境変数化 | 3時間 | 変更なし |
| 9 | `app/manifest.ts` PWA manifest動的生成 | 1時間 | 変更なし |
| 10 | `middleware.ts` の機能フラグ対応 | 2時間 | 変更なし |
| 11 | 認証ページのブランド対応（**signin / signup / error / forgot-password / reset-password / email-verification / invite の7ページ**） | **4〜5時間** | ⬆️ 全7認証ページに分散 |
| 12 | トップページの分岐処理 + `app/not-found.tsx` | 1.5時間 | 🆕 not-found.tsx追加 |
| 13 | UIページのブランド動的化（**company/service / support/help / support/faq / legal/terms + 既存の4ページ**） | **4〜5時間** | ⬆️ 対象ページがv1.2の4ページから8ページに倍増 |
| 14 | 共通コンポーネントのブランド動的化（**Header / DashboardHeader / Footer / 4つのPreview / YouTubeGuideCard / TrialBanner**） | **3〜4時間** | 🆕 調査で発見 |
| 15 | デフォルトカラー `#3B82F6` の定数化（**API routes + コンポーネント20+箇所**） | **3〜4時間** | 🆕 調査で発見 |
| 16 | レイアウトメタデータの動的化（jikogene / qr / qrcode） | 1時間 | 🆕 調査で発見 |
| 17 | `.env.example.buyout` の作成 | 1時間 | 変更なし |
| 18 | **既存ユーザーへの影響リグレッションテスト** | **4〜6時間** | ⬆️ 対象範囲拡大に伴い増加 |

### フェーズ2: 初号パートナーの立ち上げ（3〜5営業日）

| # | タスク | 所要時間 |
|---|--------|----------|
| 1 | パートナー情報ヒアリング | 1日 |
| 2 | Supabase作成 + マイグレーション | 1時間 |
| 3 | Vercelプロジェクト作成 + 環境変数設定 | 1時間 |
| 4 | DNS設定依頼 + 検証待ち | 1〜2日 |
| 5 | Resendドメイン追加 + DNS検証 | 1日 |
| 6 | Google OAuth リダイレクト追加 | 30分 |
| 7 | reCAPTCHA ドメイン追加 | 15分 |
| 8 | 動作確認（チェックリスト全項目） + 引き渡し | 半日 |

### フェーズ3: 運用自動化（随時）

| # | タスク | 優先度 |
|---|--------|--------|
| 1 | プロビジョニングスクリプト | 高（2社目以降で効果大） |
| 2 | 全環境マイグレーション GitHub Actions | 高（セクション6-2参照） |
| 3 | パートナー環境の監視ダッシュボード | 中 |
| 4 | 月次レポート自動生成 | 低 |

---

## 11. 月額型との共通実装

以下のファイルは月額型・買取型の両方で使用する:

| ファイル | 月額型での利用 | 買取型での利用 |
|----------|---------------|---------------|
| `lib/brand/config.ts` | Partnerモデルからブランド取得 | 環境変数からブランド取得 |
| `lib/features.ts` | 全機能ON | 一部機能OFF |
| メールテンプレート（ブランド動的化） | Partnerのブランドで送信 | 環境変数のブランドで送信 |
| OGP/メタデータ | Partner.brandNameを使用 | BRAND_NAMEを使用 |

→ **ブランド解決の抽象化**が重要。取得元（DB or 環境変数）に関わらず、
  同一の `BrandConfig` インターフェースで扱うことで、共通コードを最大化する。

> **実装順序の推奨:** 以下の共通タスクは買取型・月額型のどちらを先に実装しても、もう一方で再利用できる。
> **重複作業を避けるため、どちらかのプランが先に着手された時点で共通部分を実装し、後からのプランでは差分のみ対応する。**
> - `lib/brand/config.ts` / `lib/brand/resolve.ts`
> - `lib/auth/constants.ts`（admin判定ハードコード5箇所の共通化）
> - `lib/features.ts`
> - メールテンプレートのブランド動的化（10テンプレート以上）
> - CSPヘッダーの環境変数化
> - PWA manifest の Route Handler 化
> - 法的/サポートページのブランド動的化
> - `app/layout.tsx` のメタタグ動的化

```typescript
// lib/brand/resolve.ts

import { getBrandConfig } from './config';

// 買取型: 環境変数から取得（サーバー起動時に確定）
// 月額型: リクエストごとにDBから取得（パートナードメインで判定）
export async function resolveBrand(partnerId?: string): Promise<BrandConfig> {
  const envBrand = getBrandConfig();

  // 買取型はすべて環境変数から
  if (envBrand.isBuyout) {
    return envBrand;
  }

  // 月額型でパートナーIDがある場合はDBから
  if (partnerId) {
    const partner = await prisma.partner.findUnique({ where: { id: partnerId } });
    if (partner) {
      return {
        name: partner.brandName,
        logoUrl: partner.logoUrl || envBrand.logoUrl,
        primaryColor: partner.primaryColor,
        // ...
        isBuyout: false,
      };
    }
  }

  // デフォルト（Share本体）
  return envBrand;
}
```

---

## 12. リスクと対策

| # | リスク | 影響度 | 対策 |
|---|--------|--------|------|
| 1 | mainブランチの変更が全パートナーに即反映 | 高 | ステージング環境でのテスト必須。破壊的変更はリリースノートで事前通知 |
| 2 | DBマイグレーションの適用漏れ | 高 | マイグレーションスクリプトで全環境を一括処理。CI/CDに組み込み |
| 3 | パートナー環境の増加に伴う管理負荷 | 中 | プロビジョニング・監視の自動化で対応 |
| 4 | 環境変数の設定ミス | 中 | `.env.example.buyout` のバリデーションスクリプト作成 |
| 5 | パートナーのSupabase容量超過 | 低 | 監視アラートの設定。Supabase Proの上限内で通常は十分 |
| 6 | ソースコード流出リスク | 低 | パートナーにはGitHubアクセス権を付与しない |
| 7 | デプロイとDBマイグレーションのタイミング不整合 | 高 | GitHub Actionsで `prisma/migrations/` 変更検知時に自動マイグレーション実行（セクション6-2参照）。マイグレーション完了前にデプロイされないよう、Vercelの Auto Deploy を一時停止する運用も検討 |
| 8 | CSPヘッダーの設定漏れ | 中 | 環境変数 `NEXT_PUBLIC_APP_URL` 未設定時にCSP違反が発生。`.env.example.buyout` のバリデーションで検出 |
| 9 | Google OAuthリダイレクトURIの管理 | 低 | パートナーごとにGCPコンソールで手動追加。10社超の場合は独自OAuth Proxyの導入を検討 |
| 10 | admin判定ハードコードの分散 | **高** | `admin@sns-share.com` が**24箇所以上、20+ファイル**に分散（v1.2の5箇所から大幅増）。`lib/auth/constants.ts` に `isSuperAdmin()` / `isFinancialAdmin()` ヘルパーを集約し、全箇所から共通参照。1箇所でも変更漏れがあるとセキュリティリスク |
| 11 | 法的ページのハードコード残存 | 中 | 会社概要・お問い合わせ・特商法・プライバシーポリシーの4ページにメールアドレスがハードコード。`getBrandConfig()` を適用し、チェックリストで確認 |

---

## 13. パートナーが準備するもの

### 13-1. 契約時に必要なもの

| # | 項目 | 詳細 | 形式 | 必須 |
|---|------|------|------|------|
| 1 | **会社名** | 正式法人名（フッター・メール・契約書に使用） | テキスト | 必須 |
| 2 | **会社住所** | フッター・特定商取引法表示に使用 | テキスト | 必須 |
| 3 | **サービスブランド名** | エンドユーザーに見せるサービス名（例:「デジカード」） | テキスト | 必須 |
| 4 | **ロゴ画像** | ヘッダー・メール・ログイン画面に表示。横長推奨、背景透過 | PNG or SVG、幅800px以上 | 必須 |
| 5 | **ファビコン** | ブラウザタブに表示されるアイコン | PNG 32×32px 以上 or ICO | 必須 |
| 6 | **ブランドカラー（メイン）** | ヘッダー・ボタン・メールテンプレートに使用 | HEXカラーコード（例: #1B2A4A） | 必須 |
| 7 | **ブランドカラー（サブ）** | アクセント部分に使用 | HEXカラーコード | 任意 |
| 8 | **管理者メールアドレス** | 最初のadminアカウントに使用 | メールアドレス | 必須 |
| 9 | **サポート用メールアドレス** | エンドユーザーからの問い合わせ先。メールフッターにも表示 | メールアドレス | 必須 |
| 10 | **独自ドメイン** | サービス公開URL（例: card.example.co.jp） | ドメイン名 | 必須 |
| 11 | **プライバシーポリシーURL** | フッターリンク用。パートナー側で用意 | URL | 必須 |
| 12 | **利用規約URL** | フッターリンク用。パートナー側で用意 | URL | 必須 |
| 13 | **NFCシール運用方針** | (A) Share代行 / (B) 自社仕入れ / (C) 無効化 | 選択 | 必須 |
| 14 | **Stripe課金の有無** | エンドユーザーへのアプリ内課金を使うか | Yes/No | 必須 |

※ 月額型と比べて、**会社住所・プライバシーポリシー・利用規約**が追加で必要（買取型はパートナーが完全に独立運営するため）

### 13-2. ドメイン設定時にパートナーが行う作業

| # | 作業 | 手順 | 所要時間 |
|---|------|------|----------|
| 1 | **CNAMEレコード追加** | ドメイン管理画面で `card.example.co.jp` → `cname.vercel-dns.com` を設定 | 5分（反映まで最大48時間） |
| 2 | **メール用DNSレコード追加** | SPFレコード・DKIMレコードの追加（Resendから指示された値） | 10分（反映まで最大48時間） |

※ DNS設定の具体的な手順書はShare側から提供する

### 13-3. Stripe課金を使う場合にパートナーが行うこと

| # | 作業 | 説明 |
|---|------|------|
| 1 | Stripeアカウント開設 | https://stripe.com でビジネスアカウントを作成 |
| 2 | 本人確認・事業者確認 | Stripeの審査を完了する |
| 3 | APIキーの共有 | Publishable Key / Secret Key をShareに共有（環境変数に設定） |
| 4 | 商品・価格の作成 | Stripeダッシュボードでプラン（月額/年額等）を作成 |
| 5 | Price IDの共有 | 作成した価格のIDをShareに共有（環境変数に設定） |

### 13-4. 運用開始後にパートナーが行うこと

| 作業 | 説明 |
|------|------|
| テナント（顧客企業）の作成 | 管理画面から顧客企業を登録 |
| テナント管理者の招待 | 顧客企業の担当者にメール招待を送信 |
| エンドユーザーへの案内 | 自社ブランドとして営業・サポート |
| インフラ費用の支払い | Supabase Pro ($25/月) + Vercel Pro ($20/月) を直接支払い |
| 月額保守費の支払い | Share宛に ¥10,000/月 |

### 13-5. 月額型との比較（パートナーの準備負荷）

| 項目 | 月額型 | 買取型 |
|------|--------|--------|
| ブランド素材（ロゴ・色等） | 必要 | 必要 |
| 独自ドメイン | 必要 | 必要 |
| DNS設定（CNAME） | 必要 | 必要 |
| DNS設定（メール用SPF/DKIM） | 任意 | **必須** |
| プライバシーポリシー・利用規約 | 不要（Share共用） | **必要（自社で用意）** |
| 会社住所 | 不要 | **必要** |
| Stripeアカウント | 不要 | 任意（課金する場合） |
| インフラ費用の直接支払い | 不要（Share側に含む） | **必要（Supabase + Vercel）** |
| 初期費用 | なし | **¥600,000** |

---

## 14. 動作確認チェックリスト

パートナー環境の立ち上げ完了時に、Share側が実施する確認項目:

| # | 確認項目 | 確認方法 | 合格基準 |
|---|---------|----------|----------|
| 1 | ドメインアクセス | `https://card.example.co.jp` をブラウザで開く | SSL証明書が有効、ページが表示される |
| 2 | ログインページ | `/login` にアクセス | パートナーロゴ・ブランド名が表示される |
| 3 | Googleログイン | Google OAuthでログイン | リダイレクト先がパートナードメイン、正常にログイン完了 |
| 4 | メールアドレスログイン | メール+パスワードでログイン | reCAPTCHA動作、正常にログイン完了 |
| 5 | ダッシュボード | ログイン後のリダイレクト先 | `/dashboard/corporate` が表示される（Super Adminではない） |
| 6 | Super Admin ブロック | URLで `/dashboard/admin` に直接アクセス | アクセスできずリダイレクトされる |
| 7 | 財務管理ブロック | URLで `/dashboard/admin/financial` に直接アクセス | アクセスできずリダイレクトされる |
| 8 | パートナー募集LPブロック | URLで `/partner` にアクセス | 404 or リダイレクト |
| 9 | トップページ | `/` にアクセス | `/login` にリダイレクト（ShareのLPが表示されない） |
| 10 | プロフィールページ（ブランド） | テスト用プロフィール `/{slug}` にアクセス | パートナーロゴ・カラーが表示される |
| 11 | OGPメタデータ | プロフィールページのog:titleを確認 | `{ユーザー名} \| {パートナーブランド名}` になっている |
| 12 | ファビコン | ブラウザタブを確認 | パートナーのファビコンが表示される |
| 13 | 「Share」の文字 | プロフィールページ・ログイン画面・ダッシュボードをテキスト検索 | 「Share」の文字がどこにも表示されない |
| 14 | メール通知（招待） | テストユーザーを招待 | 差出人名・ヘッダーロゴ・フッター会社名がパートナーブランド |
| 15 | メール通知（認証） | メールアドレス認証メールを送信 | 同上 |
| 16 | テナント作成 | 管理画面からテナントを1つ作成 | 正常に作成される |
| 17 | ユーザー招待 | テナントにメンバーを招待 | 招待メールがパートナーブランドで届く |
| 18 | NFCシール注文（該当時） | NFCシール注文フローを実行 | 注文が正常に処理される（or 機能が無効化されている） |
| 19 | Stripe課金（該当時） | テスト決済を実行 | パートナーのStripeアカウントに入金される |
| 20 | DB接続確認 | Supabase管理画面でテーブル確認 | パートナー専用DBにデータが正しく保存されている |
| 21 | CSPエラー | ブラウザ DevTools → Console でCSP違反がないか確認 | CSP関連のエラーが表示されない |
| 22 | PWA manifest | ブラウザ DevTools → Application → Manifest を確認 | パートナーブランド名・テーマカラーが反映されている |
| 23 | メールテンプレート内の文字確認 | 全種類のメール（招待・認証・通知・解約・トライアル終了・経費承認等、**全10種以上**）の本文を目視確認 | `Share`・`sns-share.com`・`株式会社Senrigan`・広島の住所が一切表示されない |
| 24 | 会社概要ページ | `/company/about` にアクセス | パートナーの会社情報が表示される。`info@sns-share.com` が表示されない |
| 25 | お問い合わせページ | `/support/contact` にアクセス | パートナーのサポートメールが表示される。`support@sns-share.com` が表示されない |
| 26 | 特定商取引法ページ | `/legal/transactions` にアクセス | パートナーの情報が表示される。`info@sns-share.com` が表示されない |
| 27 | プライバシーポリシーページ | `/legal/privacy` にアクセス | パートナーの情報が表示される。`privacy@sns-share.com` が表示されない |
| 28 | `apple-mobile-web-app-title` | ブラウザ DevTools → Elements → head 内を確認 | パートナーブランド名が設定されている（`Share` ではない） |

---

## 15. パートナーへの引き渡し物

| # | 引き渡し物 | 形式 | 説明 |
|---|-----------|------|------|
| 1 | **管理者アカウント** | メール | 初期パスワード or Googleログイン手順 |
| 2 | **操作マニュアル** | PDF or オンライン | テナント作成・ユーザー招待・ブランド設定の手順 |
| 3 | **営業ツール一式** | PDF | 提案書テンプレート・営業トーク台本（パートナーブランド名差し替え済み） |
| 4 | **デモ用アカウント** | メール | 営業時にエンドユーザーに見せるデモプロフィール（パートナードメインで動作） |
| 5 | **NFCシールサンプル** | 郵送 | 営業デモ用のNFCシール数枚 |
| 6 | **DNS設定手順書** | PDF or メール | ドメイン設定の具体的な手順（スクリーンショット付き） |
| 7 | **サポート連絡先** | メール | Share技術サポートの問い合わせ先・対応時間 |
| 8 | **インフラ費用の契約ガイド** | PDF | Supabase Pro / Vercel Pro の契約手順（直接契約の場合） |
| 9 | **緊急連絡先** | メール | システム障害時の緊急連絡先 |

---

## 16. 未決事項・検討課題

| # | 課題 | 選択肢 | 推奨 |
|---|------|--------|------|
| 1 | Vercelプロジェクトの管理主体 | (a) Share側のVercelアカウント (b) パートナーのVercelアカウント | **(a)** Share側で一元管理。パートナーにはVercel操作権限を渡さない |
| 2 | Supabaseの管理主体 | (a) Share側のorganization (b) パートナーのorganization | **(a)** Share側で一元管理 |
| 3 | パートナー独自LPの対応 | (a) 対応しない (b) app/page.tsx を差し替え可能にする | **(a)** 初期は /login にリダイレクト。独自LP希望は別途見積 |
| 4 | Google OAuthの管理 | (a) Share共用 (b) パートナー独自 | **(a)** Share側のGCPプロジェクトにドメイン追加 |
| 5 | 解約時のデータ扱い | (a) Supabase削除 (b) データエクスポート後削除 | **(b)** CSVエクスポート提供後、一定期間で削除 |
| 6 | Vercel Pro費用の請求方法 | (a) パートナーが直接契約 (b) Share側が立て替え | **(a)** パートナーが直接Vercel/Supabaseと契約が理想だが、管理上は(b)も検討 |
| 7 | DBマイグレーションのCI/CD自動化 | (a) GitHub Actionsで自動実行 (b) 手動スクリプトのまま | **(a)** を推奨。`prisma/migrations/` 変更検知でトリガー（セクション6-2参照） |
| 8 | 既存ユーザーへの影響テスト | (a) 手動テスト (b) E2Eテスト自動化 | **(a)** で開始。ブランド分岐導入後に主要フロー（ログイン・プロフィール表示・メール送信）のE2Eを追加 |
| 9 | Vercel Auto Deploy の制御 | (a) 常時有効 (b) マイグレーション時は一時停止 | **(b)** マイグレーションを伴うPRマージ時は Auto Deploy を一時停止し、GitHub Actions でマイグレーション完了後に再開する運用を標準とする（セクション6-2参照） |
