# パートナー新規追加 デプロイ手順書

**目的:** 月額型ホワイトラベルパートナーを新規追加する際の全作業手順
**対象:** Share側エンジニア / インフラ担当
**前提:** パートナーとの契約が完了し、以下の情報を受領済みであること

- パートナー企業名・ブランド名
- カスタムドメイン（例: `card.example.co.jp`）
- ロゴ画像（SVG推奨）
- ブランドカラー（primaryColor）
- プラン（basic / pro / premium）
- 管理者メールアドレス

---

## 1. Partner レコードの作成

### 方法A: Super Admin 管理画面（推奨）

1. Super Admin でログイン → `/dashboard/admin/partners`
2. 「パートナー追加」をクリック
3. 必要情報を入力:
   - 企業名、ブランド名、slug
   - ロゴURL、ブランドカラー
   - プラン、アカウント上限
   - 管理者メールアドレス
4. 保存 → Partner ID を控える

### 方法B: Prisma Studio / DB直接

```sql
INSERT INTO "Partner" (id, name, slug, "brandName", "logoUrl", "primaryColor", plan, "maxAccounts", "accountStatus")
VALUES (cuid(), 'パートナー企業名', 'partner-slug', 'ブランド名', '/logos/partner.svg', '#3B82F6', 'basic', 300, 'active');
```

- [ ] Partner レコード作成完了
- [ ] Partner ID を控えた

---

## 2. Vercel カスタムドメイン追加

1. [Vercel Dashboard](https://vercel.com) → プロジェクト → Settings → Domains
2. パートナーのカスタムドメインを追加（例: `card.example.co.jp`）
3. Vercel が表示する DNS レコード情報を控える

- [ ] Vercel にカスタムドメインを追加

---

## 3. DNS 設定（パートナー側の作業）

パートナーに以下の DNS レコード設定を依頼:

| タイプ | ホスト名 | 値 |
|--------|----------|-----|
| CNAME | `card` (サブドメイン部分) | `cname.vercel-dns.com` |

**注意:**
- ルートドメイン（`example.co.jp` そのもの）を使用する場合は A レコードを設定: `76.76.21.21`
- DNS 反映には最大 48 時間かかる場合がある

- [ ] パートナーに DNS 設定を依頼
- [ ] DNS 反映を確認（`dig card.example.co.jp` で CNAME を確認）

---

## 4. SSL 証明書の確認

Vercel は DNS 設定完了後、自動的に Let's Encrypt の SSL 証明書を発行する。

1. Vercel Dashboard → Domains でステータスが「Valid Configuration」になっていることを確認
2. `https://card.example.co.jp` にブラウザでアクセスし、証明書が有効であることを確認

- [ ] SSL 証明書が自動発行された
- [ ] HTTPS でアクセス可能

---

## 5. 環境変数 `PARTNER_DOMAIN_MAP` の更新

Vercel Dashboard → Settings → Environment Variables で `PARTNER_DOMAIN_MAP` を更新。

**現在の値に新しいパートナーを追加:**

```json
{
  "existing-domain.example.com": "existing_partner_id",
  "card.example.co.jp": "新しいPartner ID"
}
```

**注意:**
- JSON 形式で、ドメイン名（ポート番号なし）をキー、Partner ID を値にする
- Production / Preview / Development の全環境に設定
- 更新後、再デプロイが必要（Vercel Dashboard → Deployments → Redeploy）

- [ ] `PARTNER_DOMAIN_MAP` を更新
- [ ] 再デプロイを実行

---

## 6. Google reCAPTCHA ドメイン追加

**前提:** reCAPTCHA が有効化されている場合のみ（現在はバイパス中のためスキップ可）

1. [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin) にアクセス
2. 該当サイトの設定を開く
3. 「ドメイン」セクションにパートナードメインを追加: `card.example.co.jp`
4. 保存

**補足:**
- reCAPTCHA v3 のサイトキーは全ドメインで共通（環境変数 `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`）
- サーバーサイドの検証キー（`RECAPTCHA_SECRET_KEY`）はドメインに依存しない
- CSP は `next.config.mjs` で `www.google.com`, `www.gstatic.com`, `www.recaptcha.net` を既に許可済み
- パートナードメインの CSP 追加が必要な場合は `CSP_ALLOWED_DOMAINS` 環境変数にスペース区切りで追加

- [ ] reCAPTCHA Admin Console にドメイン追加（reCAPTCHA有効時のみ）

---

## 7. Google Cloud Console OAuth リダイレクト URI 追加

1. [Google Cloud Console](https://console.cloud.google.com) → API とサービス → 認証情報
2. OAuth 2.0 クライアント ID を選択
3. 「承認済みのリダイレクト URI」に以下を追加:
   - `https://card.example.co.jp/api/auth/callback/google`
4. 「承認済みの JavaScript 生成元」に以下を追加:
   - `https://card.example.co.jp`
5. 保存

**補足:**
- NextAuth v5 は `trustHost: true` 設定により、リクエストの Host ヘッダーから自動的に正しいコールバック URL を生成する
- OAuth のクライアント ID / シークレットは全ドメインで共通（環境変数 `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`）
- Google Cloud Console 側の URI 追加を忘れると「redirect_uri_mismatch」エラーになる

- [ ] 承認済みリダイレクト URI を追加
- [ ] 承認済み JavaScript 生成元を追加

---

## 8. 動作確認チェックリスト

最低限以下を確認。詳細は `docs/partner-checklist.md` を参照。

| # | 確認項目 | 確認方法 | 合格基準 |
|---|---------|----------|----------|
| 1 | ドメインアクセス | `https://{ドメイン}` を開く | SSL有効、ページ表示される |
| 2 | ログインページブランド | `/auth/signin` にアクセス | パートナーロゴ・ブランド名が表示 |
| 3 | メールログイン | メール+パスワードでログイン | 正常にログイン完了 |
| 4 | Google OAuth ログイン | Google でログイン | コールバックが正しいドメイン、ログイン完了 |
| 5 | セッション Cookie | DevTools → Application → Cookies | ドメインが `card.example.co.jp` |
| 6 | プロフィールページ | `/{slug}` にアクセス | パートナーブランドで表示 |
| 7 | CSP エラーなし | DevTools → Console | CSP 違反エラーなし |
| 8 | PWA manifest | DevTools → Application → Manifest | パートナーブランド名・カラー |

- [ ] 全動作確認項目がパス

---

## 9. パートナー管理者への引き渡し

1. パートナー管理者アカウントを作成（Super Admin 画面 or DB）
2. ログイン情報をパートナーに送付
3. `docs/partner-checklist.md` の全項目チェック実施
4. チェックリストのコピーを `partners/{slug}/checklist.md` に保存

- [ ] 引き渡し完了

---

## トラブルシューティング

### DNS が反映されない
- `dig card.example.co.jp` で CNAME レコードを確認
- TTL が長い場合は最大 48 時間待つ
- パートナーの DNS プロバイダによっては CNAME Flattening が必要な場合がある

### Google OAuth で `redirect_uri_mismatch`
- Google Cloud Console で正確な URI が登録されているか確認（末尾スラッシュの有無に注意）
- 正しい URI: `https://card.example.co.jp/api/auth/callback/google`

### ログインページが Share ブランドで表示される
- `PARTNER_DOMAIN_MAP` に正しいドメインと Partner ID が登録されているか確認
- 再デプロイが実行されたか確認
- Partner レコードの `accountStatus` が `active` であるか確認

### reCAPTCHA エラー（再有効化後）
- Google reCAPTCHA Admin Console にドメインが追加されているか確認
- `CSP_ALLOWED_DOMAINS` にパートナードメインが追加されているか確認
