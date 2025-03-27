# ShareMVPの技術設計とデータモデル

## 1. 技術スタック選定

### 1.1 フロントエンド

#### 1.1.1 主要ライブラリ/フレームワーク
- **Next.js 14+**: Reactベースのフレームワーク（App Routerを採用）
- **React 18+**: UIコンポーネントライブラリ
- **TypeScript**: 型安全性の確保
- **Tailwind CSS**: ユーティリティファーストのCSSフレームワーク
- **React Hook Form**: フォーム処理と検証
- **Zod**: スキーマ検証ライブラリ
- **Jotai/Zustand**: シンプルな状態管理（Reduxは複雑すぎる可能性あり）

#### 1.1.2 UIコンポーネント
- **Headless UI**: アクセシビリティを考慮したUI基本コンポーネント
- **Radix UI**: 高度なUIコンポーネント（ドロップダウン、モーダル等）
- **React DnD**: ドラッグ＆ドロップ機能（SNSアイコンの並べ替え用）
- **React QR Code**: QRコード生成

#### 1.1.3 アイコンとビジュアル
- **React Icons**: 汎用アイコンライブラリ
- **カスタムSVGアイコン**: SNS専用アイコンセット（メインカラー対応）
- **CSS変数**: カラーテーマのためのCSS変数実装

### 1.2 バックエンド

#### 1.2.1 サーバーとAPI
- **Next.js API Routes**: サーバーレスAPIエンドポイント
- **NextAuth.js**: 認証システム（OAuth、メール認証）
- **Prisma**: タイプセーフなORMでデータベース操作

#### 1.2.2 データストレージ
- **PostgreSQL**: リレーショナルデータベース
- **Vercel Postgres**: ホスティングされたPostgreSQLサービス
- **Cloudinary/Uploadthing**: メディアストレージ（プロフィール画像）

#### 1.2.3 支払い処理
- **Stripe**: サブスクリプション管理と支払い処理

### 1.3 インフラストラクチャ

#### 1.3.1 ホスティングとデプロイ
- **Vercel**: Next.jsアプリケーションのホスティングとデプロイ
- **GitHub Actions**: CI/CDパイプライン

#### 1.3.2 モニタリングとログ
- **Vercel Analytics**: ユーザー行動と性能分析
- **Sentry**: エラートラッキングと監視

## 2. データモデル設計

### 2.1 コアエンティティ

#### 2.1.1 ユーザー (User)
```prisma
model User {
  id              String    @id @default(cuid())
  email           String    @unique
  name            String?
  nameEn          String?
  password        String?   // ハッシュ化されたパスワード、OAuthの場合はnull
  image           String?   // プロフィール画像URL
  bio             String?   // 自己紹介
  mainColor       String    @default("#3B82F6") // デフォルトは青
  phone           String?   // 電話番号
  company         String?   // 会社/組織名
  
  // 認証関連
  emailVerified   DateTime?
  accounts        Account[]
  
  // プロフィール関連
  profile         Profile?
  customLinks     CustomLink[]
  snsLinks        SnsLink[]
  
  // サブスクリプション関連
  subscriptionId  String?   // Stripeサブスクリプション識別子
  trialEndsAt     DateTime? // 無料トライアル終了日
  subscriptionStatus String? // active, trialing, canceled, pastDue
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

#### 2.1.2 プロフィール (Profile)
```prisma
model Profile {
  id              String    @id @default(cuid())
  userId          String    @unique
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  slug            String    @unique // カスタムURLスラッグ（12345）
  views           Int       @default(0) // プロフィール閲覧数
  isPublic        Boolean   @default(true)
  lastAccessed    DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

#### 2.1.3 SNSリンク (SnsLink)
```prisma
model SnsLink {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  platform        String    // 'line', 'youtube', 'x', 'instagram', 等
  username        String?   // ユーザー名
  url             String    // 完全なURL
  displayOrder    Int       // 表示順序（並べ替え用）
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@unique([userId, platform]) // 1ユーザーあたり各プラットフォーム1つまで
}
```

#### 2.1.4 カスタムリンク (CustomLink)
```prisma
model CustomLink {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  name            String    // リンクの表示名
  url             String    // URL
  displayOrder    Int       // 表示順序
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

#### 2.1.5 認証関連 (Account)
```prisma
model Account {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  type            String    // oauth, email
  provider        String    // google, apple, email
  providerAccountId String?
  refresh_token   String?
  access_token    String?
  expires_at      Int?
  token_type      String?
  scope           String?
  id_token        String?
  session_state   String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@unique([provider, providerAccountId])
}
```

### 2.2 列挙型とリレーション

#### 2.2.1 SNSプラットフォーム定義
```typescript
// types/sns.ts
export const SNS_PLATFORMS = [
  'line',
  'youtube',
  'x',
  'instagram',
  'tiktok',
  'facebook',
  'pinterest',
  'pixiv',
  'threads',
  'skype',
  'note',
  'whatsapp'
] as const;

export type SnsPlatform = typeof SNS_PLATFORMS[number];

export interface SnsMetadata {
  name: string;
  icon: string;
  baseUrl: string;
  placeholderText: string;
  helpText: string;
}

export const SNS_METADATA: Record<SnsPlatform, SnsMetadata> = {
  line: {
    name: 'LINE',
    icon: 'line-icon.svg',
    baseUrl: 'https://line.me/ti/p/',
    placeholderText: 'LINEユーザーID',
    helpText: 'LINE アプリ設定→アカウント→ID から取得できます'
  },
  youtube: {
    name: 'YouTube',
    icon: 'youtube-icon.svg',
    baseUrl: 'https://www.youtube.com/channel/',
    placeholderText: 'YouTubeチャンネルURL',
    helpText: 'YouTubeチャンネルページのURLを貼り付けてください'
  },
  x: {
    name: 'X',
    icon: 'x-icon.svg',
    baseUrl: 'https://x.com/',
    placeholderText: 'Xのユーザー名 (@なし)',
    helpText: 'Xのプロフィールページを開き、URLからユーザー名をコピーしてください'
  },
  // 他のSNSも同様に定義...
};
```

## 3. API設計

### 3.1 認証API

#### 3.1.1 ユーザー登録
- **エンドポイント**: `POST /api/auth/register`
- **ペイロード**:
  ```typescript
  {
    email: string;
    password: string;
    name?: string;
  }
  ```
- **レスポンス**:
  ```typescript
  {
    success: boolean;
    message: string;
    userId?: string;
  }
  ```

#### 3.1.2 ログイン
- NextAuth.jsの標準エンドポイントを使用
- **エンドポイント**: `POST /api/auth/signin`

### 3.2 プロフィール管理API

#### 3.2.1 プロフィール取得
- **エンドポイント**: `GET /api/profile`
- **レスポンス**:
  ```typescript
  {
    user: {
      name: string;
      nameEn: string;
      image: string;
      bio: string;
      mainColor: string;
      phone: string;
      company: string;
    };
    profile: {
      slug: string;
      isPublic: boolean;
    };
    snsLinks: Array<{
      platform: string;
      username: string;
      url: string;
      displayOrder: number;
    }>;
    customLinks: Array<{
      name: string;
      url: string;
      displayOrder: number;
    }>;
  }
  ```

#### 3.2.2 プロフィール更新
- **エンドポイント**: `PUT /api/profile`
- **ペイロード**: プロフィール情報

#### 3.2.3 プロフィール画像アップロード
- **エンドポイント**: `POST /api/profile/image`
- **ペイロード**: マルチパートフォームデータ

### 3.3 SNSリンク管理API

#### 3.3.1 SNSリンク取得
- **エンドポイント**: `GET /api/links/sns`

#### 3.3.2 SNSリンク追加/更新
- **エンドポイント**: `POST /api/links/sns`
- **ペイロード**:
  ```typescript
  {
    platform: string;
    username?: string;
    url: string;
  }
  ```

#### 3.3.3 SNSリンク削除
- **エンドポイント**: `DELETE /api/links/sns/{platform}`

#### 3.3.4 SNSリンク順序更新
- **エンドポイント**: `PUT /api/links/sns/order`
- **ペイロード**:
  ```typescript
  {
    platforms: string[]; // 順序付けされたプラットフォーム配列
  }
  ```

### 3.4 カスタムリンク管理API

#### 3.4.1 カスタムリンク追加
- **エンドポイント**: `POST /api/links/custom`
- **ペイロード**:
  ```typescript
  {
    name: string;
    url: string;
  }
  ```

#### 3.4.2 カスタムリンク更新
- **エンドポイント**: `PUT /api/links/custom/{id}`

#### 3.4.3 カスタムリンク削除
- **エンドポイント**: `DELETE /api/links/custom/{id}`

### 3.5 公開プロフィール表示API

#### 3.5.1 スラグによるプロフィール取得
- **エンドポイント**: `GET /api/public/{slug}`
- **レスポンス**: 公開用プロフィール情報

## 4. コンポーネント構造

### 4.1 ページコンポーネント

```
app/
├── page.tsx                  # ランディングページ
├── auth/
│   ├── signin/page.tsx       # ログインページ
│   ├── signup/page.tsx       # 登録ページ
│   └── verify/page.tsx       # メール確認ページ
├── dashboard/
│   ├── page.tsx              # ダッシュボードメイン（プロフィールプレビュー）
│   ├── profile/page.tsx      # プロフィール編集
│   ├── links/page.tsx        # SNS・カスタムリンク管理
│   ├── design/page.tsx       # デザインカスタマイズ
│   ├── share/page.tsx        # 共有設定・QRコード
│   └── subscription/page.tsx # サブスクリプション管理
└── [slug]/
    └── page.tsx              # 公開プロフィール表示ページ
```

### 4.2 共通コンポーネント

```
components/
├── layout/
│   ├── Header.tsx            # ヘッダー
│   ├── Sidebar.tsx           # サイドバー（ダッシュボード用）
│   ├── Footer.tsx            # フッター
│   └── AuthLayout.tsx        # 認証ページ用レイアウト
├── ui/
│   ├── Button.tsx            # ボタン
│   ├── Input.tsx             # 入力フィールド
│   ├── ColorPicker.tsx       # カラーピッカー
│   ├── Modal.tsx             # モーダル
│   └── Card.tsx              # カードコンポーネント
├── forms/
│   ├── ProfileForm.tsx       # プロフィール編集フォーム
│   ├── SnsLinkForm.tsx       # SNSリンク追加フォーム
│   └── CustomLinkForm.tsx    # カスタムリンク追加フォーム
├── profile/
│   ├── ProfileCard.tsx       # プロフィールカード
│   ├── SnsGrid.tsx           # SNSアイコングリッド
│   ├── ContactButtons.tsx    # 連絡先ボタン
│   └── QrCode.tsx            # QRコード表示
├── dashboard/
│   ├── LinkManager.tsx       # リンク管理コンポーネント
│   ├── ProfilePreview.tsx    # プロフィールプレビュー
│   └── ColorCustomizer.tsx   # カラーカスタマイズツール
└── shared/
    ├── SnsIcon.tsx           # SNSアイコン（メインカラー対応）
    ├── LoadingSpinner.tsx    # ローディングインジケータ
    ├── ErrorMessage.tsx      # エラーメッセージ
    └── HelpTooltip.tsx       # ヘルプツールチップ
```

## 5. インフラストラクチャとデプロイ

### 5.1 デプロイ環境

#### 5.1.1 開発環境
- **ローカル開発**: `next dev`
- **ステージング**: Vercel Previewデプロイメント（PRごと）

#### 5.1.2 本番環境
- **ホスティング**: Vercel
- **ドメイン**: app.sns-share.com
- **データベース**: Vercel Postgres
- **ストレージ**: Cloudinary

### 5.2 CI/CDパイプライン

- **コード品質**: ESLint, Prettier
- **型チェック**: TypeScript
- **テスト**: Jest, React Testing Library
- **デプロイ**:
  - GitHub PR作成時にプレビューデプロイ
  - `main`ブランチマージ時に本番デプロイ

## 6. MVPのフェーズ分けと実装スケジュール

### 6.1 フェーズ1: 基盤構築（2週間）

- プロジェクトセットアップ（Next.js, TypeScript, Tailwind）
- 認証システム実装（NextAuth.js）
- データベースセットアップ（Prisma, PostgreSQL）
- 基本的なUI/UXコンポーネント作成

### 6.2 フェーズ2: コア機能実装（3週間）

- ユーザープロフィール編集機能
- SNSリンク管理機能（設定、削除、並べ替え）
- カスタムリンク機能
- プロフィールカードのUI実装
- 基本的なカラーカスタマイズ機能

### 6.3 フェーズ3: 共有機能と最適化（2週間）

- QRコード生成機能
- 共有リンク生成
- 端末識別と最適化
- プロフィール閲覧ページの実装

### 6.4 フェーズ4: サブスクリプションと仕上げ（2週間）

- Stripe連携
- 7日間トライアル機能
- UI/UXの洗練
- テストとバグ修正
- 本番環境へのデプロイ

## 7. 技術的な検討事項と対策

### 7.1 パフォーマンス最適化

- 画像最適化（Next.js Image、Cloudinary変換）
- コンポーネントの遅延ロード（React.lazy, Suspense）
- バンドルサイズの最適化（Webpackバンドル分析）
- API応答のキャッシュ（SWR, React Query）

### 7.2 セキュリティ対策

- 入力検証（Zod）
- XSS対策（ユーザー入力のサニタイズ）
- CSRFトークン（NextAuth.js組み込み）
- API認証（JWTトークン）
- 環境変数管理（Vercel環境変数）

### 7.3 SEO対策

- メタタグ最適化（Next.js Head）
- OGP（Open Graph Protocol）設定
- サイトマップ生成
- 構造化データ（JSON-LD）

### 7.4 アクセシビリティ

- セマンティックHTML
- WAI-ARIAの適切な使用
- キーボードナビゲーション
- コントラスト比の確保（WCAG 2.1 AA準拠）

## 8. 将来の拡張性を考慮した設計ポイント

- モジュラーなコンポーネント構造
- サーバーコンポーネントとクライアントコンポーネントの適切な分離
- 将来の機能追加を見越したデータモデル設計
- 国際化対応の基盤準備（next-intl）
- APIのバージョニング基盤
- 機能フラグシステムの検討（機能の段階的リリース用）
