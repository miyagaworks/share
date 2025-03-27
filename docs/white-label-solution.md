# Shareホワイトラベル/パートナーソリューション計画

## 1. ホワイトラベルソリューションの概要

名刺印刷を本業とする協力企業がサービス提供元となり、独自ブランドで展開できるホワイトラベルソリューションを構築します。これにより、名刺印刷事業とデジタル名刺サービスを融合させ、物理とデジタルの両面から顧客にソリューションを提供することが可能となります。

### 1.1 主な特徴

- **独自ブランディング**: パートナー企業の名前・ロゴでサービス提供
- **独自ドメイン対応**: partner-company.com/digital-card などパートナー企業のドメインで提供
- **カスタムデザイン**: パートナー企業のブランドに合わせたUI/UXカスタマイズ
- **印刷名刺連携**: 物理名刺にQRコードを印刷し、デジタル名刺と連携
- **統合管理システム**: 物理名刺とデジタル名刺の注文・管理を一元化
- **収益分配モデル**: サブスクリプション収益のレベニューシェア

## 2. パートナーソリューションのアーキテクチャ

### 2.1 マルチテナントアーキテクチャ

```
┌─────────────────────────────────────────────┐
│                  共通基盤                    │
│   ┌─────────┐   ┌─────────┐   ┌─────────┐   │
│   │ コアAPI │   │  認証   │   │データベース│   │
│   └─────────┘   └─────────┘   └─────────┘   │
└─────────────────────────────────────────────┘
             ↑               ↑
    ┌─────────────────┐  ┌─────────────────┐
    │ テナントA設定   │  │ テナントB設定   │
    │ ・ブランド設定  │  │ ・ブランド設定  │
    │ ・カスタムドメイン│  │ ・カスタムドメイン│
    │ ・課金設定     │  │ ・課金設定     │
    └─────────────────┘  └─────────────────┘
             ↑               ↑
    ┌─────────────────┐  ┌─────────────────┐
    │ パートナーA    │  │ パートナーB    │
    │ フロントエンド  │  │ フロントエンド  │
    └─────────────────┘  └─────────────────┘
```

### 2.2 技術実装方針

#### 2.2.1 バックエンド実装
- マルチテナントデータベース設計
- テナント識別と分離のセキュリティ実装
- 各テナント固有設定の管理システム
- APIレベルでのテナント識別と認証

#### 2.2.2 フロントエンド実装
- ホワイトラベル対応テンプレートシステム
- 動的テーマエンジン（カラー、フォント、レイアウト）
- カスタムドメイン/サブドメイン処理
- パートナー固有機能の条件付き表示

#### 2.2.3 インフラ設計
- テナント別リソース割り当て
- スケーラブルなクラウドアーキテクチャ
- 分離されたログ管理とモニタリング
- テナント別のバックアップと復旧プラン

## 3. パートナー管理ダッシュボード

### 3.1 主要機能

#### 3.1.1 ブランディング管理
- ロゴアップロードと配置設定
- カラーテーマカスタマイズ
- フォント設定
- カスタムドメイン/サブドメイン設定
- メールテンプレートのカスタマイズ
- 利用規約/プライバシーポリシーカスタマイズ

#### 3.1.2 ユーザー管理
- パートナー企業の管理者アカウント作成
- 顧客アカウントの一括管理
- 権限設定とロール管理
- ユーザー統計とアクティビティ監視

#### 3.1.3 料金プラン管理
- カスタム料金プラン設定
- 課金サイクル設定
- プロモーションコード作成
- 請求書のブランド設定

#### 3.1.4 印刷名刺連携設定
- QRコードデザインと配置設定
- 名刺テンプレートとの連携設定
- 注文システム連携設定
- デジタル・物理名刺の同期設定

#### 3.1.5 分析とレポート
- ユーザー獲得統計
- 収益レポート
- 使用状況分析
- カスタムレポート作成

### 3.2 実装イメージ

```jsx
// パートナー設定ダッシュボードのテーマ設定コンポーネント例
const ThemeCustomizer = ({ partner, updateSettings }) => {
  const [primaryColor, setPrimaryColor] = useState(partner.theme.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(partner.theme.secondaryColor);
  const [logo, setLogo] = useState(partner.theme.logo);
  
  const handleSave = async () => {
    await updateSettings(partner.id, {
      theme: {
        primaryColor,
        secondaryColor,
        logo
      }
    });
  };
  
  return (
    <div className="theme-customizer">
      <h2>ブランドテーマ設定</h2>
      
      <div className="setting-group">
        <label>プライマリーカラー</label>
        <ColorPicker 
          color={primaryColor} 
          onChange={setPrimaryColor} 
        />
        <Preview element="button" style={{ backgroundColor: primaryColor }} />
      </div>
      
      <div className="setting-group">
        <label>セカンダリーカラー</label>
        <ColorPicker 
          color={secondaryColor} 
          onChange={setSecondaryColor} 
        />
        <Preview element="accent" style={{ color: secondaryColor }} />
      </div>
      
      <div className="setting-group">
        <label>ロゴ</label>
        <LogoUploader currentLogo={logo} onUpload={setLogo} />
        <Preview element="header" logo={logo} />
      </div>
      
      <div className="preview-section">
        <h3>プレビュー</h3>
        <AppPreview 
          theme={{ primaryColor, secondaryColor, logo }} 
          partnerName={partner.name}
        />
      </div>
      
      <button className="save-button" onClick={handleSave}>設定を保存</button>
    </div>
  );
};
```

## 4. 名刺印刷会社向け特化機能

### 4.1 物理名刺・デジタル名刺統合システム

#### 4.1.1 統合注文プロセス
- 顧客が紙の名刺を注文する際にデジタル名刺をセットで提案
- 1回の入力で両方の名刺情報を設定可能
- 物理名刺のQRコードに自動的にデジタル名刺リンクを埋め込み

#### 4.1.2 デザイン統合
- 物理名刺とデジタル名刺のデザイン一貫性確保
- 企業ブランドガイドラインに基づいた統一デザイン
- 物理名刺のデザイン要素をデジタル名刺にも反映

#### 4.1.3 情報更新連携
- 物理名刺再注文時にデジタル名刺情報も自動更新
- デジタル名刺更新時の物理名刺再注文提案
- 組織変更時の一括更新機能

### 4.2 印刷名刺事業拡張機能

#### 4.2.1 スマートQRコードオプション
- デザイン性の高いカスタムQRコード
- QRコードスキャン分析（スキャン回数、場所など）
- 動的QRコード（キャンペーン別など）

#### 4.2.2 プレミアム物理名刺オプション
- NFC埋め込み名刺（タップでデジタル名刺表示）
- AR対応名刺（AR要素を表示可能）
- 環境配慮型素材オプション（持続可能性をアピール）

#### 4.2.3 エンタープライズ向け管理機能
- 部署別予算管理
- デザインテンプレート管理
- 承認ワークフロー
- 一括発注・更新機能

## 5. 収益モデルとパートナーシップ構造

### 5.1 基本収益分配モデル

#### 5.1.1 レベニューシェアモデル
- **スタンダードモデル**: 
  - パートナー企業: 60%
  - Shareプラットフォーム: 40%

- **プレミアムパートナーモデル** (年間保証売上あり):
  - パートナー企業: 70%
  - Shareプラットフォーム: 30%

- **ホワイトラベルセットアップ料**:
  - 初期費用: 500,000円
  - 年間プラットフォーム使用料: 300,000円

#### 5.1.2 インセンティブ構造
- 売上目標達成ボーナス
- ユーザー獲得ボーナス
- 長期契約ユーザー比率によるボーナス

### 5.2 物理名刺連携特典

- デジタル名刺とセット販売時の印刷名刺割引提供
- 名刺再注文率向上によるLTV増加
- アップセル・クロスセル機会の創出

### 5.3 契約構造

- 2〜3年の長期パートナーシップ契約
- 明確なSLA（サービスレベル合意）
- データ所有権と使用権の明確な定義
- 契約更新インセンティブ

## 6. 導入プロセス

### 6.1 パートナーオンボーディング

1. **初期コンサルテーション**
   - パートナービジネス分析
   - 目標設定と戦略策定
   - カスタマイズ要件の特定

2. **ブランディング設定**
   - ブランド要素の収集と適用
   - UI/UXのカスタマイズ
   - マーケティング資料の準備

3. **システム連携**
   - 既存システムとのAPI連携
   - 印刷システムとの統合
   - 認証システム連携

4. **テストと品質保証**
   - テナント分離のテスト
   - パフォーマンステスト
   - セキュリティ監査

5. **トレーニングと展開**
   - 管理者トレーニング
   - 営業チームトレーニング
   - 段階的市場導入

### 6.2 タイムライン

- **準備期間**: 契約締結から2週間
- **初期設定**: 2週間
- **カスタマイズ**: 2〜4週間（要件による）
- **テスト期間**: 2週間
- **トレーニング**: 1週間
- **ソフトローンチ**: 限定顧客向け提供（2週間）
- **フルローンチ**: 全面展開

## 7. 成功事例（計画）

名刺印刷会社がホワイトラベルソリューションを活用した成功シナリオ例:

### 7.1 デジタルトランスフォーメーション事例

**シナリオ**: 老舗名刺印刷会社がデジタル名刺サービスを自社ブランドで展開し、伝統的な顧客基盤にデジタルソリューションを提供。

**成果**:
- 既存顧客の40%がデジタル名刺も採用
- 顧客あたりの年間売上30%増加
- 新規顧客獲得率15%向上

### 7.2 エンタープライズ展開事例

**シナリオ**: パートナー企業が大手企業向けに物理名刺とデジタル名刺の統合管理ソリューションを提供。

**成果**:
- 企業内名刺管理コスト25%削減
- 連絡先データ品質の向上
- 従業員のネットワーキング活動20%向上

### 7.3 業界特化展開事例

**シナリオ**: 特定業界（不動産、医療、法律など）に特化したカスタマイズされたソリューションの提供。

**成果**:
- 業界標準としての地位確立
- 業界特有の機能による差別化
- 紹介による新規顧客獲得の増加

## 8. 拡張ロードマップ

### 8.1 短期計画（リリース後6ヶ月）

- 基本ホワイトラベルソリューション提供開始
- 最初のパートナー1〜2社とのローンチ
- 物理名刺連携基本機能の実装

### 8.2 中期計画（リリース後12ヶ月）

- パートナー専用API拡張
- 高度なカスタマイズオプション追加
- パートナー数5〜10社への拡大
- 分析・レポート機能の強化

### 8.3 長期計画（リリース後18〜24ヶ月）

- パートナーエコシステムの構築
- 国際展開サポート
- AIを活用した名刺データ管理
- 業界別特化テンプレートの提供

## 9. 技術要件と実装注意点

ホワイトラベルソリューションを成功させるためには、以下の技術的要件と実装注意点に対応する必要があります：

### 9.1 マルチテナンシー実装の技術的考慮事項

- **データ分離**: テナント間のデータ完全分離の保証
- **パフォーマンス**: テナント数増加時のスケーラビリティ確保
- **セキュリティ**: テナント間のセキュリティ境界の厳格な維持
- **カスタマイズ管理**: 設定変更の追跡と管理
- **バックアップ/復元**: テナント単位での操作
- **アップデート管理**: コアプラットフォームのアップデートをテナントに適用する仕組み
- **リソース制限**: テナントごとのリソース使用制限とモニタリング

### 9.2 ホワイトラベル対応のためのコードベース変更

以下に、ホワイトラベル対応のために必要な主要なコード実装例を示します：

```javascript
// テナント識別ミドルウェア例
const tenantMiddleware = async (req, res, next) => {
  // ホストに基づくテナント識別
  const hostname = req.hostname;
  
  // テナントのルックアップ
  const tenant = await db.tenants.findOne({ 
    where: { 
      domain: hostname,
      status: 'active'
    } 
  });
  
  if (!tenant) {
    // デフォルトテナントまたはエラー処理
    return res.redirect('https://main-app.sns-share.com');
  }
  
  // テナント情報をリクエストに添付
  req.tenant = tenant;
  req.tenantId = tenant.id;
  
  // レスポンスヘッダーにテナント情報を設定
  res.locals.tenant = {
    name: tenant.name,
    theme: tenant.theme,
    customCss: tenant.customCss,
    logo: tenant.logoUrl,
    contactEmail: tenant.supportEmail
  };
  
  next();
};

// 動的スタイルローダー
const dynamicStyleHandler = (req, res) => {
  const { tenant } = req;
  
  // テナント固有のスタイル生成
  const css = generateTenantCSS(tenant.theme, tenant.customCss);
  
  res.setHeader('Content-Type', 'text/css');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(css);
};

// テナント設定ローダー（フロントエンド用）
const tenantConfigHandler = (req, res) => {
  // 安全に公開可能なテナント設定のみを含める
  const publicConfig = {
    name: req.tenant.name,
    logoUrl: req.tenant.logoUrl,
    primaryColor: req.tenant.theme.primaryColor,
    secondaryColor: req.tenant.theme.secondaryColor,
    fontFamily: req.tenant.theme.fontFamily,
    supportEmail: req.tenant.supportEmail,
    termsUrl: req.tenant.termsUrl,
    privacyUrl: req.tenant.privacyUrl,
    features: req.tenant.enabledFeatures
  };
  
  res.json(publicConfig);
};

// フロントエンドでのテナント設定適用例 (React)
function TenantProvider({ children }) {
  const [tenantConfig, setTenantConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadTenantConfig() {
      try {
        const response = await fetch('/api/tenant-config');
        const config = await response.json();
        setTenantConfig(config);
      } catch (error) {
        console.error('Failed to load tenant config:', error);
        // フォールバック設定
        setTenantConfig(defaultTenantConfig);
      } finally {
        setLoading(false);
      }
    }
    
    loadTenantConfig();
  }, []);
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return (
    <TenantContext.Provider value={tenantConfig}>
      <ThemeProvider theme={createThemeFromTenantConfig(tenantConfig)}>
        {children}
      </ThemeProvider>
    </TenantContext.Provider>
  );
}
```

### 9.3 データベース設計

マルチテナント対応のデータベース設計は以下の手法で実装できます。各テナントのデータは同じデータベース内で明確に分離されます：

```sql
-- テナントテーブル
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  domain VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  logo_url VARCHAR(255),
  primary_color VARCHAR(20) DEFAULT '#3B82F6',
  secondary_color VARCHAR(20) DEFAULT '#10B981',
  font_family VARCHAR(100) DEFAULT 'Inter, sans-serif',
  support_email VARCHAR(255) NOT NULL,
  terms_url VARCHAR(255),
  privacy_url VARCHAR(255),
  enabled_features JSONB DEFAULT '{}'::jsonb,
  custom_css TEXT,
  subscription_plan VARCHAR(50) NOT NULL DEFAULT 'standard',
  subscription_status VARCHAR(20) NOT NULL DEFAULT 'active',
  revenue_share_percentage INTEGER NOT NULL DEFAULT 60
);

-- ユーザーテーブル（テナントIDでパーティション化）
CREATE TABLE users (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  email VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  profile_data JSONB DEFAULT '{}'::jsonb,
  UNIQUE(tenant_id, email)
);
CREATE INDEX idx_users_tenant ON users(tenant_id);

-- プロフィールデータテーブル（テナント分離）
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  theme_settings JSONB DEFAULT '{}'::jsonb,
  sns_links JSONB DEFAULT '{}'::jsonb,
  contact_info JSONB DEFAULT '{}'::jsonb,
  visibility_settings JSONB DEFAULT '{}'::jsonb,
  UNIQUE(tenant_id, user_id)
);
CREATE INDEX idx_profiles_tenant ON profiles(tenant_id);

-- 印刷名刺連携テーブル（名刺印刷会社向け特化機能）
CREATE TABLE print_card_links (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  profile_id UUID NOT NULL REFERENCES profiles(id),
  order_number VARCHAR(100),
  print_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  card_design_data JSONB,
  qr_code_position JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, order_number)
);
CREATE INDEX idx_print_cards_tenant ON print_card_links(tenant_id);

-- テナント課金情報テーブル
CREATE TABLE tenant_billing (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  total_users INTEGER NOT NULL DEFAULT 0,
  active_users INTEGER NOT NULL DEFAULT 0,
  revenue_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  partner_share_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  platform_share_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  UNIQUE(tenant_id, billing_period_start, billing_period_end)
);
```

### 9.4 API分離と認証

テナント別のAPIエンドポイントと認証処理の実装例：

```javascript
// API要求のテナント認証ミドルウェア
const apiTenantAuthMiddleware = async (req, res, next) => {
  // APIキーからテナントを識別
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  const tenant = await db.tenants.findOne({
    where: { apiKey, status: 'active' }
  });
  
  if (!tenant) {
    return res.status(403).json({ error: 'Invalid API key' });
  }
  
  // テナント情報をリクエストに添付
  req.tenant = tenant;
  req.tenantId = tenant.id;
  
  next();
};
```