# Share法人プラン専用個人ダッシュボード実装計画書

## 1. 現状分析

### 1.1 現在の法人機能構成

現在のShareアプリケーションには以下の主要な法人関連機能が実装されています：

- 法人ダッシュボード（管理者向け機能）
- 法人プロフィール機能（`/dashboard/corporate-profile/`）
- 法人アクセス権管理システム（`corporateAccessState.ts`）
- テナントとユーザーの関連付け（Prismaスキーマ）

### 1.2 現状の課題

1. 一般の個人ダッシュボードと法人ユーザー向けダッシュボードが明確に分離されていない
2. 法人テナントのブランディング（カラー、ロゴなど）が個人プロフィールに統合されていない
3. 法人共通のSNSリンクと個人のSNSリンクの統合管理が必要
4. ユーザー権限（管理者/一般メンバー）に応じた機能制限の実装が必要

## 2. 実装目標

法人プラン専用の個人ダッシュボードを作成し、以下の機能を提供する：

1. 法人テナントのブランディングを反映したUI
2. 法人共通SNSと個人SNSの統合管理
3. 部署・役職情報の表示と管理
4. 法人テナントに所属するメンバーとしての適切な権限管理
5. 法人管理者と一般メンバーの機能差別化

## 3. 実装計画

### 3.1 ファイル構成と実装順序

#### フェーズ1: 基本構造の実装（1週間）

1. **ルーティングとレイアウト**
   - `app/dashboard/corporate-member/layout.tsx` - 法人メンバー用レイアウト
   - `app/dashboard/corporate-member/page.tsx` - メインダッシュボードページ

2. **アクセス制御コンポーネント**
   - `components/guards/CorporateMemberGuard.tsx` - 法人メンバー専用ページの保護

3. **リダイレクトロジック**
   - `middleware.ts`の更新 - 法人メンバーのルート振り分け

4. **ナビゲーション更新**
   - `components/layout/Sidebar.tsx`の更新 - 法人メンバー用メニュー表示
   - `components/layout/MobileMenuButton.tsx`の更新 - モバイル表示の対応

#### フェーズ2: プロフィール管理機能（2週間）

1. **プロフィールデータ取得・更新API**
   - `app/api/corporate-member/profile/route.ts` - プロフィールデータ取得API
   - `app/api/corporate-member/profile/update/route.ts` - プロフィール更新API

2. **プロフィール編集画面**
   - `app/dashboard/corporate-member/profile/page.tsx` - プロフィール編集ページ
   - `components/corporate/MemberProfileForm.tsx` - 法人メンバー用プロフィール編集フォーム

3. **共通コンポーネント**
   - `components/ui/CorporateBranding.tsx` - 法人ブランディング適用コンポーネント
   - `components/ui/DepartmentBadge.tsx` - 部署表示バッジ

#### フェーズ3: SNS・リンク管理機能（2週間）

1. **データ取得・更新API**
   - `app/api/corporate-member/links/route.ts` - リンク情報取得API
   - `app/api/corporate-member/links/sns/[id]/route.ts` - SNSリンク更新API
   - `app/api/corporate-member/links/custom/[id]/route.ts` - カスタムリンク更新API

2. **SNS管理画面**
   - `app/dashboard/corporate-member/links/page.tsx` - リンク管理ページ
   - `components/corporate/CorporateSnsIntegration.tsx` - 法人・個人SNS統合管理コンポーネント
   - `components/corporate/MemberSnsManager.tsx` - メンバー用SNS管理コンポーネント

#### フェーズ4: デザイン設定機能（1週間）

1. **データ取得・更新API**
   - `app/api/corporate-member/design/route.ts` - デザイン設定取得・更新API

2. **デザイン設定画面**
   - `app/dashboard/corporate-member/design/page.tsx` - デザイン設定ページ
   - `components/corporate/BrandingPreview.tsx` - ブランディング適用プレビュー
   - `components/corporate/MemberDesignSettings.tsx` - メンバー用デザイン設定コンポーネント

#### フェーズ5: 共有設定機能（1週間）

1. **データ取得・更新API**
   - `app/api/corporate-member/share/route.ts` - 共有設定取得・更新API

2. **共有設定画面**
   - `app/dashboard/corporate-member/share/page.tsx` - 共有設定ページ
   - `components/corporate/MemberShareSettings.tsx` - メンバー用共有設定コンポーネント
   - `components/corporate/QrCodeGenerator.tsx` - 法人ブランディング適用QRコード生成

### 3.2 共通コンポーネント変更

1. **ダッシュボード共通レイアウト**
   - `app/dashboard/layout.tsx` - 条件分岐で法人メンバー向けコンテンツ表示

2. **ユーティリティ関数**
   - `lib/utils/corporate-member.ts` - 法人メンバー向けユーティリティ関数

3. **認証・アクセス制御**
   - `hooks/useCorporateAccess.ts`の拡張 - メンバー向け機能拡張

## 4. データフロー設計

### 4.1 認証とリダイレクト

1. ユーザーログイン時に`corporateAccessState`を確認
2. 法人メンバーの場合、`/dashboard/corporate-member/`へリダイレクト
3. 一般ユーザーが法人メンバー向けページにアクセスした場合、通常ダッシュボードへリダイレクト

```typescript
// middleware.ts（拡張部分）
export async function middleware(request: NextRequest) {
  // 既存のコード...

  // 法人メンバーのリダイレクト
  if (
    pathname.startsWith('/dashboard') &&
    !pathname.startsWith('/dashboard/corporate') &&
    !pathname.startsWith('/dashboard/corporate-member') &&
    hasCorporateAccess
  ) {
    return NextResponse.redirect(new URL('/dashboard/corporate-member', request.url));
  }

  // 一般ユーザーが法人メンバーページにアクセスした場合
  if (
    pathname.startsWith('/dashboard/corporate-member') &&
    !hasCorporateAccess
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 既存のコード...
}
```

### 4.2 データ取得フロー

法人メンバー向けダッシュボードでは、以下のデータ取得フローを実装：

1. ユーザー情報と法人テナント情報を同時に取得
2. 法人共通設定（カラー、ロゴ、必須SNSなど）を適用
3. 個人設定と法人設定を適切にマージして表示

```typescript
// 例: プロフィールデータ取得API
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // ユーザー情報とテナント情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: true,
        department: true,
        tenant: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            primaryColor: true,
            secondaryColor: true,
            corporateSnsLinks: true, // 法人共通SNS
          },
        },
      },
    });

    // データを返却
    return NextResponse.json({
      success: true,
      user: user,
      tenant: user?.tenant,
    });
  } catch (error) {
    console.error('プロフィール取得エラー:', error);
    return NextResponse.json(
      { error: 'プロフィール情報の取得に失敗しました' },
      { status: 500 },
    );
  }
}
```

## 5. UI/UX設計方針

### 5.1 法人ブランディングの適用

1. **一貫したカラーテーマ**
   - 法人テナントの`primaryColor`と`secondaryColor`を基本とする
   - ボタン、カード枠線、アクセント要素などに適用

2. **法人ロゴの表示**
   - ヘッダー部分とプロフィールページに法人ロゴを表示
   - 適切なサイズと配置で一貫性を持たせる

3. **法人情報の表示**
   - 部署・役職情報を適切な場所に表示
   - 法人名を明示し帰属意識を高める

### 5.2 権限に応じた表示制御

1. **管理者とメンバーの区別**
   - 管理者には追加設定オプションを表示
   - 一般メンバーには編集制限のある項目を明示

2. **必須項目の表示**
   - 法人で定められた必須SNS項目を明示
   - 削除不可の項目は視覚的に区別

### 5.3 ナビゲーション構造

1. **シンプルな構成**
   - Dashboard（概要）
   - Profile（プロフィール編集）
   - Links（SNS・リンク管理）
   - Design（デザイン設定）
   - Share（共有設定）

2. **法人ダッシュボードへのリンク**
   - 管理者には法人管理画面へのクイックリンクを提供
   - 一般メンバーには法人概要ページへのリンクを提供

## 6. テスト計画

### 6.1 ユニットテスト

1. **コンポーネントテスト**
   - 法人メンバー用コンポーネントの表示テスト
   - 権限による表示差分のテスト

2. **APIテスト**
   - 各APIエンドポイントの機能テスト
   - 権限によるアクセス制御のテスト

### 6.2 統合テスト

1. **ユーザーフロー**
   - 法人メンバーのログインからダッシュボード表示までのフロー
   - プロフィール編集〜保存〜表示確認のフロー

2. **権限テスト**
   - 管理者と一般メンバーの機能差異テスト
   - 未認証ユーザーのアクセス制限テスト

### 6.3 ブラウザ・デバイステスト

1. **レスポンシブデザイン**
   - モバイル、タブレット、デスクトップでの表示確認
   - 各種ブラウザでの動作確認

2. **パフォーマンステスト**
   - ページ読み込み速度の測定
   - API応答時間の測定

## 7. 実装スケジュール

全体で約7週間の開発期間を想定：

1. **フェーズ1**: 基本構造の実装（1週間）
2. **フェーズ2**: プロフィール管理機能（2週間）
3. **フェーズ3**: SNS・リンク管理機能（2週間）
4. **フェーズ4**: デザイン設定機能（1週間）
5. **フェーズ5**: 共有設定機能（1週間）

## 8. 今後の拡張可能性

1. **部署別テンプレート**
   - 部署ごとのデフォルト設定を提供
   - 部署固有のSNS推奨設定

2. **法人向け分析ダッシュボード**
   - メンバープロフィールの閲覧統計
   - SNS連携率などのメトリクス

3. **チーム連携機能**
   - チームメンバー間の相互リンク
   - チーム一覧ページ生成

## 9. まとめ

法人プラン専用の個人ダッシュボードは、法人ユーザーに特化した体験を提供し、ブランディングの一貫性と使いやすさを両立させるための重要な機能です。既存の個人ダッシュボードをベースにしつつ、法人特有の機能を統合することで、効率的な開発と優れたユーザー体験を実現します。

上記の実装計画に沿って開発を進めることで、法人プランのユーザー満足度向上と機能的な差別化を図ることができます。各フェーズごとに機能テストを行いながら、段階的にリリースしていくことを推奨します。