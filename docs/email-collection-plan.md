# 印刷会社リストからのメールアドレス収集ツール

## Context

`data/printing-companies-2026-03-23.csv`（6,732件）に収集済みの印刷会社リストに対し、各社WebサイトURLからメールアドレスを自動収集するスクリプトを構築する。

営業活動（DM送付・パートナー提案）に使用するため、公開されている問い合わせ用メールアドレスが対象。

---

## CSVデータの実態分析

リスト収集時にキーワードを拡充した結果（「名刺印刷」「名刺 印刷会社」→「印刷会社」「印刷所」「プリントショップ」を追加）、件数が3,170件→6,732件に増加。一方で非印刷業種の混入も発生した。

### URL種別の内訳

| 区分 | 件数 | 割合 | 対応 |
|------|------|------|------|
| 正常なWebサイトURL | 約4,550件 | 67.6% | メール収集対象 |
| Google Maps URL (`maps.google.com`) | 1,784件 | 26.5% | スキップ |
| SNS（Instagram / Facebook / LINE） | 57件 | 0.8% | スキップ |
| ビジネスディレクトリ（goope.jp 等） | 36件 | 0.5% | スキップ |
| 非印刷チェーン（後述） | 約300件 | 4.5% | ドメイン除外 |

### 非印刷チェーン店の混入（キーワード拡充の副作用）

キーワードを「印刷会社」「プリントショップ」等に広げた結果、写真プリント・コピーサービスを扱う非印刷業種が混入した:

| ドメイン | 件数 | 業種 |
|---------|------|------|
| `blog.kitamura.jp` | 228件 | カメラのキタムラ（写真プリント） |
| `aeon.com` / `aeontohoku.co.jp` | 39件 | イオン |
| `store.supersports.com` | 15件 | スーパースポーツゼビオ |
| `ksdenki.com` | 14件 | ケーズデンキ |

→ これらはドメイン単位で除外する。はんこ屋フィルタ（会社名ベース）とは別のドメインベース除外リストを管理する。

**教訓**: キーワード拡充は網羅性を高めるが、想定外の業種が混入するリスクがある。除外フィルタは「会社名ベース」と「ドメインベース」の2段構えにすべき。

### チェーン店舗の重複ドメイン（印刷業）

| ドメイン | 件数 |
|---------|------|
| `accea.co.jp` | 74件 |
| `80210.com` | 64件 |
| `p-otani.co.jp` | 22件 |
| `kinkos.co.jp` | 21件 |
| `p1-intl.com` | 15件 |
| `e-creous.com` | 15件 |
| `kanpuri.co.jp` | 14件 |

→ 同一ドメインのメール取得結果をキャッシュし、リクエスト数を削減する。

### UTMパラメータ
430件（6.4%）のURLにUTMトラッキングパラメータが付与されている。ベースURL算出前に除去が必要。

---

## 収集方法の比較

| 方法 | 速度 | 精度 | 実装難度 | 制約 |
|------|------|------|---------|------|
| **A. HTTP fetch + 正規表現** | 高（並列可） | 中（HTML内のメールのみ） | 低 | JS描画コンテンツは取得不可 |
| **B. Playwright ブラウザ自動化** | 低（1件数秒） | 高（JS描画対応） | 中 | 6,700件で数時間〜半日 |
| **C. 手動確認** | 極低 | 最高 | なし | 6,700件は非現実的 |

---

## 推奨：方法A「HTTP fetch + 正規表現」

### 理由
1. **速度** — 並列リクエストで実処理対象4,500件を30〜60分程度で処理可能
2. **十分な精度** — 多くの企業はHTMLにメールアドレスを直書きしている
3. **実装がシンプル** — 外部ライブラリ不要、Node.js標準のfetchで完結
4. **コストゼロ** — API利用なし

### 方法Bとの併用（オプション）
方法Aで取得できなかった企業のうち、優先度の高いものに対してPlaywright MCPで個別に確認する手動ステップを後から追加できる。

---

## 技術設計

### Step 0: 前処理（URLフィルタリング）
CSV読み込み後、以下のURLをメール収集対象から除外する:

**除外対象URL:**
- `maps.google.com` — Google Maps のビジネスリスティング（1,784件）
- `instagram.com`, `facebook.com`, `line.me`, `twitter.com` — SNS（57件）
- `itp.ne.jp`, `mypl.net`, `r.goope.jp` — ビジネスディレクトリ（36件）
- `blog.kitamura.jp`, `aeon.com`, `aeontohoku.co.jp`, `store.supersports.com`, `ksdenki.com` — 非印刷チェーン（約300件）
- `http://` / `https://` で始まらないデータ（電話番号・住所の混入）

**URL正規化:**
- UTMパラメータ（`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`）を除去
- 末尾のスラッシュを統一

※除外された企業もCSV出力に含める（メールアドレス欄は空欄）。

### Step 1: 対象ページの決定
各企業につき、以下のURLを順に試行する（最初にメールが見つかった時点で次の企業へ）:

1. WebサイトURL（CSVに記載のURL、正規化済み）
2. `{ベースURL}/contact`
3. `{ベースURL}/inquiry`
4. `{ベースURL}/about`
5. `{ベースURL}/company`
6. `{ベースURL}/お問い合わせ`
7. `{ベースURL}/会社概要`

※ベースURLが `https://example.com/map/tokyo.html` のような下層ページの場合、ドメインルート `https://example.com/` をベースとしてパスを生成する。

### Step 2: メールアドレス抽出パターン
優先度順に:
1. `mailto:` リンクの href 属性値
2. 正規表現パターン: `[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`

### Step 3: 除外フィルタ（メールアドレス）
以下のメールアドレスは除外する:
- 画像ファイル名の誤検出（`@2x.png`, `@3x.png` 等）
- `example.com`, `example.co.jp`, `sample.com` ドメイン
- `noreply@`, `no-reply@`, `mailer-daemon@` 系
- プラットフォームアドレス: `wixpress.com`, `googleapis.com`, `sentry.io`, `googleusercontent.com`, `gstatic.com`, `w3.org`, `schema.org`, `ogp.me`
- 同一ドメインで複数メールが見つかった場合は全て記録（info@, contact@, sales@ 等）

### Step 4: 日本語エンコーディング対応

古い印刷会社サイトはShift_JIS / EUC-JPを使用している場合がある。文字化けするとメールアドレスの正規表現が正しくマッチしない。

**検出順序:**
1. `Content-Type` ヘッダーの `charset=` パラメータ
2. HTMLの `<meta charset="...">` タグ
3. HTMLの `<meta http-equiv="Content-Type" content="...; charset=...">` タグ
4. デフォルト: UTF-8

**対応エンコーディング:** Shift_JIS, EUC-JP, ISO-2022-JP → `TextDecoder` で再デコード

### ドメインキャッシュ
- 同一ドメインで既にメールアドレスを取得済みの場合、キャッシュから結果を返す
- これによりチェーン店（accea.co.jp: 74件 等）で同一サイトへの重複リクエストを防止
- キャッシュキーはドメイン名（`www.accea.co.jp` → `accea.co.jp`）

### エラーハンドリング
- タイムアウト: 1サイトあたり最大10秒
- HTTP 4xx/5xx: スキップして次の企業へ
- SSL証明書エラー: スキップ
- リダイレクトループ: 最大5回まで追従
- 結果が0件のサイトは「メール未取得」として記録（削除しない）

### 並列・レート制限
- 同時接続数: 10（サーバー負荷を考慮）
- 同一ドメインへの連続アクセス間隔: 1秒
- 進捗表示: 100件ごとにステータス出力

### 中断・再開（チェックポイント）
- 処理結果を `data/email-scrape-progress.json` に随時書き出し
- 再実行時にチェックポイントが存在すれば、処理済みの企業をスキップして再開
- 500件ごとにチェックポイントを保存

### robots.txt の扱い
- ドメイン単位でrobots.txtを取得しキャッシュする（同一ドメインは1回のみ）
- `User-agent: *` の `Disallow: /` をチェック（全面禁止のみスキップ）
- robots.txtの取得に失敗した場合（404等）はクロール許可として扱う

---

## ファイル構成

```
scripts/
  collect-printing-companies/
    collect-emails.ts       # メイン: メールアドレス収集スクリプト
    email-extractor.ts      # HTML解析・メールアドレス抽出ロジック
    csv-reader.ts           # 既存CSVの読み込み・前処理
```

### csv-reader.ts
- `data/printing-companies-YYYY-MM-DD.csv` を読み込み
- BOM除去、ダブルクォート対応のパース（状態機械ベース）
- `PrintingCompany[]` 型で返却

### email-extractor.ts
- `fetchPage(url)` — fetch + 10秒タイムアウト、User-Agent設定、エンコーディング自動検出
- `extractEmails(html)` — mailto: + 正規表現でメールアドレス抽出、除外フィルタ適用
- `extractEmailsFromSite(url)` — robots.txt確認 → トップページ取得 → サブページ巡回
- ベースURL算出ロジック（下層ページURL → ドメインルート）

### collect-emails.ts
- CSVを読み込み、Google Maps URL等をフィルタリング
- 並列バッチ処理（`Promise.allSettled`）
- チェックポイントによる中断・再開対応
- 最終出力: `data/printing-companies-with-emails-YYYY-MM-DD.csv`

---

## 出力CSVのカラム

既存カラムに以下を追加:
```
会社名, 住所, 電話番号, WebサイトURL, Google評価, レビュー数, 都道府県, place_id, メールアドレス, メール取得元URL
```

- メールアドレス: 複数ある場合はセミコロン区切り（`info@example.com; sales@example.com`）
- メール取得元URL: どのページから取得したか（デバッグ・検証用）

---

## 実行方法

```bash
# 全件実行
npx tsx scripts/collect-printing-companies/collect-emails.ts

# 件数を指定してテスト（先頭N件のみ）
npx tsx scripts/collect-printing-companies/collect-emails.ts --limit 10

# 入力CSVを指定
npx tsx scripts/collect-printing-companies/collect-emails.ts --input data/printing-companies-2026-03-23.csv

# 並列数を変更
npx tsx scripts/collect-printing-companies/collect-emails.ts --concurrency 5
```

---

## 検証方法

1. `--limit 10` で先頭10件のテスト実行
2. 取得結果を目視確認（メールアドレスの妥当性、誤検出の有無）
3. 除外フィルタの調整が必要なら修正
4. 全件実行（30〜60分）
5. 出力CSVの集計: メール取得率を確認

### 想定取得率
- 実処理対象 約4,550件のうち30〜50%（**約1,350〜2,275件**）でメールアドレスが取得できる見込み
- 残りはフォームのみ・メール非公開・サイト閉鎖などの理由で取得不可
- ドメインキャッシュにより、実際のHTTPリクエスト数は3,000〜4,000件程度に削減される見込み

---

## 実装時の注意事項・教訓

### dotenvの読み込み
`tsx` は Next.js と異なり `.env.local` を自動ロードしない。スクリプトの先頭で `dotenv.config()` を呼ぶこと。（リスト収集スクリプトで発生した問題と同じ。詳細は `docs/printing-company-collection-plan.md` 参照）

### キーワード拡充による非印刷業種の混入
リスト収集時にキーワードを広げた結果、「プリント」を扱う非印刷業種（カメラのキタムラ228件等）が大量に混入した。メール収集前にドメインベースの除外フィルタを適用すべき。

### エンコーディング問題
印刷業界は老舗企業が多く、Shift_JISのWebサイトが一定数存在する。UTF-8前提でHTMLを解析するとメールアドレスの正規表現がマッチしないため、必ずエンコーディング検出を行うこと。

---

## 法的留意事項

- 収集対象は各社が**Webサイト上で公開している**メールアドレスのみ
- robots.txt をドメイン単位で確認し、クロール禁止のサイトはスキップする
- User-Agentを明示し、アクセス頻度を抑制する（同一ドメイン間隔1秒）
- 収集したメールアドレスの利用は特定電子メール法に準拠すること（オプトイン未取得の相手への広告メール送信は不可。営業提案・パートナー打診は「取引関係の通知」として許容される範囲で行う）

---

## 修正が必要な既存ファイル

なし（新規スクリプトのみ作成）

## 参考にする既存パターン

- `scripts/collect-printing-companies/csv-export.ts` — CSV出力パターン（BOM付きUTF-8、escapeField関数）
- `scripts/collect-printing-companies/google-places.ts` — 並列制御・レート制限・sleep()パターン
- `scripts/collect-printing-companies/index.ts` — CLI引数パース・dotenv読み込み
