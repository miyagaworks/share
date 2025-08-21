# ワンタップシール注文機能 実装計画書（修正版）

## 1. 機能概要

### 目的
Share利用料の支払いと同時に、またはワンタップシール単体でNFCタグシールを注文できる機能を追加する。

### 商品概要
- **商品名**: ワンタップシール（NFCタグシール）
- **種類**: ブラック、グレー、ホワイト（3色）
- **価格**: 550円（税込）/枚
- **配送方法**: クリックポスト固定
- **配送料**: 185円（税込）

### 注文対象者
- **個人ユーザー**: 自分用のワンタップシールを注文
- **法人管理者**: メンバー分のワンタップシールを一括注文
- **法人メンバー**: 注文不可（管理者が代理注文）

### URL設定
- 各シールには個別URL設定: `app.sns-share.com/qr/[半角英数字]`
- 既存のQrCodePageモデルのslugを活用
- 法人の場合：メンバーのslugから選択または新規作成

## 2. ページ構成・機能設計

### 2.1 個人ユーザー向け
**場所**: `/dashboard/subscription` ページ拡張

```
┌─────────────────────────────────────┐
│ 現在のプラン情報                      │
├─────────────────────────────────────┤
│ プラン選択（個人）                    │
├─────────────────────────────────────┤
│ 🆕 ワンタップシール注文（オプション）      │
│ ┌─ 商品選択 ─────────────────────┐  │
│ │ ● ブラック × [数量] 枚           │  │
│ │ ● グレー   × [数量] 枚           │  │
│ │ ● ホワイト × [数量] 枚           │  │
│ │                               │  │
│ │ 📝 QRスラッグ設定                │  │
│ │ 既存: [プルダウン選択]            │  │
│ │ 新規: qr/[入力欄]               │  │
│ │                               │  │
│ │ 📦 配送先情報                   │  │
│ │ 郵便番号: [zipcloud自動検索]      │  │
│ │ 住所: [手動入力]                │  │
│ │ お届け先名: [入力欄]             │  │
│ └─────────────────────────────────┘  │
└─────────────────────────────────────┘
```

### 2.2 法人管理者向け
**場所**: `/dashboard/corporate` ページ拡張

```
┌─────────────────────────────────────┐
│ 法人ダッシュボード                    │
├─────────────────────────────────────┤
│ 🆕 メンバー用ワンタップシール一括注文      │
│ ┌─ メンバー選択 ─────────────────┐  │
│ │ ☑ 田中太郎 (qr/tanaka)          │  │
│ │ ☑ 佐藤花子 (qr/sato)            │  │
│ │ ☑ 山田次郎 (未設定)              │  │
│ │                               │  │
│ │ 📝 各メンバーのシール設定          │  │
│ │ 田中太郎: 黒×2, 白×1            │  │
│ │ 佐藤花子: グレー×3               │  │
│ │ 山田次郎: qr/[新規入力] 黒×1      │  │
│ │                               │  │
│ │ 📦 会社配送先情報                │  │
│ │ [法人設定から自動入力]            │  │
│ └─────────────────────────────────┘  │
└─────────────────────────────────────┘
```

### 2.3 スーパーadmin向け配送管理
**場所**: `/dashboard/admin/touch-seal-orders` 新規ページ

```
┌─────────────────────────────────────┐
│ ワンタップシール注文管理                  │
├─────────────────────────────────────┤
│ [絞り込み] 未発送 | 発送済み | 全て    │
├─────────────────────────────────────┤
│ 📦 注文一覧                         │
│ ┌─ 注文 #001 ──────────────────┐   │
│ │ 注文者: 株式会社○○ 田中太郎       │   │
│ │ 注文日: 2024/01/15              │   │
│ │ ステータス: [未発送 ▼]           │   │
│ │                               │   │
│ │ 📋 注文内容:                   │   │
│ │ • 黒×2 (qr/tanaka) [コピー]     │   │
│ │ • 白×1 (qr/tanaka-white)       │   │
│ │                               │   │
│ │ 📍 配送先: [住所コピー]          │   │
│ │ 東京都渋谷区... 田中太郎         │   │
│ │                               │   │
│ │ 🚚 追跡番号入力:                │   │
│ │ [入力欄] [発送完了メール送信]     │   │
│ └─────────────────────────────────┘   │
└─────────────────────────────────────┘
```

## 3. データベース設計

### 3.1 新規テーブル

```sql
-- ワンタップシール注文テーブル
CREATE TABLE touch_seal_orders (
  id                 STRING PRIMARY KEY,
  user_id           STRING NOT NULL,
  tenant_id         STRING NULL,        -- 法人注文の場合
  subscription_id   STRING NULL,        -- 同時注文の場合
  order_type        STRING NOT NULL,    -- 'individual', 'corporate'
  order_date        DATETIME NOT NULL,
  status            STRING NOT NULL,    -- 'pending', 'paid', 'preparing', 'shipped', 'delivered'
  
  -- 配送情報
  postal_code       STRING NOT NULL,
  address           STRING NOT NULL,
  recipient_name    STRING NOT NULL,
  
  -- 金額情報
  seal_total        INT NOT NULL,       -- シール代金小計（税抜）
  shipping_fee      INT NOT NULL,       -- 配送料（税抜）
  tax_amount        INT NOT NULL,       -- 消費税
  total_amount      INT NOT NULL,       -- 合計金額（税込）
  
  -- 配送管理
  tracking_number   STRING NULL,        -- クリックポスト追跡番号
  shipped_at        DATETIME NULL,      -- 発送日時
  shipped_by        STRING NULL,        -- 発送処理者（admin ID）
  
  -- Stripe情報
  stripe_payment_intent_id STRING NULL,
  
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES User(id),
  FOREIGN KEY (tenant_id) REFERENCES CorporateTenant(id),
  FOREIGN KEY (subscription_id) REFERENCES Subscription(id)
);

-- ワンタップシール詳細テーブル
CREATE TABLE touch_seal_items (
  id              STRING PRIMARY KEY,
  order_id       STRING NOT NULL,
  member_user_id STRING NULL,        -- 法人注文時のメンバーID
  color          STRING NOT NULL,    -- 'black', 'gray', 'white'
  quantity       INT NOT NULL,
  unit_price     INT NOT NULL,       -- 500
  qr_slug        STRING NOT NULL,    -- QRCodePage.slug参照
  
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (order_id) REFERENCES touch_seal_orders(id),
  FOREIGN KEY (member_user_id) REFERENCES User(id),
  FOREIGN KEY (qr_slug) REFERENCES QrCodePage(slug)
);
```

### 3.2 既存テーブルとの関連
- `QrCodePage.slug` を活用してURL管理
- `CorporateTenant` と連携して法人一括注文
- `User` の法人メンバー情報を活用

## 4. API設計

### 4.1 新規API
```typescript
// ワンタップシール注文関連
POST /api/touch-seal/order              // 注文作成
GET  /api/touch-seal/orders             // 注文履歴（ユーザー向け）
GET  /api/touch-seal/orders/[id]        // 注文詳細

// 法人向け
GET  /api/corporate/members/qr-slugs    // メンバーのQRスラッグ一覧
POST /api/corporate/touch-seal/order    // 法人一括注文

// 管理者向け
GET  /api/admin/touch-seal/orders       // 全注文管理
PUT  /api/admin/touch-seal/orders/[id]  // 配送状況更新
POST /api/admin/touch-seal/ship         // 発送処理＆メール送信

// ユーティリティ
POST /api/touch-seal/validate-qr        // QRスラッグ重複チェック
POST /api/address/search                // zipcloud住所検索
```

### 4.2 既存API拡張
```typescript
POST /api/subscription/create           // ワンタップシール同時注文対応
GET  /api/user/dashboard-info          // ワンタップシール注文権限情報追加
```

## 5. 必要な新規ファイル

### 5.1 コンポーネント
```
components/touch-seal/
├── TouchSealOrderForm.tsx             // 個人向け注文フォーム
├── CorporateTouchSealOrder.tsx        // 法人向け一括注文
├── TouchSealColorSelector.tsx         // 色・数量選択
├── TouchSealUrlManager.tsx            // QRスラッグ管理
├── ShippingAddressForm.tsx            // 配送先入力
├── AddressSearchInput.tsx             // zipcloud住所検索
├── TouchSealOrderSummary.tsx          // 注文内容確認
├── TouchSealOrderHistory.tsx          // 注文履歴
└── TouchSealOrderCard.tsx             // 注文カード表示

components/admin/
├── TouchSealOrderManagement.tsx       // 管理者注文管理
├── TouchSealOrderDetail.tsx           // 注文詳細表示
├── ShippingManager.tsx                // 発送管理
└── TrackingNumberInput.tsx            // 追跡番号入力

components/corporate/
├── MemberQrSlugList.tsx               // メンバーQRスラッグ一覧
└── CorporateShippingInfo.tsx          // 法人配送先管理
```

### 5.2 ページ
```
app/dashboard/admin/touch-seal-orders/
├── page.tsx                           // 注文管理メインページ
└── [id]/
    └── page.tsx                       // 注文詳細ページ
```

### 5.3 API Routes
```
app/api/touch-seal/
├── order/route.ts                     // 注文作成
├── orders/
│   ├── route.ts                       // 注文一覧
│   └── [id]/route.ts                  // 注文詳細
├── validate-qr/route.ts               // QRスラッグ検証
└── ship/route.ts                      // 発送処理

app/api/corporate/touch-seal/
└── order/route.ts                     // 法人一括注文

app/api/admin/touch-seal/
├── orders/route.ts                    // 管理者注文管理
└── ship/route.ts                      // 発送完了処理

app/api/address/
└── search/route.ts                    // zipcloud住所検索
```

### 5.4 型定義・ユーティリティ
```
types/
├── touch-seal.ts                      // ワンタップシール関連型
├── shipping.ts                        // 配送関連型
└── address.ts                         // 住所関連型

lib/touch-seal/
├── order-calculator.ts                // 金額計算
├── qr-slug-manager.ts                 // QRスラッグ管理
└── shipping-calculator.ts             // 配送料計算

lib/address/
├── zipcloud-api.ts                    // zipcloud API
└── address-validator.ts               // 住所検証

lib/email/templates/
├── touch-seal-order-confirmation.ts   // 注文確認メール
└── touch-seal-shipped.ts             // 発送完了メール
```

## 6. 実装フェーズ

### Phase 1: 基盤構築（1週間）
- [ ] データベース設計・マイグレーション
- [ ] 基本API実装
- [ ] 型定義作成
- [ ] zipcloud API統合

### Phase 2: 個人ユーザー機能（1週間）
- [ ] 個人向けワンタップシール注文フォーム
- [ ] Subscription ページ拡張
- [ ] 住所検索・QRスラッグ管理
- [ ] 決済統合（個人）

### Phase 3: 法人機能（1週間）
- [ ] 法人メンバーQRスラッグ一覧
- [ ] 法人一括注文フォーム
- [ ] Corporate ページ拡張
- [ ] 決済統合（法人）

### Phase 4: 管理者機能（1週間）
- [ ] スーパーadmin注文管理画面
- [ ] 配送状況管理
- [ ] 追跡番号入力・発送メール
- [ ] 注文詳細表示

### Phase 5: テスト・最適化（3日）
- [ ] 統合テスト
- [ ] エラーハンドリング
- [ ] パフォーマンス最適化

## 7. 技術仕様詳細

### 7.1 権限制御
```typescript
// 注文権限チェック
const canOrderTouchSeal = {
  individual: !hasCorpAccess && hasActivePlan,
  corporate: isCorpAdmin && hasActivePlan,
  member: false  // メンバーは注文不可
}
```

### 7.2 QRスラッグ管理
- 既存の `QrCodePage.slug` を活用
- 法人メンバーの未設定者は新規作成
- 重複チェック機能

### 7.3 決済統合
```typescript
// Stripe Payment Intent
{
  amount: (sealTotal + shippingFee) * 1.1, // 税込
  metadata: {
    order_type: 'touch_seal',
    user_id: userId,
    tenant_id?: tenantId,
    items: JSON.stringify(items)
  }
}
```

### 7.4 配送管理
- ステータス管理：pending → paid → preparing → shipped → delivered
- クリックポスト追跡番号管理
- 自動メール送信（注文確認・発送完了）

### 7.5 セキュリティ
- 法人管理者のみメンバー注文可能
- QRスラッグ重複防止
- 配送先情報の適切な管理

---

この修正版計画により、個人・法人両方に対応し、管理者の配送管理機能も含めた包括的なワンタップシール注文システムを構築できます。