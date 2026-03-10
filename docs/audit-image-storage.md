# 画像アセット保存先の設計 - 調査・検討結果

## 現状調査結果

### 1. 現在のロゴ・ファビコンの格納場所

| アセット | 格納場所 |
|---|---|
| サービスロゴ | `public/logo.svg`, `public/logo_blue.svg`, `public/logo_white.svg`, `public/logo_share.svg` |
| ファビコン/PWA | `public/pwa/favicon.ico`, `public/pwa/favicon-*.png`, `public/pwa/android-chrome-*.png`, `public/pwa/apple-touch-icon*.png` |
| OGP画像 | `public/images/icons/ogp.png`, `ogp_line.png` |
| 法人ロゴ | DBに直接保存（`CorporateTenant.logoUrl` にBase64 data URL or 外部URL） |

### 2. next.config.mjs の images 設定

```js
images: {
  domains: ['lh3.googleusercontent.com', 'storage.googleapis.com'],
}
```

- Google認証のプロフィール画像とGCS向けのみ
- Supabase Storageは未許可

### 3. 既存のファイルアップロード機能

`ImageUpload.tsx` では外部ストレージ（Supabase Storage / S3等）は一切使っていない。画像はクライアント側でリサイズ・クロップ後、Base64 data URL としてDBに直接保存（`User.image` や `CorporateTenant.logoUrl`）。

---

## 買取型の制約

- 同一GitHubリポジトリを全パートナーのVercelプロジェクトが参照する
- パートナーAのロゴを `public/images/brand/` に置くと、パートナーBのデプロイにも含まれる
- 各パートナーは独自のSupabaseプロジェクトを持つ

---

## 各選択肢の比較

### (a) パートナーの独自Supabase Storageに保存 + 環境変数でURL指定

| 項目 | 評価 |
|---|---|
| メリット | リポジトリにパートナー固有ファイルが一切混ざらない。パートナーが自分で画像を差し替え可能。各パートナーのSupabaseプロジェクトに閉じるためアクセス制御が自然。 |
| デメリット | Supabase Storageのバケット作成・CORS設定が初期セットアップに必要。`next.config.mjs` の `images.remotePatterns` に各パートナーのSupabaseドメイン（`*.supabase.co`）をワイルドカードで追加する必要あり。現在ストレージ利用実績がないため新規実装が必要。 |
| 実装コスト | 中〜高（Storage API連携、アップロードUI、バケットポリシー設定） |

### (b) public/images/partners/{partner-slug}/ にリポジトリ内配置

| 項目 | 評価 |
|---|---|
| メリット | 最もシンプル。既存の `public/` 配信の仕組みそのまま。デプロイ時に含まれるので高速。ビルド不要で画像差し替え可能（PR経由）。 |
| デメリット | 全パートナーの画像が全デプロイに含まれる（ただしロゴ+ファビコン程度なら合計数百KB）。パートナー数が増えるとリポジトリが肥大化。パートナー自身での差し替えにはGitHub PRが必要。 |
| 実装コスト | 低 |

### (c) 外部CDN（Cloudinary等）

| 項目 | 評価 |
|---|---|
| メリット | 画像最適化（リサイズ、フォーマット変換）が自動。CDN配信で高速。リポジトリに依存しない。 |
| デメリット | 外部サービス依存（コスト増、障害リスク）。パートナーごとの管理画面が別途必要。`images.remotePatterns` の設定追加。過剰な構成（ロゴ数枚にCDNは大袈裟）。 |
| 実装コスト | 中（API連携、アカウント管理） |

---

## 推奨案: (a) Supabase Storage をベースに、現行のBase64方式を段階的に拡張

### 選定理由

1. 各パートナーが独自Supabaseを持つという買取型の前提と完全に合致する。パートナーのロゴはパートナーのインフラに閉じる。
2. リポジトリにパートナー固有のアセットが混ざらないため、リポジトリのクリーンさが保たれる。
3. パートナーが自分の管理画面からロゴを変更でき、開発者の介入が不要。

### 段階的アプローチ

#### Phase 1（即時対応）: 現行のBase64方式をそのまま活用

- 現在 `CorporateTenant.logoUrl` にBase64で保存する仕組みが動いている
- 買取型パートナーも各自のDBにBase64で保存すれば、ストレージ実装なしで対応可能
- ファビコンは環境変数 `NEXT_PUBLIC_FAVICON_URL` で指定（デフォルトは `/pwa/favicon.ico`）

#### Phase 2（パートナー増加時）: Supabase Storageに移行

- Base64はDBサイズを圧迫するため、パートナー数/画像数が増えたらStorage移行
- `next.config.mjs` に `remotePatterns: [{ hostname: '*.supabase.co' }]` を追加
- アップロードAPIを実装し、`ImageUpload.tsx` を拡張

### 環境変数設計（Phase 1で必要なもの）

```env
# パートナーブランド設定
NEXT_PUBLIC_BRAND_NAME="パートナー名"
NEXT_PUBLIC_FAVICON_URL="/pwa/favicon.ico"  # or external URL
# ロゴはDB(CorporateTenant.logoUrl)から取得するため環境変数不要
```

### next.config.mjs の変更（Phase 2で必要）

```js
images: {
  remotePatterns: [
    { hostname: 'lh3.googleusercontent.com' },
    { hostname: 'storage.googleapis.com' },
    { hostname: '*.supabase.co' },  // Phase 2で追加
  ],
}
```

---

## 結論

現行のBase64 DB保存方式は買取型でもそのまま機能するため、まずはそれを活用し、ファビコンのみ環境変数で切り替える最小構成で開始。スケール時にSupabase Storageへ移行する段階的アプローチが最もコスト効率が良い。
