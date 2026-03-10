# パートナー環境プロビジョニングガイド

**対象:** 買取型ホワイトラベルパートナーの環境構築手順
**前提:** フェーズ1（ブランド動的化基盤）が完了済みであること

---

## 1. 事前準備

### 1-1. パートナーから受領する情報

| # | 項目 | 例 | 必須 |
|---|------|---|------|
| 1 | サービスブランド名 | デジカード | 必須 |
| 2 | 会社名（正式法人名） | 株式会社プリントカンパニー | 必須 |
| 3 | 会社住所 | 〒100-0001 東京都千代田区... | 必須 |
| 4 | ロゴ画像（PNG/SVG、幅800px以上、背景透過） | logo.svg | 必須 |
| 5 | ファビコン（PNG 32×32px以上 or ICO） | favicon.ico | 必須 |
| 6 | ブランドカラー（メイン）HEXコード | #1B2A4A | 必須 |
| 7 | ブランドカラー（サブ）HEXコード | #4A6FA5 | 任意 |
| 8 | 管理者メールアドレス | admin@printcompany.co.jp | 必須 |
| 9 | サポート用メールアドレス | support@printcompany.co.jp | 必須 |
| 10 | 独自ドメイン | card.printcompany.co.jp | 必須 |
| 11 | プライバシーポリシーURL | /legal/privacy（デフォルト） | 必須 |
| 12 | 利用規約URL | /legal/terms（デフォルト） | 必須 |
| 13 | NFCシール運用方針 | (A)Share代行 / (B)自社仕入れ / (C)無効化 | 必須 |
| 14 | Stripe課金の有無 | Yes / No | 必須 |

---

## 2. Supabaseプロジェクト作成

### 2-1. プロジェクト作成

1. [Supabase Dashboard](https://supabase.com/dashboard) にログイン
2. **New Project** をクリック
3. 以下の設定で作成:
   - **Organization:** Share（既存のorganization）
   - **Project name:** `share-{partner-slug}`（例: `share-partner-a`）
   - **Database Password:** 強力なパスワードを生成（保管必須）
   - **Region:** `ap-northeast-1`（Northeast Asia (Tokyo)）
   - **Plan:** Pro（$25/月）

4. プロジェクト作成完了後、**Settings → Database** から接続情報を取得:
   - **Connection string (Transaction):** `DATABASE_URL` として使用（PgBouncer経由、ポート6543）
   - **Connection string (Session):** `DIRECT_URL` として使用（直接接続、ポート5432）

### 2-2. Prismaマイグレーション実行

```bash
# パートナー環境の接続情報を指定してマイグレーション実行
DATABASE_URL="postgresql://postgres.{ref}:{password}@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true" \
DIRECT_URL="postgresql://postgres.{ref}:{password}@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres" \
npx prisma migrate deploy
```

成功すると以下のような出力が表示される:
```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database ...
X migrations found in prisma/migrations
...
All migrations have been successfully applied.
```

### 2-3. Supabase Storage設定

1. **Storage** → **New bucket** で `avatars` バケットを作成（Public）
2. 必要に応じて RLS ポリシーを設定

### 2-4. API Keys取得

**Settings → API** から以下を取得:
- `NEXT_PUBLIC_SUPABASE_URL`: `https://{ref}.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon/public キー
- `SUPABASE_SERVICE_ROLE_KEY`: service_role キー（機密）

---

## 3. Vercelプロジェクト作成

### 3-1. プロジェクト作成

1. [Vercel Dashboard](https://vercel.com/dashboard) にログイン
2. **Add New → Project**
3. 以下の設定:
   - **Import Git Repository:** 既存のShareリポジトリを選択（同一リポジトリ）
   - **Project Name:** `share-{partner-slug}`
   - **Framework Preset:** Next.js
   - **Root Directory:** ./（デフォルト）

### 3-2. 環境変数設定

**Settings → Environment Variables** で以下を設定（`.env.example.buyout` を参照）:

#### デプロイモード
| 変数名 | 値 |
|--------|---|
| `DEPLOYMENT_MODE` | `buyout` |
| `NEXT_PUBLIC_DEPLOYMENT_MODE` | `buyout` |

#### ブランド設定（サーバーサイド）
| 変数名 | 値の例 |
|--------|--------|
| `BRAND_NAME` | パートナーブランド名 |
| `BRAND_LOGO_URL` | `/logo.svg` |
| `BRAND_FAVICON_URL` | `/pwa/favicon.ico` |
| `BRAND_PRIMARY_COLOR` | `"#1B2A4A"`（`#` を含むため要クォート） |
| `BRAND_SECONDARY_COLOR` | （任意） |
| `BRAND_COMPANY_NAME` | パートナー会社名 |
| `BRAND_COMPANY_URL` | `https://printcompany.co.jp` |
| `BRAND_COMPANY_ADDRESS` | 〒100-0001 東京都... |
| `BRAND_SUPPORT_EMAIL` | `support@printcompany.co.jp` |
| `BRAND_PRIVACY_URL` | `/legal/privacy` |
| `BRAND_TERMS_URL` | `/legal/terms` |
| `BRAND_TAGLINE` | パートナーのタグライン |

#### ブランド設定（クライアントサイド）
| 変数名 | 値の例 |
|--------|--------|
| `NEXT_PUBLIC_BRAND_NAME` | パートナーブランド名 |
| `NEXT_PUBLIC_BRAND_TAGLINE` | パートナーのタグライン |
| `NEXT_PUBLIC_BRAND_COMPANY_NAME` | パートナー会社名 |
| `NEXT_PUBLIC_BRAND_COMPANY_ADDRESS` | 〒100-0001 東京都... |
| `NEXT_PUBLIC_BRAND_SUPPORT_EMAIL` | `support@printcompany.co.jp` |
| `NEXT_PUBLIC_BRAND_COMPANY_URL` | `https://printcompany.co.jp` |
| `NEXT_PUBLIC_APP_URL` | `https://card.printcompany.co.jp` |

#### 管理者設定
| 変数名 | 値 | 備考 |
|--------|---|------|
| `SUPER_ADMIN_EMAIL` | （空） | Share管理者を無効化 |
| `ADMIN_EMAIL_DOMAIN` | （空） | 財務管理者を無効化 |

#### 機能フラグ
| 変数名 | 値 |
|--------|---|
| `FEATURE_PARTNER_MODULE` | `false` |
| `FEATURE_SUPER_ADMIN` | `false` |
| `FEATURE_NFC_SEAL_ORDER` | パートナーの選択に応じて `true` or `false` |

#### メール送信（Resend）
| 変数名 | 値の例 |
|--------|--------|
| `FROM_NAME` | パートナーブランド名 |
| `FROM_EMAIL` | `noreply@printcompany.co.jp` |
| `RESEND_API_KEY` | `re_xxxxxxxxxx` |

#### 認証（NextAuth）
| 変数名 | 値の例 |
|--------|--------|
| `NEXTAUTH_URL` | `https://card.printcompany.co.jp` |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` で生成 |

#### データベース（Supabase）
| 変数名 | 値 |
|--------|---|
| `DATABASE_URL` | ステップ2で取得 |
| `DIRECT_URL` | ステップ2で取得 |
| `NEXT_PUBLIC_SUPABASE_URL` | ステップ2で取得 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ステップ2で取得 |
| `SUPABASE_SERVICE_ROLE_KEY` | ステップ2で取得 |

#### Stripe（課金ありの場合）
| 変数名 | 値 |
|--------|---|
| `STRIPE_SECRET_KEY` | パートナーのStripe秘密キー |
| `STRIPE_PUBLISHABLE_KEY` | パートナーのStripe公開キー |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | 同上 |
| `STRIPE_WEBHOOK_SECRET` | Webhookシークレット |
| 各Price ID | パートナーのStripe価格ID |

#### Google OAuth
| 変数名 | 値 |
|--------|---|
| `GOOGLE_CLIENT_ID` | GCPのクライアントID |
| `GOOGLE_CLIENT_SECRET` | GCPのクライアントシークレット |

#### reCAPTCHA
| 変数名 | 値 |
|--------|---|
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | パートナー用サイトキー |
| `RECAPTCHA_SECRET_KEY` | パートナー用シークレットキー |

### 3-3. カスタムドメイン追加

1. **Settings → Domains** → **Add Domain**
2. `card.printcompany.co.jp` を入力
3. Vercelが表示するCNAME設定をパートナーに伝達:
   ```
   Type: CNAME
   Name: card
   Value: cname.vercel-dns.com
   ```
4. パートナーがDNS設定後、Vercel側でSSL証明書が自動発行される（最大48時間）

### 3-4. 初回デプロイ

環境変数設定後、**Deployments** → **Redeploy** で初回デプロイを実行。

---

## 4. Resendドメイン追加・DNS検証

### 4-1. Resendでドメイン追加

1. [Resend Dashboard](https://resend.com/domains) にログイン
2. **Add Domain** → `printcompany.co.jp` を追加
3. 表示されるDNSレコードをパートナーに伝達

### 4-2. パートナーが設定するDNSレコード

| Type | Name | Value | 目的 |
|------|------|-------|------|
| TXT | `_resend` | Resendが表示する値 | ドメイン所有確認 |
| MX | `send` | `feedback-smtp.{region}.amazonses.com` | バウンスメール受信 |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | SPF認証 |
| CNAME | `resend._domainkey` | Resendが表示する値 | DKIM署名 |

### 4-3. 検証

DNS反映後（最大48時間）、Resendダッシュボードでドメインのステータスが **Verified** になることを確認。

---

## 5. Google OAuth設定

### 案A: Share側GCPにリダイレクトURI追加（簡易）

1. [Google Cloud Console](https://console.cloud.google.com/) → Share側プロジェクト
2. **APIs & Services → Credentials** → 既存のOAuth 2.0クライアントを編集
3. **Authorized redirect URIs** に追加:
   ```
   https://card.printcompany.co.jp/api/auth/callback/google
   ```
4. 保存

> 注意: OAuth同意画面のアプリ名は「Share」のまま。パートナーが許容する場合のみ。

### 案B: パートナー独自GCP（推奨）

1. Google Cloud Consoleで**新規プロジェクト作成**: `share-{partner-slug}`
2. **APIs & Services → OAuth consent screen** を設定:
   - アプリ名: パートナーブランド名
   - サポートメール: パートナーのメールアドレス
   - 承認済みドメイン: `printcompany.co.jp`
3. **Credentials → Create Credentials → OAuth 2.0 Client ID**:
   - アプリケーション種類: ウェブアプリケーション
   - 承認済みリダイレクトURI: `https://card.printcompany.co.jp/api/auth/callback/google`
4. 取得した `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` をVercel環境変数に設定

---

## 6. reCAPTCHA設定

> **現状（2026-03）:** reCAPTCHAはバイパス実装中。バイパスを解消するまで本手順は不要。

バイパス解消後の手順:

1. [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin) でv3サイトキーを新規作成
2. ドメインに `card.printcompany.co.jp` を登録
3. サイトキー → `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
4. シークレットキー → `RECAPTCHA_SECRET_KEY`

> パートナーごとに別キーを発行する（統計が混在しないように）。

---

## 7. 初期管理者アカウント作成

### 方法1: アプリから新規登録

1. `https://card.printcompany.co.jp/auth/signup` にアクセス
2. パートナー管理者のメールアドレスで新規登録
3. Supabase管理画面でそのユーザーの `role` を `admin` に変更

### 方法2: Supabase SQLエディタで直接作成

```sql
-- ユーザーが新規登録済みの場合、roleをadminに変更
UPDATE "User"
SET role = 'ADMIN'
WHERE email = 'admin@printcompany.co.jp';
```

---

## 8. 画像アセット配置

### ロゴ

パートナーのロゴファイルは以下のいずれかで配置:

- **環境変数方式（推奨）:** `BRAND_LOGO_URL` にURLを指定。Base64 data URLも可。
- **publicディレクトリ:** `public/logo.svg` を差し替え（全環境に反映されるため非推奨）

### ファビコン

- `BRAND_FAVICON_URL` で指定（デフォルト: `/pwa/favicon.ico`）
- パートナー固有のファビコンが必要な場合はBase64 data URLで指定

> **将来対応:** パートナー数が増えた場合はSupabase Storageに移行予定。

---

## 9. 動作確認

`docs/partner-checklist.md` の全28項目を確認する。

---

## 10. トラブルシューティング

### SSL証明書が発行されない

- DNS CNAMEが正しく設定されているか確認: `dig card.printcompany.co.jp CNAME`
- 反映に最大48時間かかる場合がある
- Vercelダッシュボードの Domains ページでエラーメッセージを確認

### マイグレーションエラー

```bash
# 接続を確認
DATABASE_URL="..." npx prisma db pull
# エラー内容を確認してから再実行
DATABASE_URL="..." DIRECT_URL="..." npx prisma migrate deploy
```

### メールが届かない

- Resendダッシュボードでドメインが **Verified** になっているか確認
- `FROM_EMAIL` のドメインがResendに登録済みか確認
- Resendのログで送信エラーを確認

### Google OAuthでリダイレクトエラー

- Google Cloud ConsoleのリダイレクトURIにパートナードメインが追加されているか確認
- `NEXTAUTH_URL` がパートナードメインと一致しているか確認

### CSPエラー

- ブラウザDevTools → Console でCSP違反を確認
- `NEXT_PUBLIC_APP_URL` がパートナードメインに設定されているか確認
