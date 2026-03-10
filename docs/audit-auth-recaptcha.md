# 認証基盤・reCAPTCHA 調査レポート

調査日: 2026-03-10

---

## 調査1: 認証基盤の特定

### 認証フレームワーク: NextAuth.js v5 (beta.27) のみ

- Supabase Auth は**使用していない**
- DBアダプター: `@auth/prisma-adapter` (Prisma + PostgreSQL)
- セッション戦略: **JWT**（有効期限4時間）

### 主要ファイル構成

| ファイル | 役割 |
|---------|------|
| `auth.config.ts` | プロバイダー設定（Google OAuth + Credentials） |
| `auth.ts` | コールバック、セッション管理、ロール判定 |
| `middleware.ts` | ルート保護、ロールベースアクセス制御 |
| `app/api/auth/[...nextauth]/route.ts` | NextAuthルートハンドラー |

### Google OAuthプロバイダー設定

- 設定箇所: `auth.config.ts:57-69`
- `process.env.GOOGLE_CLIENT_ID` / `process.env.GOOGLE_CLIENT_SECRET` を参照
- スコープ: `openid email profile`
- `allowDangerousEmailAccountLinking: false`

### パスワードログインフロー

設定箇所: `auth.config.ts:70-146`

1. Zodスキーマでメール・パスワードバリデーション
2. reCAPTCHA v3トークン検証（`verifyRecaptchaV3()`）
3. Prismaでメールからユーザー検索
4. bcryptjsでパスワード照合
5. JWTトークン発行

---

## 調査2: 買取型での認証に必要な環境変数

### `NEXTAUTH_SECRET`（3箇所）

| ファイル | 行 | 用途 |
|---------|-----|------|
| `middleware.ts` | 20 | トークン検証 |
| `middleware/emailVerificationHandler.ts` | 23 | メール認証チェック |
| `app/api/user/check-email-verification/route.ts` | 23 | メール認証状態確認 |

### `NEXTAUTH_URL`（10箇所）

| ファイル | 行 | 用途 |
|---------|-----|------|
| `lib/email/index.ts` | 168 | 経費承認URL生成 |
| `lib/email/templates/partner-inquiry.ts` | 24 | サイトURL |
| `app/api/one-tap-seal/create-checkout-session/route.ts` | 103-104 | Stripe成功/キャンセルURL |
| `app/api/subscription/create/route.ts` | 276-277, 605-606 | Stripe成功/キャンセルURL |
| `app/api/admin/one-tap-seal/orders/[id]/route.ts` | 88 | ベースURL |
| `app/api/corporate/users/invite/route.ts` | 109 | 招待メールURL |
| `app/api/corporate/users/[id]/resend-invite/route.ts` | 61 | 招待再送URL |
| `app/api/corporate/users/[id]/route.ts` | 304 | ユーザー管理URL |

### `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`（1箇所）

- `auth.config.ts:58-59`

### reCAPTCHA関連

| 変数 | ファイル | 行 |
|-----|---------|-----|
| `RECAPTCHA_SECRET_KEY` | `auth.config.ts` | 22 |
| `RECAPTCHA_SECRET_KEY` | `app/api/auth/signin/route.ts` | 12 |
| `RECAPTCHA_SECRET_KEY` | `app/api/auth/register/route.ts` | 21 |

> **注意:** `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` はコード中で一切参照されていない。
> `RecaptchaWrapper.tsx` がダミートークン（`'bypass-token-pat-issue'`）を返すバイパス実装になっており、
> サーバー側もバイパストークンを検出すると検証をスキップする。reCAPTCHAは事実上無効。

---

## 調査3: 買取型パートナー環境での外部サービス設定

### Google OAuth

**結論: Share側GCPプロジェクトにリダイレクトURI追加だけでは不十分**

- リダイレクトURIに `https://パートナードメイン/api/auth/callback/google` を追加する → **技術的には動作する**
- ただしGCPのOAuth同意画面に表示されるアプリ名が「Share」のままになる

| 案 | 内容 | メリット | デメリット |
|---|------|---------|-----------|
| A（簡易） | Share側GCPにパートナードメインのリダイレクトURIを追加 | 設定が簡単 | 同意画面にShareのアプリ名が表示される |
| B（推奨） | パートナーが自前GCPプロジェクトを作成しOAuth認証情報を発行 | 同意画面にパートナーのアプリ名が表示される | パートナー側でGCP設定が必要 |

### reCAPTCHA

**結論: 現在バイパス中のため即座の対応は不要。有効化する場合はドメイン追加が必要**

- reCAPTCHA v3はサイトキーにドメインが紐づく
- Google reCAPTCHA管理画面でパートナードメインを追加登録すれば**同じサイトキーで動作可能**
- ただし統計がShare + 全パートナーで混在する
- **推奨:** パートナーごとに別のサイトキー/シークレットキーを発行し環境変数に設定する

---

## 買取型パートナー環境で必要な環境変数まとめ

```env
# 必須 - パートナーごとに固有
NEXTAUTH_URL=https://パートナードメイン
NEXTAUTH_SECRET=<パートナー固有のランダム値>

# Google OAuth（案B: パートナー自前GCPプロジェクト）
GOOGLE_CLIENT_ID=<パートナーのGCP Client ID>
GOOGLE_CLIENT_SECRET=<パートナーのGCP Client Secret>

# reCAPTCHA（有効化する場合）
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=<パートナー用サイトキー>
RECAPTCHA_SECRET_KEY=<パートナー用シークレットキー>
```

---

## 注意事項

1. **`NEXTAUTH_SECRET` はパートナーごとに必ず別値にする** — 同じ値だとJWTが環境間で有効になりセキュリティリスク
2. **`NEXTAUTH_URL` は多数のAPIルートでURL生成に使われている**（Stripe決済URL、招待メール等）ので、正しいパートナードメインの設定が必須
3. **reCAPTCHAバイパスの解消**を先に行うかどうかは別途判断が必要。買取型リリースまでにバイパスを外すなら、`RecaptchaWrapper.tsx` を正規実装に戻し、`NEXT_PUBLIC_RECAPTCHA_SITE_KEY` の参照を復活させる必要がある
