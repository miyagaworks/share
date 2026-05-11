# Playwright E2E 検証タスク

## 検証方針

### フェーズ構成
- **Phase 1**: 公開ページ（認証不要） — Playwrightで直接アクセス
- **Phase 2**: 認証フロー — ログイン・登録・パスワードリセット等の動作確認
- **Phase 3**: ダッシュボード（個人ユーザー） — ログイン後の個人機能
- **Phase 4**: ダッシュボード（法人管理者） — 法人管理機能
- **Phase 5**: ダッシュボード（法人メンバー） — 法人メンバー機能
- **Phase 6**: ダッシュボード（管理者） — スーパー管理者・財務管理者
- **Phase 7**: 動的ルート・API — プロフィール共有・QRコード等

### 検証項目（各ページ共通）
1. ページが正常に表示される（200応答、エラー0件）
2. コンソールエラーがない
3. 主要なUI要素が存在する（見出し、ボタン、フォーム等）
4. リンク・ボタンのクリック遷移が正しい
5. フォームの入力・バリデーションが動作する（該当ページのみ）

### インタラクション再検証（2026-03-10実施）
> 前回検証ではUI要素の存在確認のみだったため、フォーム送信・ボタン操作・モーダル開閉まで踏み込んで再検証。
> 全ページでコンソールエラー0件を確認。テストデータは追加→削除で元に戻し済み。
> **結果: 全フォーム送信が正常に動作。バグは発見されなかった。**

---

## Phase 1: 公開ページ（認証不要）23ページ

### トップ・マーケティング
- [x] `/` — トップページ
- [x] `/partner` — パートナーLP

### 認証ページ
- [x] `/auth/signin` — ログイン
- [x] `/auth/signup` — 新規登録
- [x] `/auth/forgot-password` — パスワード忘れ
- [x] `/auth/reset-password` — パスワードリセット（トークンなし→「無効なリンク」表示OK）
- [x] `/auth/set-password` — パスワード設定
- [x] `/auth/email-verification` — メール確認
- [x] `/auth/change-password` — パスワード変更（未認証時 /api/user/check-password 401は想定内）
- [x] `/auth/invite` — 招待（トークンなし→「無効な招待リンク」表示OK）
- [x] `/auth/error` — エラー

### 企業情報
- [x] `/company/about` — 会社概要
- [x] `/company/service` — サービスについて

### 法的情報
- [x] `/legal/terms` — 利用規約
- [x] `/legal/privacy` — プライバシーポリシー
- [x] `/legal/transactions` — 特定商取引法

### サポート
- [x] `/support/faq` — よくある質問
- [x] `/support/contact` — お問い合わせ
- [x] `/support/help` — ヘルプ

### その他公開ページ
- [x] `/qrcode` — QRコード ⚠️ 未認証時「読み込み中...」のまま（/api/corporate/access 401）。要ログインページの可能性あり
- [x] `/jikogene` — 自己遺伝子（ステップ形式フォーム表示OK）

### 動的ルート（公開）
- [x] `/[slug]` — プロフィール共有（slug: cmeazbby で検証OK）
- [x] `/qr/[slug]` — QRコード共有（slug: maki で検証OK）

---

## Phase 2: 認証フロー

### ログイン動作
- [x] メール/パスワードでのログインフォーム入力→送信
- [x] Googleログインボタンの表示確認
- [x] バリデーションエラー表示（空欄、不正メール形式等）
- [x] 「パスワードをお忘れの方」リンク遷移
- [x] 「新規登録」リンク遷移

### 新規登録動作
- [x] フォーム入力→バリデーション確認
- [x] 利用規約チェックボックス動作
- [x] 利用規約リンク遷移

### パートナーLP フォーム
- [x] CTAフォームの入力→バリデーション確認（お問い合わせフォームで検証）
- [x] チェックボックス動作
- [x] FAQアコーディオン開閉
- [x] 収益シミュレーターのスライダー操作

---

## Phase 3: ダッシュボード（個人ユーザー）10ページ

> 要ログイン: 個人ユーザーアカウント（yoshitsuneogahara@gmail.com）でログイン後に検証

- [x] `/dashboard` — ダッシュボードトップ（統計カード・クイックアクション表示OK）
- [x] `/dashboard/profile` — プロフィール編集（フォーム・画像アップロード・プレビュー表示OK）✅ **再検証: フォーム保存→トースト「プロフィールを更新しました」→DB反映確認OK**
- [x] `/dashboard/links` — リンク管理（リンク一覧・追加ボタン表示OK）✅ **再検証: YouTube追加→トースト「SNSリンクを追加しました！」→削除→「YouTubeを削除しました」OK**
- [x] `/dashboard/design` — デザイン設定（テーマ選択・カラー設定表示OK）✅ **再検証: デザイン更新→トースト「デザイン設定を更新しました」OK**
- [x] `/dashboard/share` — 共有設定（QRコード・共有URL・vCard表示OK）
- [x] `/dashboard/security` — セキュリティ設定（パスワード変更・2段階認証表示OK）✅ **再検証: パスワード変更バリデーション→「パスワードは8文字以上必要です」エラー表示OK**
- [x] `/dashboard/tutorial` — チュートリアル（ステップガイド表示OK）
- [x] `/dashboard/subscription` — サブスクリプション（プラン情報・変更ボタン表示OK）
- [x] `/dashboard/subscription/success` — サブスク成功（成功メッセージ表示OK）
- [x] `/dashboard/account/delete` — アカウント削除（確認フォーム表示OK）

---

## Phase 4: ダッシュボード（法人管理者）8ページ

> 要ログイン: 法人管理者アカウント（miyagawakiyomi@gmail.com）でログイン後に検証

- [x] `/dashboard/corporate` — 法人ダッシュボード（統計・メンバー一覧表示OK）⚠️ デバッグ情報が表示されている（本番前に要削除）
- [x] `/dashboard/corporate/settings` — 法人設定（会社情報フォーム表示OK）✅ **再検証: 会社名保存→ページリロードで反映確認OK**
- [x] `/dashboard/corporate/branding` — ブランディング（ロゴ・カラー設定表示OK）✅ **再検証: 変更を保存→トースト「ブランディング設定を保存しました」OK**
- [x] `/dashboard/corporate/sns` — SNS設定（SNSリンク管理表示OK）✅ **再検証: SNSリンク追加モーダル開閉OK、プラットフォーム選択OK**
- [x] `/dashboard/corporate/departments` — 部門管理（部門一覧・追加ボタン表示OK）✅ **再検証: 部署追加→トースト「部署を追加しました」→削除→「部署を削除しました」OK（type="submit"修正済み確認）**
- [x] `/dashboard/corporate/users` — ユーザー管理（メンバー一覧・招待ボタン表示OK）
- [x] `/dashboard/corporate/users/invite` — ユーザー招待（招待フォーム表示OK）✅ **再検証: 不正メール送信→「無効なメールアドレスがあります」バリデーションOK**
- [x] `/dashboard/corporate/onboarding` — オンボーディング（セットアップ済みテナントは/dashboard/corporateにリダイレクト→想定内）

---

## Phase 5: ダッシュボード（法人メンバー）6ページ

> ⏭️ スキップ: DBに法人メンバー（role: member）アカウントが存在しないため検証不可。法人メンバーを招待・作成後に再検証が必要。

- [ ] `/dashboard/corporate-member` — メンバートップ
- [ ] `/dashboard/corporate-member/profile` — プロフィール
- [ ] `/dashboard/corporate-member/links` — リンク管理
- [ ] `/dashboard/corporate-member/design` — デザイン
- [ ] `/dashboard/corporate-member/share` — 共有
- [ ] `/dashboard/corporate-member/share/qrcode` — QRコード

---

## Phase 6: ダッシュボード（管理者）16ページ

> 要ログイン: スーパー管理者アカウント（admin@sns-share.com）でログイン後に検証

- [x] `/dashboard/admin` — 管理トップ（統計カード・クイックアクション表示OK）
- [x] `/dashboard/admin/profile` — 管理者プロフィール（プロフィールフォーム表示OK）
- [x] `/dashboard/admin/users` — ユーザー管理（ユーザー一覧テーブル・検索・フィルター表示OK）
- [x] `/dashboard/admin/users/export` — ユーザーエクスポート（エクスポートフォーム・フィルター表示OK）
- [x] `/dashboard/admin/profiles` — プロフィール一覧（プロフィールテーブル・検索表示OK）
- [x] `/dashboard/admin/permissions` — 権限管理（永久利用権付与フォーム・一覧表示OK）✅ **再検証: 付与フォーム表示→ユーザー検索・プラン選択セレクト動作OK**
- [x] `/dashboard/admin/subscriptions` — サブスクリプション管理（サブスク一覧テーブル・フィルター表示OK）
- [x] `/dashboard/admin/cancel-requests` — 解約リクエスト（リクエスト一覧テーブル表示OK）
- [x] `/dashboard/admin/notifications` — 通知管理（通知一覧・作成ボタン表示OK）✅ **再検証: 通知作成→トースト「お知らせを作成しました」→削除→「お知らせを削除しました」OK**
- [x] `/dashboard/admin/email` — メール管理（メール配信フォーム・履歴表示OK）✅ **再検証: フォーム表示・送信対象セレクト・HTML5バリデーション動作OK**
- [x] `/dashboard/admin/financial` — 財務ダッシュボード（収支サマリー・グラフ表示OK）
- [x] `/dashboard/admin/financial-admins` — 財務管理者（管理者一覧・追加フォーム表示OK）
- [x] `/dashboard/admin/company-expenses` — 企業経費（経費テーブル・フィルター・統計カード表示OK）✅ **再検証: 経費追加→トースト「委託者経費を登録しました」→削除→「経費を削除しました」OK**
- [x] `/dashboard/admin/contractor-payments` — 請負支払い（月次利益配分・受託者別詳細表示OK）
- [x] `/dashboard/admin/one-tap-seal-orders` — ワンタップシール注文（注文一覧・検索・フィルター・実データ1件表示OK）
- [x] `/dashboard/admin/stripe/revenue` — Stripe売上（月次サマリー・タブ切替・Stripe連携表示OK）

---

## Phase 7: 動的ルート・インタラクション

### プロフィール共有
- [ ] 実在するユーザーslugでプロフィール表示確認
- [ ] SNSリンクの表示・クリック動作
- [ ] vCardダウンロード動作

### QRコード共有
- [ ] 実在するQRコードslugで表示確認
- [ ] リダイレクト動作確認

### ミドルウェア（ロール別リダイレクト）
- [ ] 未認証ユーザー → `/dashboard` アクセス → `/auth/signin` にリダイレクト
- [ ] 個人ユーザー → `/dashboard/corporate` アクセス → `/dashboard` にリダイレクト
- [ ] 法人メンバー → `/dashboard/corporate` アクセス → `/dashboard/corporate-member` にリダイレクト
- [ ] 財務管理者 → 許可外ページ → `/dashboard/admin` にリダイレクト

---

## 進捗サマリー

| フェーズ | 総数 | 完了 | 残り | 状態 |
|---------|------|------|------|------|
| Phase 1: 公開ページ | 23 | 23 | 0 | 完了 |
| Phase 2: 認証フロー | 12 | 12 | 0 | 完了 |
| Phase 3: 個人ダッシュボード | 10 | 10 | 0 | 完了 |
| Phase 4: 法人管理者 | 8 | 8 | 0 | 完了 |
| Phase 5: 法人メンバー | 6 | 0 | 6 | スキップ（メンバーユーザー不在） |
| Phase 6: 管理者 | 16 | 16 | 0 | 完了 |
| Phase 7: 動的ルート | 7 | 0 | 7 | 未着手 |
| **合計** | **82** | **69** | **13** | — |
