# ホワイトラベル（月額型）本番デプロイチェックリスト

## 動作確認チェックリスト（22項目）

### 認証・ロール

- [ ] Super Admin でログインし `/dashboard/admin` に遷移すること
- [ ] partner-admin でログインし `/dashboard/partner` に遷移すること
- [ ] partner-admin が `/dashboard/admin` にアクセスできないこと
- [ ] financial-admin が許可パス以外にアクセスできないこと
- [ ] 法人管理者（admin）が `/dashboard/corporate` に遷移すること
- [ ] 法人メンバー（member）が `/dashboard/corporate-member` に遷移すること
- [ ] 個人ユーザーが admin/corporate にアクセスできないこと

### パートナー管理（Super Admin）

- [ ] パートナー一覧が表示されること
- [ ] パートナーの新規作成ができること（スラッグ重複チェック含む）
- [ ] パートナーのブランディング設定（ロゴ・カラー・ファビコン）が反映されること
- [ ] カスタムドメインの登録・DNS検証が動作すること

### パートナーダッシュボード

- [ ] パートナー管理者がダッシュボード統計を確認できること
- [ ] テナント一覧の表示・新規作成ができること
- [ ] アカウント上限チェックが正しく動作すること（warning/critical 表示）
- [ ] ブランディング設定の取得・更新ができること

### ブランド分離

- [ ] カスタムドメインアクセスで `x-partner-id` ヘッダーがセットされること
- [ ] プロフィールページがパートナーブランドで表示されること（ロゴ・カラー・社名）
- [ ] メール送信時にパートナーブランドの差出人名・カラー・サポートメールが使用されること

### Stripe 課金

- [ ] パートナー月額サブスクリプションの作成が動作すること
- [ ] プラン変更（アップグレード/ダウングレード）が反映されること

### セキュリティ

- [ ] CSP ヘッダーにカスタムドメインが許可されていること
- [ ] PARTNER_DOMAIN_MAP に存在しないドメインでアクセスした場合、デフォルトブランドになること

---

## 運用手順書

### 1. パートナー追加手順

1. **Super Admin 画面でパートナー作成**
   - `/dashboard/admin/partners` → 新規作成
   - 必須: パートナー名、ブランド名、スラッグ、管理者メールアドレス、プラン

2. **ブランディング設定**
   - ロゴ画像をアップロード（推奨: SVG or PNG、幅200px程度）
   - ファビコン画像をアップロード（ICO or PNG、32x32px）
   - プライマリカラー・セカンダリカラーを設定
   - 会社名・住所・サポートメールを設定

3. **カスタムドメイン設定**
   - `/dashboard/admin/partners` → ドメイン設定
   - Vercel API トークンが設定済みの場合、自動でVercelにドメイン追加
   - 未設定の場合、Vercelダッシュボードから手動で追加

4. **DNS設定依頼**
   - パートナーに以下のDNSレコード設定を依頼:
     ```
     タイプ: CNAME
     名前: <カスタムドメイン>
     値: cname.vercel-dns.com
     ```
   - 反映まで最大48時間

5. **環境変数の更新**
   - `PARTNER_DOMAIN_MAP` にドメインとpartnerIDのマッピングを追加
     ```json
     {"card.example.co.jp":"partner_id_xxx"}
     ```
   - `CSP_ALLOWED_DOMAINS` にカスタムドメインを追加（カンマ区切り）

6. **Vercel 再デプロイ**
   - 環境変数更新後、Vercelで再デプロイを実行

7. **外部サービスの設定**
   - **Google reCAPTCHA**: カスタムドメインを許可ドメインに追加
   - **Google OAuth**: カスタムドメインのリダイレクトURIを追加
     - `https://<カスタムドメイン>/api/auth/callback/google`
   - **Resend**: パートナー独自ドメインからメール送信する場合、Resendでドメイン認証

### 2. パートナー停止手順

1. **DB更新**
   - `Partner.accountStatus` を `suspended` に変更
   - SQL: `UPDATE "Partner" SET "accountStatus" = 'suspended' WHERE id = 'xxx';`

2. **Stripe サブスクリプション停止**
   - Stripeダッシュボードでサブスクリプションをキャンセル
   - または API: `stripe.subscriptions.cancel(subscriptionId)`

3. **カスタムドメインの扱い**
   - 即時削除: Vercelからドメインを削除、`PARTNER_DOMAIN_MAP` から削除
   - 猶予期間: 30日間はドメインを維持し、猶予期間後に削除
   - パートナーへの通知メールを送信

4. **環境変数の更新・再デプロイ**
   - `PARTNER_DOMAIN_MAP` から該当ドメインを削除
   - Vercel再デプロイ

### 3. プラン変更手順

1. **DB更新**
   ```sql
   UPDATE "Partner"
   SET "plan" = 'pro', "maxAccounts" = 600
   WHERE id = 'xxx';
   ```
   - プラン別上限: basic=300, pro=600, premium=1000

2. **Stripe サブスクリプション変更**
   - Stripeダッシュボードでサブスクリプションの料金プランを変更
   - プロレーション（日割り）設定を確認

### 4. トラブルシューティング

#### カスタムドメインでアクセスできない

1. DNS設定の確認
   ```bash
   dig CNAME <カスタムドメイン>
   # cname.vercel-dns.com が返ることを確認
   ```

2. Vercelでのドメイン設定確認
   - Vercelダッシュボード → プロジェクト → Settings → Domains
   - ドメインが追加されていることを確認
   - SSL証明書のステータスが `Valid` であることを確認

3. `PARTNER_DOMAIN_MAP` の確認
   - 環境変数にドメインとpartnerIDのマッピングが正しく設定されているか
   - JSONフォーマットが正しいか

4. 再デプロイの確認
   - 環境変数更新後に再デプロイが完了しているか

#### CSPエラーが出る場合

1. ブラウザのコンソールでCSPエラーの詳細を確認
2. `CSP_ALLOWED_DOMAINS` にカスタムドメインが含まれているか確認
3. 画像・フォントなど外部リソースのドメインも許可が必要

#### メールが届かない場合

1. Resend ダッシュボードで送信ログを確認
2. パートナー独自ドメインの場合:
   - Resendでドメイン認証が完了しているか確認
   - SPF / DKIM / DMARC レコードが正しく設定されているか確認
3. デフォルトドメイン（sns-share.com）からの送信の場合:
   - `FROM_EMAIL` が Resend で認証済みドメインのアドレスか確認
4. 迷惑メールフォルダの確認
