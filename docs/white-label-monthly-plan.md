# ホワイトラベル実装計画書（月額型）

**文書バージョン:** 1.2
**作成日:** 2026-03-10
**対象:** 月額プラン（ベーシック / プロ / プレミアム）

---

## 1. 概要

### 1-1. 月額型の特徴

| 項目 | 内容 |
|------|------|
| **インフラ** | Share本体と同一のSupabase / Vercelで稼働（共有インフラ） |
| **デプロイ** | 単一アプリケーション内でマルチテナント分離 |
| **ドメイン** | パートナー独自ドメインをVercelカスタムドメインとして追加 |
| **アップデート** | Share本体の更新が自動的に全パートナーに反映 |
| **運用責任** | インフラ・セキュリティ・アップデートはすべてShare側 |

### 1-2. プラン別仕様

| | ベーシック | プロ | プレミアム |
|---|---|---|---|
| **月額（税抜）** | ¥30,000 | ¥50,000 | ¥80,000 |
| **アカウント上限** | 300 | 600 | 1,000 |
| **技術サポート** | メール | メール + オンライン | 専任担当 |
| **アップデート** | 通常 | 通常 | 優先 |
| **初期設定費** | ¥100,000 | ¥100,000 | ¥100,000 |

※ アカウント数 ＝ パートナー配下の全テナントの個人ユーザー数 + 法人の社員数合計
※ 初期設定費にはブランド設定（ロゴ・カラー・ドメイン）の初期構築を含む。トライアル期間中に契約した場合は無料（LP記載のオファーと整合）

### 1-3. 買取型との根本的な違い

| 観点 | 月額型 | 買取型 |
|------|--------|--------|
| インフラ | 共有（Share管理） | 分離（パートナーのSupabase/Vercel） |
| データベース | 同一DB、テナントIDで論理分離 | 別DB、物理分離 |
| デプロイ | 単一アプリ | パートナーごとに個別デプロイ |
| コードベース | 同一リポジトリ（Share管理） | 同一リポジトリ、環境変数で分岐 |
| カスタマイズ | ブランディングのみ | ブランディング＋機能フラグによる有効/無効切替 |

---

## 2. アーキテクチャ設計

### 2-1. テナント階層モデル

現在のShareは「CorporateTenant → Users」の2階層構造。
月額型ホワイトラベルでは、この上に「Partner」層を追加し**3階層**にする。

```
Share（プラットフォーム）
  └── Partner（パートナー事業者）← 新規追加
        ├── CorporateTenant A（パートナーの顧客企業）
        │     ├── admin
        │     └── members...
        ├── CorporateTenant B
        │     ├── admin
        │     └── members...
        └── 個人ユーザー（パートナー経由の個人契約）
```

### 2-2. 新規Prismaモデル

```prisma
model Partner {
  id                String   @id @default(cuid())
  name              String                          // パートナー企業名
  slug              String   @unique                // URL識別子

  // ブランディング
  brandName         String                          // サービスブランド名（エンドユーザーに見える名前）
  logoUrl           String?
  logoWidth         Int?
  logoHeight        Int?
  primaryColor      String   @default("#3B82F6")
  secondaryColor    String?
  faviconUrl        String?

  // ドメイン
  customDomain      String?  @unique                // 例: meishi.partner-company.com
  domainVerified    Boolean  @default(false)

  // メール設定
  emailFromName     String?                         // メール差出人名
  emailFromAddress  String?                         // 例: noreply@partner-company.com
  emailReplyTo      String?                         // 返信先
  supportEmail      String?                         // サポート用メールアドレス

  // プラン・課金
  plan              String   @default("basic")      // basic / pro / premium
  maxAccounts       Int      @default(300)           // プランに応じた上限
  billingStatus     String   @default("active")     // active / suspended / cancelled
  billingEmail      String?
  stripeCustomerId  String?                         // Stripe顧客ID（パートナーへの請求用）
  stripeSubscriptionId String?

  // 管理
  adminUserId       String   @unique                // パートナー管理者のUserID
  accountStatus     String   @default("active")     // active / suspended / trial
  trialEndsAt       DateTime?

  // フッター・法的情報
  companyName       String?                         // 法人名（フッター表示用）
  companyAddress    String?
  privacyPolicyUrl  String?
  termsUrl          String?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // リレーション
  adminUser         User     @relation("PartnerAdmin", fields: [adminUserId], references: [id])
  tenants           CorporateTenant[] @relation("PartnerTenants")
  partnerUsers      User[]   @relation("PartnerUsers")      // パートナー経由の個人ユーザー
  activityLogs      PartnerActivityLog[]
}

model PartnerActivityLog {
  id          String   @id @default(cuid())
  partnerId   String
  userId      String?
  action      String                              // tenant_created, user_invited, branding_updated, etc.
  entityType  String
  entityId    String?
  description String
  metadata    Json?
  createdAt   DateTime @default(now())

  partner     Partner  @relation(fields: [partnerId], references: [id], onDelete: Cascade)

  @@index([partnerId, createdAt(sort: Desc)])
}
```

### 2-3. 既存モデルへの変更

```prisma
// CorporateTenantに追加
model CorporateTenant {
  // ... 既存フィールド
  partnerId   String?                             // ★追加: 所属パートナー
  partner     Partner? @relation("PartnerTenants", fields: [partnerId], references: [id])
}

// Userに追加
model User {
  // ... 既存フィールド
  partnerId          String?                      // ★追加: パートナー経由の個人ユーザー
  partnerUser        Partner? @relation("PartnerUsers", fields: [partnerId], references: [id])
  adminOfPartner     Partner? @relation("PartnerAdmin")
}
```

### 2-4. ロールシステムの拡張

現在の6段階ロールに `partner-admin` を追加：

```
super-admin        → Share運営（既存）
financial-admin    → 財務管理（既存）
partner-admin      → ★新規: パートナー管理者
permanent-admin    → 永久利用権の法人管理者（既存）
admin              → 法人テナント管理者（既存）
member             → 法人テナントメンバー（既存）
personal           → 個人ユーザー（既存）
```

---

## 3. 機能一覧と実装範囲

### フェーズ1: 基盤構築（MVP）

| # | 機能 | 説明 | 優先度 |
|---|------|------|--------|
| 1-1 | Partnerモデル & マイグレーション | 上記スキーマの実装 | 必須 |
| 1-2 | partner-adminロール | auth.ts / middleware.ts への組み込み | 必須 |
| 1-3 | パートナーダッシュボード（基本） | `/dashboard/partner/` の基本UI | 必須 |
| 1-4 | テナント管理CRUD | パートナーが顧客テナントを作成・管理 | 必須 |
| 1-5 | ブランディング設定 | パートナーのロゴ・カラー・ブランド名の設定 | 必須 |
| 1-6 | カスタムドメイン対応 | middleware.tsでのドメインベースルーティング | 必須 |
| 1-7 | ブランド分離（プロフィールページ） | `/[slug]` ページでパートナーブランド表示 | 必須 |

### フェーズ2: 運用機能

| # | 機能 | 説明 | 優先度 |
|---|------|------|--------|
| 2-1 | アカウント数カウント & 制限 | プラン上限の自動チェック | 必須 |
| 2-2 | メールブランド分離 | パートナーブランドでのメール送信 | 必須 |
| 2-3 | パートナー向け請求（Stripe） | 月額課金の自動化 | 必須 |
| 2-4 | ダッシュボード（分析） | テナント数・ユーザー数・利用状況 | 高 |
| 2-5 | OGP/メタデータのブランド化 | `Share` → パートナーブランド名 | 高 |
| 2-6 | ファビコン差し替え | パートナー独自ファビコン | 高 |

### フェーズ3: 拡張機能

| # | 機能 | 説明 | 優先度 |
|---|------|------|--------|
| 3-1 | パートナー向けSuper Admin画面 | Share運営側でパートナーを一覧・管理 | 高 |
| 3-2 | 営業ツール提供 | テンプレート・デモアカウント機能 | 中 |
| 3-3 | NFCシール受発注連携 | パートナー経由の注文フロー | 中 |
| 3-4 | ログインページのブランド化 | パートナードメインでのログイン画面 | 中 |
| 3-5 | 利用レポート自動生成 | パートナーへの月次レポート配信 | 低 |

---

## 4. 実装詳細

### 4-1. カスタムドメインルーティング（middleware.ts）

現在のmiddleware.tsはパスベースのロール判定のみ。
パートナードメインからのアクセスを識別するロジックを追加する。

```typescript
// middleware.ts への追加ロジック（概念）
export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const mainDomain = 'sns-share.com';

  // パートナーのカスタムドメインかどうかを判定
  if (hostname !== mainDomain && !hostname.endsWith(`.${mainDomain}`)) {
    // カスタムドメイン → パートナー特定
    // 1. Edge Config or KV からドメイン→partnerId のマッピングを取得
    // 2. リクエストヘッダーに partnerId をセット
    // 3. 以降のページレンダリングでパートナーブランドを適用
    const partnerId = await resolvePartnerByDomain(hostname);
    if (partnerId) {
      request.headers.set('x-partner-id', partnerId);
    }
  }

  // 既存のダッシュボードルーティングロジック...
}
```

**ドメインマッピングの保存先候補:**

> ⚠️ middleware.tsはVercel Edge Runtimeで動作するため、**PrismaによるDB直接参照は不可能**。
> Edge Runtime対応の保存先を使用する必要がある。

- **Vercel Edge Config**（推奨）: 低レイテンシでmiddlewareから参照可能。パートナー追加時にEdge Configを更新するAPIを実装する
- **環境変数 + ビルド時生成**: パートナー数が少ないうちはこれで十分（10社未満）
- ~~Supabase DB直接参照~~: **不可**（Edge Runtimeでは Prisma Client が使えないため）

### 4-2. プロフィールページのブランド分離

`app/[slug]/page.tsx` に以下のロジックを追加：

```typescript
// ブランド解決の優先順位
function resolveBranding(user: User, tenant?: CorporateTenant, partner?: Partner) {
  // 1. パートナーブランド（最優先）
  if (partner) {
    return {
      brandName: partner.brandName,
      logoUrl: partner.logoUrl,
      primaryColor: partner.primaryColor,
      // OGPタイトル: `${user.name} | ${partner.brandName}`
    };
  }
  // 2. テナントブランド
  if (tenant) {
    return { /* 既存ロジック */ };
  }
  // 3. デフォルト（Share）
  return { brandName: 'Share', /* ... */ };
}
```

**ブランド分離対象:**

| 要素 | 現状 | ホワイトラベル後 |
|------|------|----------------|
| OGPタイトル | `{名前} \| Share` | `{名前} \| {パートナーブランド名}` |
| ヘッダーロゴ | Shareロゴ or テナントロゴ | パートナーロゴ |
| ヘッダーカラー | テナント設定 or デフォルト青 | パートナー設定色 |
| フッター | なし | パートナー社名（任意） |
| ファビコン | Share | パートナー設定 |

### 4-3. メール送信のブランド分離

`lib/email/index.ts` を拡張：

```typescript
// 現在
const FROM_NAME = process.env.FROM_NAME || 'Share';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@sns-share.com';

// 拡張後
interface EmailBrandContext {
  fromName: string;       // パートナーブランド名
  fromEmail: string;      // パートナーメールアドレス
  replyTo?: string;
  primaryColor: string;   // テンプレート内のアクセントカラー
  logoUrl?: string;
  supportEmail: string;
  companyName?: string;   // フッターの会社名
  companyAddress?: string;
}

async function sendBrandedEmail(
  data: EmailData,
  brandContext?: EmailBrandContext  // nullならデフォルト（Share）
) {
  const from = brandContext
    ? `${brandContext.fromName} <${brandContext.fromEmail}>`
    : `${FROM_NAME} <${FROM_EMAIL}>`;
  // ...
}
```

**注意点:**
- Resendでパートナードメインからメールを送信するには、パートナーのドメインをResendに追加・DNS検証が必要
- 初期段階では `noreply@sns-share.com` で差出人名のみ変更する運用も可
- 将来的にはパートナーごとにResendドメインを設定

### 4-4. パートナーダッシュボード

**ルート構造:**

```
/dashboard/partner/
├── page.tsx                    # ダッシュボードTOP（概要・KPI）
├── tenants/
│   ├── page.tsx                # テナント一覧
│   ├── new/page.tsx            # テナント新規作成
│   └── [tenantId]/
│       ├── page.tsx            # テナント詳細
│       └── users/page.tsx      # テナントユーザー一覧
├── branding/
│   └── page.tsx                # ブランド設定（ロゴ・カラー・ドメイン）
├── billing/
│   └── page.tsx                # 請求・プラン管理
└── settings/
    └── page.tsx                # アカウント設定
```

**ダッシュボードTOP KPI:**
- 総アカウント数 / 上限（プログレスバー）
- テナント数
- 今月の新規ユーザー数
- プロフィールページ閲覧数合計

**テナント作成フロー:**
1. パートナーがテナント名・管理者メールアドレスを入力
2. システムが `CorporateTenant` を作成（`partnerId` を自動セット）
3. 管理者にメール招待を送信（パートナーブランドで）
4. 管理者がサインアップ → テナント管理者として設定完了

### 4-5. アカウント数管理

```typescript
// パートナーのアカウント数を計算
async function countPartnerAccounts(partnerId: string): Promise<number> {
  // 1. パートナー配下の全テナントに属するユーザー数
  const tenantUsers = await prisma.user.count({
    where: { tenant: { partnerId } }
  });

  // 2. パートナー経由の個人ユーザー数
  const personalUsers = await prisma.user.count({
    where: { partnerId }
  });

  return tenantUsers + personalUsers;
}

// テナント作成・ユーザー招待時にチェック
async function checkAccountLimit(partnerId: string): Promise<boolean> {
  const partner = await prisma.partner.findUnique({ where: { id: partnerId } });
  const currentCount = await countPartnerAccounts(partnerId);
  return currentCount < partner.maxAccounts;
}
```

### 4-5-2. アカウント上限到達時のUX仕様

アカウント数がプラン上限に近づいた・到達した場合の具体的な挙動を定義する。

| 状態 | 挙動 |
|------|------|
| **上限の80%到達** | パートナーダッシュボードに警告バナーを表示。「アカウント数が上限に近づいています（240/300）。プランのアップグレードをご検討ください。」 |
| **上限の90%到達** | パートナー管理者に警告メールを自動送信（1回のみ）。ダッシュボードの警告バナーを赤色に変更。 |
| **上限到達（100%）** | 新規ユーザー招待・テナント作成が**ブロック**される。既存ユーザーの利用は制限しない。パートナー管理画面に「上限に達しました。プランをアップグレードするか、不要なアカウントを削除してください。」と表示。 |
| **上限超過（手動追加等で発生した場合）** | 既存ユーザーの利用は制限しない。新規追加のみブロック。 |

```typescript
// アカウント上限チェックの実装
async function checkAccountLimitWithWarning(partnerId: string) {
  const partner = await prisma.partner.findUnique({ where: { id: partnerId } });
  const currentCount = await countPartnerAccounts(partnerId);
  const ratio = currentCount / partner.maxAccounts;

  return {
    currentCount,
    maxAccounts: partner.maxAccounts,
    canAddMore: currentCount < partner.maxAccounts,
    warningLevel: ratio >= 0.9 ? 'critical' : ratio >= 0.8 ? 'warning' : 'normal',
  };
}
```

### 4-6. 認証フロー（auth.ts）の変更

```typescript
// JWT callbackへの追加
async jwt({ token, user }) {
  // ... 既存ロジック

  // partner-admin 判定を追加
  const partnerAdmin = await prisma.partner.findUnique({
    where: { adminUserId: dbUser.id, accountStatus: 'active' }
  });
  if (partnerAdmin) {
    token.role = 'partner-admin';
    token.partnerId = partnerAdmin.id;
    return token;
  }

  // ... 既存の admin / member / personal 判定
}
```

### 4-7. Vercelカスタムドメイン設定

パートナーがカスタムドメインを設定する際のフロー：

1. パートナーが管理画面でドメインを入力（例: `card.printcompany.co.jp`）
2. システムがVercel API経由でカスタムドメインを追加
3. DNS設定手順をパートナーに表示（CNAMEレコード）
4. パートナーがDNS設定を実施
5. Vercelが自動でSSL証明書を発行
6. `domainVerified` フラグを更新

```typescript
// Vercel API でカスタムドメイン追加
async function addCustomDomain(domain: string) {
  const res = await fetch(
    `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: domain }),
    }
  );
  return res.json();
}
```

---

## 5. データフロー図

### 5-1. パートナー経由のユーザーアクセス

```
エンドユーザー
  ↓ card.printcompany.co.jp/{slug} にアクセス
middleware.ts
  ↓ Host ヘッダーからパートナーを特定
  ↓ x-partner-id ヘッダーをセット
app/[slug]/page.tsx
  ↓ User → Tenant → Partner の順でDB参照
  ↓ パートナーブランドでレンダリング
エンドユーザー
  ← パートナーブランドのプロフィールページを表示
  （Shareの名前は一切見えない）
```

### 5-2. パートナー管理者のログインフロー

```
パートナー管理者
  ↓ sns-share.com/login（※初期は共通ログイン）
auth.ts JWT callback
  ↓ partner-admin ロールを付与
middleware.ts
  ↓ /dashboard → /dashboard/partner にリダイレクト
パートナーダッシュボード
  ← テナント管理・ブランド設定・分析画面
```

---

## 6. セキュリティ考慮事項

### 6-1. データ分離

- パートナー配下のテナント/ユーザーデータは `partnerId` でフィルタリング
- すべてのAPI呼び出しで `partnerId` の一致を検証
- パートナーAは、パートナーBのテナント・ユーザーデータに一切アクセス不可

### 6-2. 権限スコープ

```
partner-admin ができること:
  ✅ 自パートナー配下のテナントCRUD
  ✅ 自パートナー配下のユーザー一覧参照
  ✅ 自パートナーのブランディング変更
  ✅ 自パートナーの利用状況確認
  ❌ 他パートナーのデータ参照
  ❌ Share全体の管理操作
  ❌ プラン変更（Share運営側で実施）
```

### 6-3. カスタムドメインの検証

- DNS検証（TXTレコード or CNAME）でドメイン所有権を確認
- Vercelが自動でSSL/TLS証明書を発行・管理
- ドメイン未検証のパートナーはカスタムドメインが無効

---

## 7. 実装スケジュール（目安）

### フェーズ1: MVP（4〜5週間）

| 週 | タスク |
|----|--------|
| 1週目 | Prismaスキーマ追加・マイグレーション / `lib/auth/constants.ts` 作成 + `auth.ts`・`middleware.ts`・`app/dashboard/page.tsx` の admin判定ハードコード**5箇所**解消 / partner-admin ロール追加 / `lib/brand/config.ts` 作成 |
| 2週目 | middleware.ts拡張（ドメインルーティング・機能フラグ） / パートナーダッシュボード基本UI |
| 3週目 | テナントCRUD API（partnerId スコープ付き） / ブランディング設定 |
| 4週目 | プロフィールページのブランド分離 / カスタムドメイン対応 / テナント分離テスト |
| 5週目 | 法的/サポートページ4箇所のブランド動的化 / 既存ユーザー（`partnerId = null`）のリグレッションテスト |

> ※ v1.1見積もり（3〜4週間）から増加。理由: コードベース精査により、admin判定ハードコードが3ファイル5箇所に分散、法的/サポートページ4箇所のブランド対応追加、既存ユーザー（partnerId = null）のリグレッションテスト追加が判明。

### フェーズ2: 運用機能（3〜4週間）

| 週 | タスク |
|----|--------|
| 6週目 | アカウント数管理（上限UX含む） / メールテンプレートのブランド動的化（**10テンプレート以上、10〜14時間**） |
| 7週目 | CSPヘッダー環境変数化（`CSP_ALLOWED_DOMAINS` 対応含む） / PWA manifest Route Handler 動的生成 / OGP・ファビコン・`apple-mobile-web-app-title` 対応 |
| 8週目 | Stripe課金連携 / `app/layout.tsx` の `theme-color` 動的化 |
| 9週目 | 既存ユーザーへの影響リグレッションテスト（全フロー） / クロスパートナーアクセス防止テスト |

### フェーズ3: 拡張（随時）

| タスク | タイミング |
|--------|-----------|
| Share Super Admin画面（パートナー管理） | パートナー契約開始前 |
| 営業ツール・デモアカウント | 需要に応じて |
| NFCシール受発注連携 | 需要に応じて |
| ログインページのブランド化 | 需要に応じて |

---

## 8. Super Admin側の管理機能

Share運営（super-admin）が `/dashboard/admin/partners/` で管理する機能：

| 機能 | 説明 |
|------|------|
| パートナー一覧 | 全パートナーの状態・プラン・アカウント数 |
| パートナー作成 | 新規パートナーの初期設定・管理者招待 |
| プラン変更 | ベーシック ↔ プロ ↔ プレミアム |
| アカウント停止/再開 | 未払い時の停止処理 |
| 利用状況モニタリング | 全パートナーのアカウント数推移 |
| カスタムドメイン管理 | ドメイン検証状態の確認 |

---

## 9. 既存機能との互換性

### 影響を受ける既存ファイル

| ファイル | 変更内容 |
|----------|----------|
| `prisma/schema.prisma` | Partner / PartnerActivityLog モデル追加、CorporateTenant・User に partnerId 追加 |
| `auth.ts` | partner-admin ロール判定の追加。`admin@sns-share.com` ハードコード3箇所の環境変数化（後述9-2） |
| `auth.config.ts` | Session型に partnerId 追加 |
| `middleware.ts` | カスタムドメイン判定 + partner-admin ルーティング + `admin@sns-share.com` ハードコード1箇所の環境変数化（後述9-2） |
| `app/dashboard/page.tsx` | `admin@sns-share.com` ハードコード1箇所の環境変数化（後述9-2） |
| `app/[slug]/page.tsx` | パートナーブランドの解決ロジック追加 |
| `app/[slug]/page.tsx` (metadata) | OGPタイトルのブランド切り替え |
| `lib/email/index.ts` | EmailBrandContext 対応 |
| `lib/email/templates/*.ts` | テンプレートにブランドカラー・ロゴの動的切り替え（ハードコード箇所: ブランド名 `Share`・カラー `#3B82F6`・`support@sns-share.com`・`app.sns-share.com`・`株式会社Senrigan` が**10テンプレート以上**に分散: email-verification / invite-email / admin-notification / trial-ending / cancel-request / grace-period-expired / expense-approval / expense-approval-result / partner-inquiry / shipping-notification 等。所要**10〜14時間**） |
| `next.config.mjs` | CSPヘッダー内の `app.sns-share.com` 6箇所を環境変数化（後述9-3） |
| `public/manifest.json` → `app/api/manifest/route.ts` | PWA名 `"Share"` ・テーマカラーの動的生成対応。月額型では Route Handler でHostヘッダーからパートナーを特定して動的返却（後述9-4） |
| `app/layout.tsx` | ファビコン・タイトル `'Share'`・`apple-mobile-web-app-title` `content="Share"`・`theme-color` `#3B82F6` の動的化 |
| `app/company/about/page.tsx` | `info@sns-share.com` のブランド動的化 |
| `app/support/contact/ContactPageContent.tsx` | `support@sns-share.com` のブランド動的化 |
| `app/legal/transactions/page.tsx` | `info@sns-share.com` のブランド動的化 |
| `app/legal/privacy/page.tsx` | `privacy@sns-share.com` のブランド動的化 |

### 影響を受けない既存ファイル

- `/dashboard/corporate/` 以下（テナント管理者用ダッシュボード）
- `/dashboard/corporate-member/` 以下（メンバー用ダッシュボード）
- `lib/corporateAccess/` 以下（アクセス制御ロジック）
- NFCシール注文フロー（OneTapSeal関連）
- 財務管理機能

### 9-2. admin判定のハードコード対応

`admin@sns-share.com` のハードコードが**3ファイル・計5箇所**に分散しており、すべて修正が必要：

| ファイル | 行 | 現在のコード | 修正方針 |
|----------|-----|------------|----------|
| `auth.ts` | 142 | `email === 'admin@sns-share.com'` | 環境変数 `SUPER_ADMIN_EMAIL` に変更 |
| `auth.ts` | 274 | `userEmail === 'admin@sns-share.com'` | 同上 |
| `auth.ts` | 277 | `userEmail.endsWith('@sns-share.com')` | 環境変数 `ADMIN_EMAIL_DOMAIN` に変更 |
| `middleware.ts` | 54 | `userEmail === 'admin@sns-share.com'` | 環境変数 `SUPER_ADMIN_EMAIL` に変更 |
| `app/dashboard/page.tsx` | 72 | `session.user?.email === 'admin@sns-share.com'` | 環境変数 `SUPER_ADMIN_EMAIL` に変更 |

```typescript
// lib/auth/constants.ts（新規: 共通定数として切り出し）
export const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'admin@sns-share.com';
export const ADMIN_EMAIL_DOMAIN = process.env.ADMIN_EMAIL_DOMAIN || '@sns-share.com';

// auth.ts / middleware.ts / app/dashboard/page.tsx で共通参照
// → ハードコードの分散を防ぎ、環境変数1箇所で制御

// super-admin判定
if (userEmail === SUPER_ADMIN_EMAIL) {
  token.role = 'super-admin';
} else if (userEmail.endsWith(ADMIN_EMAIL_DOMAIN) && ...) {
  token.role = 'financial-admin';
}
```

### 9-3. CSPヘッダーのハードコード対応

`next.config.mjs` のCSPヘッダーに `https://app.sns-share.com` が**6箇所**ハードコードされている（行6, 58, 59, 60, 61, 63）。

> ⚠️ **月額型と買取型でアプローチが異なる:**
> - **買取型**: 各Vercelプロジェクトで `NEXT_PUBLIC_APP_URL` を設定すればOK（1ドメイン）
> - **月額型**: 同一アプリに複数パートナードメインが同居するため、**CSPに全パートナードメインを許可する**必要がある

```javascript
// next.config.mjs 修正方針
const appDomain = process.env.NEXT_PUBLIC_APP_URL || 'https://app.sns-share.com';

// 月額型: パートナーのカスタムドメインをCSPに追加
// 環境変数 CSP_ALLOWED_DOMAINS にスペース区切りで全パートナードメインを設定
// 例: CSP_ALLOWED_DOMAINS="https://card.printcompany.co.jp https://meishi.webagency.co.jp"
const additionalDomains = process.env.CSP_ALLOWED_DOMAINS || '';
const cspDomains = `${appDomain} ${additionalDomains}`.trim();

// CSPヘッダー内で動的に参照
`script-src 'self' 'unsafe-inline' 'unsafe-eval' ${cspDomains} ...`,
`script-src-elem 'self' 'unsafe-inline' ${cspDomains} ...`,
`style-src 'self' 'unsafe-inline' ${cspDomains} ...`,
`font-src 'self' ${cspDomains} ...`,
`connect-src 'self' ${cspDomains} ...`,
// ... 計6箇所を置換
```

> **運用注意:** パートナー追加時に `CSP_ALLOWED_DOMAINS` を更新し、Vercelの再デプロイが必要。
> パートナー数が増加した場合は、`'self'` のみでCSPを構成し、外部ドメイン参照を排除するリファクタリングも検討する。

### 9-4. PWA manifest.json の動的生成

`public/manifest.json` に `"name": "Share"` がハードコードされている。
パートナードメインでアクセスした際にパートナーブランド名を表示するため、
動的に `manifest.json` を生成する必要がある。

> ⚠️ **月額型と買取型でアプローチが異なる:**
> - **買取型**: `app/manifest.ts`（Next.js 15 の manifest generation）で十分。環境変数は各Vercelプロジェクトで固定のため、ビルド時に1つのmanifestを生成すればよい。
> - **月額型**: 同一アプリに複数パートナーが同居するため、`app/manifest.ts` ではパートナーごとに切り替えられない。**Route Handler** でリクエストの Host ヘッダーからパートナーを特定し、動的に返却する必要がある。

```typescript
// app/api/manifest/route.ts（月額型: Route Handler で動的生成）
import { NextRequest, NextResponse } from 'next/server';
import { resolveBrandByHostname } from '@/lib/brand/resolve';

export async function GET(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const brand = await resolveBrandByHostname(hostname);

  const manifest = {
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

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600', // 1時間キャッシュ
    },
  });
}
```

```typescript
// app/layout.tsx のmanifestリンクを動的に変更
// public/manifest.json → /api/manifest に変更
<link rel="manifest" href="/api/manifest" />
```

> **注意**: `public/manifest.json` は削除し、`app/layout.tsx` の manifest リンク先を `/api/manifest` に変更する。
> 買取型では `app/manifest.ts` でも動作するが、月額型との共通化のため Route Handler に統一することを推奨。

### 9-5. テナント分離ロジックの補強

パートナードメインでログインしたユーザーが、他パートナーのテナントにアクセスできないよう、
認証チェーンに `partnerId` スコープを追加する必要がある。

```typescript
// auth.ts JWT callback 追加ロジック
// partner-admin がテナントを操作する際に partnerId 一致を検証

// middleware.ts 追加ロジック
// x-partner-id ヘッダーから取得した partnerId と、
// セッションの partnerId が一致しない場合はアクセス拒否

// API Route 全般
// パートナー配下のテナント操作時に必ず partnerId の一致を検証
async function verifyPartnerScope(session: Session, tenantId: string) {
  const tenant = await prisma.corporateTenant.findUnique({
    where: { id: tenantId },
    select: { partnerId: true },
  });
  if (tenant?.partnerId !== session.partnerId) {
    throw new Error('Access denied: tenant belongs to another partner');
  }
}
```

> ⚠️ **既存ユーザー（`partnerId = null`）への影響に注意:**
> Partner モデル追加後、既存の全 `CorporateTenant` と `User` は `partnerId = null` になる。
> この状態で以下が正常動作することをリグレッションテストで確認する必要がある:
> - ログイン・セッション管理（`partnerId` が null でも JWT callback がエラーにならない）
> - テナント操作（`partnerId = null` のテナントに対する既存 API が動作する）
> - プロフィールページ表示（パートナー未所属ユーザーのページが正常に Share ブランドで表示される）
> - メール送信（パートナー未所属ユーザーへのメールがデフォルトの Share ブランドで送信される）
> - `verifyPartnerScope` は **partner-admin ロールのリクエスト時のみ**適用し、既存ロール（admin / member / personal）では呼び出さないこと

---

## 10. パートナーが準備するもの

### 10-1. 契約時に必要なもの

| # | 項目 | 詳細 | 形式 | 必須 |
|---|------|------|------|------|
| 1 | **会社名** | 正式法人名（フッター・契約書に使用） | テキスト | 必須 |
| 2 | **サービスブランド名** | エンドユーザーに見せるサービス名（例:「デジカード」） | テキスト | 必須 |
| 3 | **ロゴ画像** | 横長推奨、背景透過 | PNG or SVG、幅800px以上 | 必須 |
| 4 | **ファビコン** | ブラウザタブに表示されるアイコン | PNG 32×32px 以上 or ICO | 必須 |
| 5 | **ブランドカラー（メイン）** | ヘッダー・ボタン等に使用 | HEXカラーコード（例: #1B2A4A） | 必須 |
| 6 | **ブランドカラー（サブ）** | アクセント部分に使用 | HEXカラーコード | 任意 |
| 7 | **管理者メールアドレス** | パートナー管理画面にログインするアカウント | メールアドレス | 必須 |
| 8 | **サポート用メールアドレス** | エンドユーザーからの問い合わせ先 | メールアドレス | 必須 |
| 9 | **独自ドメイン** | エンドユーザーがアクセスするURL（例: card.example.co.jp） | ドメイン名 | 必須 |
| 10 | **請求先情報** | 月額料金の請求先 | 会社名・担当者・メール | 必須 |

### 10-2. ドメイン設定時にパートナーが行う作業

| # | 作業 | 手順 | 所要時間 |
|---|------|------|----------|
| 1 | **CNAMEレコード追加** | ドメイン管理画面で `card.example.co.jp` → `cname.vercel-dns.com` を設定 | 5分（反映まで最大48時間） |
| 2 | **メール用DNSレコード追加**（任意） | パートナードメインからメール送信する場合、SPF/DKIMレコードを追加 | 10分（反映まで最大48時間） |

※ DNS設定の具体的な手順書はShare側から提供する

### 10-3. 運用開始後にパートナーが行うこと

| 作業 | 説明 |
|------|------|
| テナント（顧客企業）の作成 | パートナー管理画面から顧客企業を登録 |
| テナント管理者の招待 | 顧客企業の担当者にメール招待を送信 |
| エンドユーザーへの案内 | 自社ブランドとして営業・サポート |
| 月額料金の支払い | Stripe自動課金 or 請求書払い |

---

## 11. 運用手順（パートナー追加時のShare側作業）

### 11-1. 作業フロー

```
1. パートナー情報の受領・確認
   │  ├── セクション10-1の項目がすべて揃っているか
   │  └── ロゴ・ファビコンの画像品質チェック
   │
2. Share管理画面でパートナー作成
   │  ├── /dashboard/admin/partners/new にアクセス
   │  ├── ブランド名・ロゴ・カラー・プランを入力
   │  ├── 管理者メールアドレスを入力
   │  └── 保存 → 招待メールが自動送信される
   │
3. Vercelカスタムドメイン追加
   │  ├── Vercel管理画面 → share-production → Settings → Domains
   │  ├── パートナーのドメインを追加
   │  └── パートナーにDNS設定手順を送付
   │
4. 外部サービスのドメイン登録
   │  ├── Google reCAPTCHA: パートナードメインを許可ドメインに追加
   │  ├── Google OAuth: GCPコンソールでリダイレクトURIにパートナードメインを追加
   │  └── Edge Config（使用時）: ドメイン→partnerId のマッピングを追加
   │
5. メール送信ドメイン設定（パートナードメインで送信する場合）
   │  ├── Resend管理画面でドメイン追加（※Resendプランのドメイン数上限に注意）
   │  ├── パートナーにDNSレコード（SPF/DKIM）追加を依頼
   │  └── Resend側でDNS検証完了を確認
   │
6. 動作確認（セクション11-2のチェックリスト）
   │
7. パートナーへ引き渡し（セクション11-3の引き渡し物）
```

> ⚠️ **Resendのドメイン数制限に注意:** Resend Proプランではドメイン数に上限がある。
> パートナー数が増加する場合、プランのアップグレードが必要になる可能性がある。
> パートナー10社を超える見込み時点でResendの上位プランへの移行を検討すること。

### 11-2. 動作確認チェックリスト

| # | 確認項目 | 確認方法 | 合格基準 |
|---|---------|----------|----------|
| 1 | カスタムドメインでアクセス | `https://card.example.co.jp` をブラウザで開く | SSL証明書が有効でページが表示される |
| 2 | ブランドロゴ表示 | プロフィールページのヘッダーを確認 | パートナーのロゴが正しいサイズで表示 |
| 3 | ブランドカラー | ヘッダー・ボタンの色を確認 | 指定のブランドカラーが適用されている |
| 4 | OGPメタデータ | SNSシェアプレビュー or og:titleを確認 | `{ユーザー名} \| {パートナーブランド名}` になっている |
| 5 | ファビコン | ブラウザタブを確認 | パートナーのファビコンが表示 |
| 6 | 「Share」の文字 | ページ全体をテキスト検索 | プロフィールページに「Share」の文字が表示されない |
| 7 | メール通知 | テストユーザーで招待メールを送信 | 差出人名・ヘッダーロゴ・フッター会社名がパートナーブランド |
| 8 | パートナー管理画面 | パートナー管理者でログイン | /dashboard/partner/ が表示され、テナントCRUDが動作 |
| 9 | テナント作成 | パートナー管理画面からテナントを1つ作成 | テナントが作成され、管理者招待メールが送信される |
| 10 | アカウント数表示 | パートナーダッシュボードのKPIを確認 | 現在のアカウント数 / 上限が正しく表示 |
| 11 | reCAPTCHA動作 | パートナードメインでメール+パスワードログインを試行 | reCAPTCHAが正常に動作し、ログイン完了 |
| 12 | Google OAuth | パートナードメインでGoogleログインを試行 | リダイレクト先がパートナードメインで正常にログイン完了 |
| 13 | PWA manifest | ブラウザ DevTools → Application → Manifest を確認 | パートナーブランド名・テーマカラーが反映されている |
| 14 | CSPエラー | ブラウザ DevTools → Console でCSP違反がないか確認 | CSP関連のエラーが表示されない |
| 15 | テナント分離 | 他パートナーのテナントIDでAPIを直接叩く | アクセス拒否される（403） |
| 16 | 会社概要ページ | `/company/about` にアクセス | パートナーの会社情報が表示される。`info@sns-share.com` が表示されない |
| 17 | お問い合わせページ | `/support/contact` にアクセス | パートナーのサポートメールが表示される。`support@sns-share.com` が表示されない |
| 18 | 特定商取引法ページ | `/legal/transactions` にアクセス | パートナーの情報が表示される。`info@sns-share.com` が表示されない |
| 19 | プライバシーポリシーページ | `/legal/privacy` にアクセス | パートナーの情報が表示される。`privacy@sns-share.com` が表示されない |
| 20 | `apple-mobile-web-app-title` | ブラウザ DevTools → Elements → head 内を確認 | パートナーブランド名が設定されている（`Share` ではない） |
| 21 | メールテンプレート網羅確認 | 全種類のメール（招待・認証・通知・解約・トライアル終了・経費承認等、**全10種以上**）の本文を目視確認 | `Share`・`sns-share.com`・`株式会社Senrigan`・広島の住所が一切表示されない |
| 22 | 既存ユーザー（partnerId=null）影響 | Share本体のユーザーでログイン・プロフィール表示・メール送信を実行 | partnerId が null のユーザーでも全機能が正常動作する |

### 11-3. パートナーへの引き渡し物

| # | 引き渡し物 | 形式 | 説明 |
|---|-----------|------|------|
| 1 | **管理者アカウント** | メール招待 | パートナー管理画面へのログイン情報（招待メールで送信済み） |
| 2 | **操作マニュアル** | PDF or オンライン | テナント作成・ユーザー招待・ブランド設定の手順 |
| 3 | **営業ツール一式** | PDF | 提案書テンプレート・営業トーク台本 |
| 4 | **デモ用アカウント** | メール | 営業時にエンドユーザーに見せるデモプロフィール |
| 5 | **サポート連絡先** | メール | 技術サポートの問い合わせ先 |
| 6 | **DNS設定手順書** | PDF or メール | ドメイン設定の具体的な手順（スクリーンショット付き） |

---

## 12. 未決事項・検討課題

| # | 課題 | 選択肢 | 推奨 |
|---|------|--------|------|
| 1 | パートナーのログインURL | (a) 共通ログイン (b) パートナードメインでログイン | フェーズ1は(a)、フェーズ3で(b) |
| 2 | エンドユーザーの認証 | (a) Share共通認証 (b) パートナードメインで認証 | (a)で開始、Google OAuthのリダイレクト先はShareドメイン |
| 3 | パートナーのメール送信元 | (a) Share代行 (b) パートナー独自ドメイン | フェーズ1は(a)差出人名のみ変更、フェーズ2で(b) |
| 4 | Stripeの請求主体 | (a) Shareが請求 (b) Stripe Connect | (a) 通常のSubscription |
| 5 | パートナー配下の個人ユーザー | (a) 対応する (b) 法人テナントのみ | (b) MVP時点では法人テナントのみ |
| 6 | ドメインマッピングの保存先 | (a) Edge Config (b) ビルド時生成 | パートナー数が少ないうちは(b)、増えたら(a)。※DB直接はEdge Runtime非対応のため不可 |
| 7 | トライアル期間の仕様 | (a) 3ヶ月無料 (b) 1ヶ月無料 | LPに合わせ(a) 3ヶ月 |
| 8 | Google OAuthリダイレクトURI管理 | (a) 手動追加 (b) ワイルドカード (c) 独自OAuth Proxy | パートナー10社未満は(a)手動。10社超で(c)を検討。GCPはワイルドカード非対応のため(b)は不可 |
| 9 | Resendプラン | (a) 現行プランのまま (b) アップグレード | パートナー10社到達前にドメイン数上限を確認し判断 |
| 10 | 既存ユーザーへの影響テスト | (a) 手動テスト (b) E2Eテスト自動化 | (a)で開始し、ブランド分岐導入後に主要フローのE2Eを追加 |
| 11 | 法的ページの表示方針 | (a) 全パートナー共通（Share法的ページ） (b) パートナーごとにブランド切り替え (c) パートナーの外部URLにリダイレクト | **(b)** パートナーの会社名・メールアドレスで表示。買取型では(c)も選択可 |
| 12 | CSP_ALLOWED_DOMAINS の管理 | (a) 手動で環境変数を更新 (b) パートナー追加APIで自動更新 | パートナー数が少ないうちは(a)、増えたらVercel APIで(b)を自動化 |
| 13 | PWA manifest の統一方針 | (a) 買取型: app/manifest.ts / 月額型: Route Handler (b) 両方 Route Handler に統一 | **(b)** 統一することでコードの分岐を減らす |
