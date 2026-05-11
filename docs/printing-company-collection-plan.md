# 名刺印刷会社リスト収集ツールの構築

## Context

小規模事業者持続化補助金でパートナー販路開拓を計画中。ターゲットとなる国内の名刺印刷会社のリストを効率的に収集するツールを構築したい。

既存プロジェクト（Share）はNext.js/TypeScriptベースのSaaSアプリで、以下のリソースが利用可能：
- Google Maps APIキー（`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`）
- Playwright MCP（ブラウザ自動操作）
- CSV出力のパターン（BOM付きUTF-8、Excel互換）
- Prisma ORM + PostgreSQL

---

## 収集方法の比較

| 方法 | データ量 | 精度 | コスト | 実装難度 | 法的リスク |
|------|---------|------|--------|---------|-----------|
| **A. Google Places API** | 都道府県×キーワードで数千件 | 高（住所・電話・URL・評価あり） | 有料（$32/1000リクエスト） | 低 | なし（公式API） |
| **B. iタウンページ スクレイピング** | 多い（業種検索可能） | 中（住所・電話あり） | 無料 | 中 | グレー（利用規約次第） |
| **C. 国税庁 法人番号API** | 全法人（500万件超） | 低（業種フィルタ不可） | 無料 | 中 | なし（公式API） |
| **D. Google検索スクレイピング** | 中程度 | 低〜中 | 無料 | 高 | 高（規約違反） |

---

## 推奨：方法A「Google Places API」

### 理由
1. **既にAPIキーを保有** → 即座に利用可能
2. **データ品質が高い** → 会社名・住所・電話番号・WebサイトURL・Google評価が一括取得
3. **法的にクリーン** → Google公式APIで利用規約の範囲内
4. **実装がシンプル** → 1スクリプトで完結、メンテナンス不要
5. **都道府県別の検索** → 全国網羅的に収集可能

### コスト見積もり
- Text Search (New): $32/1000リクエスト（電話番号・WebサイトURL含む。Place Details不要）
- Text Search: 50地点 × 5キーワード × 最大3ページ = 最大750リクエスト
- **推定コスト: 約$25〜35（3,500〜5,000円程度）で全国分を取得可能**
- ※東京テスト実行後に実件数を確認し、全国実行前にコストを再見積もりすること

### 取得できるデータ
| フィールド | 内容 | 営業活用 |
|-----------|------|---------|
| displayName | 会社名 | 宛名 |
| formattedAddress | 住所 | DM発送先 |
| nationalPhoneNumber | 電話番号 | テレアポ |
| websiteUri | WebサイトURL | 事前リサーチ |
| rating / userRatingCount | Google評価・レビュー数 | 優先度判断 |
| businessStatus | 営業状況 | 廃業フィルタ |
| types | 業種タグ | 分類 |

---

## 実装プラン

### ファイル構成
```
scripts/
  collect-printing-companies/
    index.ts          # メインスクリプト（エントリポイント）
    google-places.ts  # Google Places API (New) クライアント
    prefectures.ts    # 47都道府県の座標データ
    csv-export.ts     # CSV出力（既存パターン流用）
    types.ts          # 型定義
```

### Step 1: 都道府県データ（prefectures.ts）
- 47都道府県の中心座標（緯度・経度）と検索半径を定義
- 大きな都道府県は複数地点に分割してカバレッジ向上（例: 北海道は旭川・函館・帯広を追加）
- `index.ts` で `PREFECTURES` と `HOKKAIDO_EXTRA_POINTS` を結合して使用する

### Step 2: Google Places APIクライアント（google-places.ts）
- **Places API (New)** の Text Search エンドポイントを使用（`POST https://places.googleapis.com/v1/places:searchText`）
- 認証は `X-Goog-Api-Key` ヘッダー、取得フィールドは `X-Goog-FieldMask` で指定
- Text Search一発で電話番号・WebサイトURLも取得可能（Place Details API不要 → コスト削減）
- 都道府県ごとにlocationBias（circle）を設定して全国をスキャン
- ページネーション対応（nextPageTokenで最大60件/検索）
- レート制限のハンドリング（リクエスト間に300msのdelay）

### Step 3: データ加工・重複排除・除外フィルタ
- place_idで重複排除（隣接都道府県の境界で重複する可能性）
- businessStatus === "OPERATIONAL" のみ抽出
- **はんこ屋・印鑑店の除外フィルタ**: 会社名に「はんこ」「印鑑」「ゴム印」「スタンプ」を含む場合は除外（ただし「印刷」も含む場合は残す）

### Step 4: CSV出力（csv-export.ts）
- 既存の `/app/api/admin/users/export/route.ts` のCSV出力パターンを流用
- BOM付きUTF-8でExcel互換出力
- 出力先: `data/printing-companies-YYYY-MM-DD.csv`

### Step 5: 実行方法
```bash
# 全国実行
npx tsx scripts/collect-printing-companies/index.ts

# 特定の都道府県のみ（テスト用）
npx tsx scripts/collect-printing-companies/index.ts --prefecture tokyo
```

### 出力CSVのカラム
```
会社名, 住所, 電話番号, WebサイトURL, Google評価, レビュー数, 都道府県, place_id
```

### 実績収集件数
- 東京都テスト: 191件（除外前204件、はんこ屋等13件除外）
- 全国合計: 6,732件（除外前7,003件、はんこ屋等271件除外）

---

## 網羅性を高めるための施策

### 施策1: 検索キーワードの拡充

初回実装では「名刺印刷」「名刺 印刷会社」の2キーワードで3,170件を収集したが、Google Mapsのビジネスカテゴリが「印刷サービス」等で登録されている企業はヒットしなかった。

**キーワードを5つに拡充して再収集した結果、6,732件に倍増した。**

| キーワード | 用途 |
|-----------|------|
| `名刺印刷` | 名刺印刷特化の企業を直接ターゲット |
| `名刺 印刷会社` | 「名刺」+「印刷会社」のAND検索 |
| `印刷会社` | 名刺以外も扱う一般印刷会社を網羅 |
| `印刷所` | 小規模・個人経営の印刷所をカバー |
| `プリントショップ` | カタカナ名称の店舗をカバー |

**教訓**: ターゲット業種に直接マッチするキーワードだけでなく、上位カテゴリ（「印刷会社」「印刷所」）のキーワードも含めることで、カテゴリ登録が異なる企業も拾える。

### 施策2: 不要業種の除外フィルタ

キーワードを広げると、はんこ屋・印鑑店など印刷とは無関係の業種が混入する。

**除外ロジック:**
```
会社名に以下を含む場合は除外（ただし「印刷」も含む場合は残す）:
- 「はんこ」「印鑑」「ゴム印」「スタンプ」
```

「ただし印刷も含む場合は残す」の条件が重要。例:「はんこと印刷のお店」のような複合業種を誤除外しない。

**結果**: 271件を除外（7,003件 → 6,732件）

### 施策3: 大面積都道府県の検索ポイント分割

北海道は面積が広すぎて1地点（札幌中心）の検索半径ではカバーできない。
主要都市で追加の検索ポイントを設定:

| 追加地点 | 半径 |
|---------|------|
| 北海道（旭川） | 40km |
| 北海道（函館） | 30km |
| 北海道（帯広） | 30km |

**教訓**: 他の案件でも、面積の大きい対象エリア（東北全域、九州全域など）は複数の検索ポイントに分割すべき。

---

## 実装時に発生した問題と解決策

### 問題1: レガシーPlaces APIが廃止済み

**症状**: `maps.googleapis.com/maps/api/place/textsearch/json` にリクエストすると `REQUEST_DENIED` エラー。
**原因**: Google Places APIのレガシー版は新規プロジェクトでは有効化できない。
**解決**: Places API (New) (`places.googleapis.com/v1/places:searchText`) に書き換え。POSTリクエスト + ヘッダー認証方式に変更。
**副次的メリット**: Text Searchの応答に電話番号・WebサイトURLが含まれるため、Place Details APIの呼び出しが不要になりコスト削減。

### 問題2: APIキーのHTTPリファラ制限

**症状**: `Requests from referer <empty> are blocked.`
**原因**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` はブラウザ用にHTTPリファラ制限が設定されており、Node.jsからのリクエストはリファラなしのため拒否される。
**解決**: Google Cloud Consoleで **IP制限付きのサーバー用APIキー** を別途作成し、`.env.local` に `GOOGLE_PLACES_API_KEY` として追加。コード内で `GOOGLE_PLACES_API_KEY` を優先的に参照するよう変更。

### 問題3: .env.local の読み込みタイミング

**症状**: `GOOGLE_PLACES_API_KEY が設定されていません`
**原因**: `tsx` は Next.js と異なり `.env.local` を自動ロードしない。また、ESモジュールの `import` はファイルトップで即時評価されるため、`const API_KEY = process.env.XXX` をモジュールスコープに書くと、dotenvの `config()` が実行される前に空文字で固定されてしまう。
**解決**:
1. `index.ts` の先頭で `dotenv.config()` を呼び出し
2. `google-places.ts` のAPIキー取得を `const API_KEY = ...` から `function getApiKey()` に変更し、呼び出し時に `process.env` を参照するようにした

### 問題4: Google APIの一時的エラー

**症状**: 全国実行中に `503 Service Unavailable` や `API key expired` エラーが散発。
**原因**: Google側の一時的な負荷。「API key expired」は実際にはレート制限のエラー。
**対応**: エラー時はそのページをスキップして次のキーワード/都道府県に進む設計。大半のデータは正常に取得できた。
**改善案**: リトライロジックの追加（指数バックオフで最大3回）。

---

## 補足：方法Bとの併用（オプション）

Google Places APIで取得できない企業を補完したい場合、Playwright MCPを使ってiタウンページの「名刺印刷」カテゴリを補助的にスクレイピングすることも可能。ただし：
- iタウンページの利用規約を事前に確認する必要がある
- Playwright MCPは既にプロジェクトに存在するため追加インストール不要
- あくまで補完的な手段として、Google Places APIをメインとする

---

## 検証方法

1. まず東京都で動作確認（`--prefecture tokyo` オプション）
2. 取得件数・データ品質を確認、除外フィルタの動作を確認
3. 問題なければ全国実行
4. 出力CSVをExcelで開いて文字化けなし・データ品質を確認

---

## 他案件への転用チェックリスト

このツールを別の業種リスト収集に転用する際のチェックリスト:

- [ ] **APIキーの準備**: サーバー用（IP制限）のAPIキーを作成し、Places API (New) を有効化
- [ ] **キーワード設計**: ターゲット業種の直接キーワード＋上位カテゴリキーワードの両方を用意
- [ ] **除外フィルタ設計**: キーワード拡充で混入する不要業種の除外条件を定義
- [ ] **検索地点の設計**: 対象エリアの面積に応じて検索ポイントを分割
- [ ] **コスト見積もり**: キーワード数 × 地点数 × 最大ページ数 × $0.032/リクエストで概算
- [ ] **テスト実行**: 1都道府県でテスト → 件数・品質確認 → 全国実行の順で進める

---

## 修正が必要な既存ファイル

なし（新規スクリプトのみ作成。既存のアプリケーションコードには変更を加えない）

## 参考にする既存パターン

- `/Users/miyagawakiyomi/Projects/share/app/api/admin/users/export/route.ts` - CSV出力パターン（BOM付きUTF-8）
- `/Users/miyagawakiyomi/Projects/share/lib/utils/api.ts` - HTTPクライアントパターン
