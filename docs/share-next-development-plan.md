# Share次期開発計画書

## 1. SNSガイド機能実装計画

### 1.1 概要
ユーザーがSNSアカウントを追加する際に、各SNSプラットフォーム別に適切なユーザー名やURLの見つけ方をガイドする機能を実装します。「？」マークのヘルプアイコンを各SNS入力フィールドの横に配置し、クリック/タップすることで詳細なガイドを表示します。

### 1.2 実装詳細

#### 1.2.1 UI要素
- 各SNS入力フィールドの横に配置する「？」アイコン
- クリック/タップで表示されるモーダルまたはスライドインパネル
- ステップバイステップのガイド表示
- スクリーンショット付きの視覚的説明
- 「理解しました」チェックボックスと「閉じる」ボタン

#### 1.2.2 SNS別ガイドコンテンツ構造

**LINE**
1. LINEアプリを開き、設定（歯車アイコン）を開く方法
2. プロフィール設定からID確認方法
3. IDの入力方法とURL形式の説明
4. LINE QRコードの共有方法（オプション）

**YouTube**
1. YouTubeアプリまたはウェブサイトでチャンネルページに移動する方法
2. チャンネル名と「@ハンドル」の確認方法
3. チャンネルURLの取得方法（共有ボタンの使用）
4. カスタムURLとデフォルトURLの違いと使い方

**X**
1. プロフィールページへのアクセス方法
2. ユーザーネーム（@username）の確認方法
3. プロフィールページからの共有リンク取得方法
4. 正しいURL形式（x.com/username）の説明

**Instagram**
1. プロフィールページへのアクセス方法
2. ユーザーネームの確認方法（@マークの後の部分）
3. プロフィールリンクの共有方法
4. アカウントの公開設定の確認方法

**TikTok**
1. プロフィールページへのアクセス方法
2. ユーザーネームと表示名の違いとその確認方法
3. TikTokプロフィールリンクの共有方法
4. 正しいURL形式（tiktok.com/@username）の説明

**Facebook**
1. プロフィール/ページへのアクセス方法
2. ユーザーネームまたはページ名の確認方法
3. プロフィール/ページURLの共有方法
4. プライバシー設定の確認と調整方法

**Pinterest**
1. プロフィールページへのアクセス方法
2. ユーザーネームの確認方法
3. プロフィールURLの取得方法
4. ボードとプロフィールの違いとリンクの選択方法

**pixiv**
1. プロフィールページへのアクセス方法
2. ユーザーIDの確認方法（数字のID）
3. プロフィールURLの形式と取得方法
4. 作品ページとプロフィールページの違いとリンク選択

**Threads**
1. プロフィールページへのアクセス方法
2. ユーザーネームの確認方法（Instagramと同じユーザーネーム）
3. プロフィールURLの取得方法
4. 正しいURL形式（threads.net/@username）の説明

**Skype**
1. Skypeアプリでプロフィールを開く方法
2. Skype名/ユーザーネームの確認方法
3. Skypeリンクの形式と取得方法
4. 連絡先として追加するためのリンク共有方法

**note**
1. プロフィールページへのアクセス方法
2. ユーザーネーム（@username）の確認方法
3. プロフィールURLの取得方法
4. マガジンとプロフィールの違いとリンク選択方法

**WhatsApp**
1. WhatsAppのプロフィール設定へのアクセス方法
2. 電話番号の確認と共有可能なリンクについての説明
3. WhatsAppビジネスアカウントとの違い
4. WhatsAppリンクの形式と作成方法（wa.me/電話番号）


#### 1.2.3 技術実装方針
```typescript
// SNSガイド情報の型定義
interface SnsGuideStep {
  title: string;
  description: string;
  imageUrl?: string;
}

interface SnsGuide {
  platform: string;
  platformName: string;
  steps: SnsGuideStep[];
  additionalInfo?: string;
}

// 各SNSプラットフォームのガイド情報
const snsGuidesData: Record<string, SnsGuide> = {
  line: {
    platform: 'line',
    platformName: 'LINE',
    steps: [
      {
        title: 'LINEアプリを開く',
        description: 'LINEアプリを開き、右下の「ホーム」タブから右上の歯車アイコン（設定）をタップします。',
        imageUrl: '/images/guides/line-step1.png'
      },
      {
        title: 'プロフィールを開く',
        description: '設定メニューから「プロフィール」を選択します。',
        imageUrl: '/images/guides/line-step2.png'
      },
      {
        title: 'IDを確認',
        description: 'プロフィール画面で「ID」欄に表示されている文字列があなたのLINE IDです。',
        imageUrl: '/images/guides/line-step3.png'
      }
    ],
    additionalInfo: 'LINE IDは後から変更することができます。また、ID検索を許可している必要があります。'
  },
  // 他のSNSプラットフォームも同様に定義
};
```

```tsx
// SNSガイド表示コンポーネント
const SnsGuideModal = ({ platform, isOpen, onClose }) => {
  const guide = snsGuidesData[platform];
  const [currentStep, setCurrentStep] = useState(0);
  const [understood, setUnderstood] = useState(false);
  
  if (!guide || !isOpen) return null;
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="sns-guide-modal">
        <h3>{guide.platformName}のリンク取得方法</h3>
        
        {/* ステップインジケーター */}
        <div className="step-indicator">
          {guide.steps.map((_, idx) => (
            <div 
              key={idx} 
              className={`step-dot ${idx === currentStep ? 'active' : ''}`} 
            />
          ))}
        </div>
        
        {/* 現在のステップ内容 */}
        <div className="step-content">
          <h4>{guide.steps[currentStep].title}</h4>
          <p>{guide.steps[currentStep].description}</p>
          {guide.steps[currentStep].imageUrl && (
            <img 
              src={guide.steps[currentStep].imageUrl}
              alt={`${guide.platformName}ガイド ステップ${currentStep + 1}`}
              fill
              className="object-cover"
            />
          )}
        </div>
        
        {/* ナビゲーションボタン */}
        <div className="guide-navigation">
          {currentStep > 0 && (
            <button 
              className="prev-btn" 
              onClick={() => setCurrentStep(prev => prev - 1)}
            >
              前へ
            </button>
          )}
          
          {currentStep < guide.steps.length - 1 ? (
            <button 
              className="next-btn" 
              onClick={() => setCurrentStep(prev => prev + 1)}
            >
              次へ
            </button>
          ) : (
            <div className="completion-actions">
              <label className="understood-checkbox">
                <input 
                  type="checkbox" 
                  checked={understood} 
                  onChange={(e) => setUnderstood(e.target.checked)} 
                />
                理解しました
              </label>
              <button 
                className="close-btn" 
                onClick={onClose}
              >
                閉じる
              </button>
            </div>
          )}
        </div>
        
        {/* 追加情報 */}
        {guide.additionalInfo && (
          <div className="additional-info">
            <p>{guide.additionalInfo}</p>
          </div>
        )}
      </div>
    </Modal>
  );
};
```

### 1.3 開発スケジュール

**フェーズ1: 設計と準備（1週間）**
- ガイドコンテンツの詳細設計
- UI/UXデザインの作成
- 各SNSプラットフォームの情報収集と整理
- スクリーンショット画像の準備

**フェーズ2: 基本実装（2週間）**
- ガイドモーダル/スライドインパネルコンポーネント実装
- ガイドデータの実装と統合
- 「？」アイコンの配置とイベントハンドリング
- 基本的なアニメーションとトランジション

**フェーズ3: 拡張と最適化（1週間）**
- ユーザーの理解度確認機能の実装
- レスポンシブ対応の最適化
- SNSプラットフォームの更新情報の反映
- パフォーマンス最適化

## 2. サブスクリプション機能実装計画

### 2.1 概要
ユーザーがサービスを継続利用するためのサブスクリプション機能を実装します。無料トライアル期間からの移行、定期課金の管理、サブスクリプションステータスの表示などの機能を含みます。

### 2.2 実装詳細

#### 2.2.1 サブスクリプションモデル
- 7日間の無料トライアル
- 月額プラン: 550円/月
- 年間プラン: 5,500円/年（2ヶ月分お得）
- 法人プラン: 3,300円/月〜（別途設定）

#### 2.2.2 主要機能
1. **トライアル期間管理**
   - トライアル開始日と終了日の記録
   - 残り日数の表示
   - トライアル終了前の通知

2. **支払い管理**
   - クレジットカード登録・管理
   - 定期課金の処理
   - 請求書の生成と履歴表示

3. **サブスクリプションステータス表示**
   - 現在のプラン表示
   - トライアル/有料プランの状態表示
   - 更新日の表示

4. **プラン変更・キャンセル**
   - 月額から年額への変更機能
   - 自動更新の設定・解除
   - キャンセル処理と理由収集

#### 2.2.3 UI要素
- アカウント設定内のサブスクリプションタブ
- トライアル残日数バナー（ダッシュボード上部）
- プラン選択・変更画面
- 支払い方法管理画面
- 請求履歴表示画面

#### 2.2.4 技術実装方針

**データモデル**
```prisma
// Prisma Schema追加
model Subscription {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  status          String   // 'trialing', 'active', 'past_due', 'canceled', 'incomplete'
  plan            String   // 'monthly', 'yearly', 'business', 'enterprise'
  priceId         String?  // Stripe価格ID
  subscriptionId  String?  // Stripe サブスクリプションID
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  cancelAtPeriodEnd  Boolean @default(false)
  trialStart      DateTime?
  trialEnd        DateTime?
  canceledAt      DateTime?
  cancelReason    String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// User modelに関連追加
model User {
  // 既存のフィールド
  subscription    Subscription?
}
```

**Stripe連携**
```typescript
// サブスクリプション作成
export async function createSubscription(
  userId: string,
  priceId: string,
  paymentMethodId: string
) {
  try {
    // ユーザーのStripeカスタマーIDを取得または作成
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true, stripeCustomerId: true }
    });
    
    let customerId = user.stripeCustomerId;
    
    if (!customerId) {
      // Stripeカスタマーを作成
      const customer = await stripe.customers.create({
        email: user.email,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
      
      customerId = customer.id;
      
      // ユーザーにStripeカスタマーIDを保存
      await db.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId }
      });
    }
    
    // サブスクリプションを作成
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      trial_period_days: 7,
      expand: ['latest_invoice.payment_intent'],
    });
    
    // データベースにサブスクリプション情報を保存
    await db.subscription.create({
      data: {
        userId,
        status: subscription.status,
        plan: getPlanFromPriceId(priceId),
        priceId,
        subscriptionId: subscription.id,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        trialStart: subscription.trial_start 
          ? new Date(subscription.trial_start * 1000) 
          : null,
        trialEnd: subscription.trial_end 
          ? new Date(subscription.trial_end * 1000) 
          : null,
      }
    });
    
    return subscription;
  } catch (error) {
    console.error('サブスクリプション作成エラー:', error);
    throw error;
  }
}

// プラン変更
export async function changeSubscriptionPlan(
  userId: string,
  newPriceId: string
) {
  try {
    const subscription = await db.subscription.findUnique({
      where: { userId }
    });
    
    if (!subscription || !subscription.subscriptionId) {
      throw new Error('サブスクリプションが見つかりませんでした');
    }
    
    // Stripeサブスクリプションのアイテムを更新
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.subscriptionId,
      {
        items: [{
          id: (await stripe.subscriptions.retrieve(subscription.subscriptionId))
            .items.data[0].id,
          price: newPriceId,
        }],
        proration_behavior: 'create_prorations',
      }
    );
    
    // データベースの情報を更新
    await db.subscription.update({
      where: { userId },
      data: {
        plan: getPlanFromPriceId(newPriceId),
        priceId: newPriceId,
        currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000),
        updatedAt: new Date(),
      }
    });
    
    return updatedSubscription;
  } catch (error) {
    console.error('プラン変更エラー:', error);
    throw error;
  }
}

// サブスクリプションキャンセル
export async function cancelSubscription(
  userId: string,
  cancelReason?: string
) {
  try {
    const subscription = await db.subscription.findUnique({
      where: { userId }
    });
    
    if (!subscription || !subscription.subscriptionId) {
      throw new Error('サブスクリプションが見つかりませんでした');
    }
    
    // 期間終了時にキャンセルするようStripeに指示
    const canceledSubscription = await stripe.subscriptions.update(
      subscription.subscriptionId,
      { cancel_at_period_end: true }
    );
    
    // データベースの情報を更新
    await db.subscription.update({
      where: { userId },
      data: {
        cancelAtPeriodEnd: true,
        cancelReason,
        updatedAt: new Date(),
      }
    });
    
    return canceledSubscription;
  } catch (error) {
    console.error('キャンセルエラー:', error);
    throw error;
  }
}
```

**フロントエンドコンポーネント**
```tsx
// トライアル残日数バナー
const TrialBanner = ({ trialEndDate }) => {
  const [daysRemaining, setDaysRemaining] = useState<number>(0);
  
  useEffect(() => {
    if (trialEndDate) {
      const end = new Date(trialEndDate);
      const now = new Date();
      const diffTime = end.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysRemaining(diffDays);
    }
  }, [trialEndDate]);
  
  if (!trialEndDate || daysRemaining <= 0) return null;
  
  return (
    <div className="trial-banner">
      <div className="banner-content">
        <div className="trial-icon">
          <ClockIcon />
        </div>
        <div className="trial-message">
          <p className="trial-title">無料トライアル期間中</p>
          <p className="trial-desc">
            あと<span className="days-count">{daysRemaining}</span>日で終了します
          </p>
        </div>
        <Link href="/settings/subscription" className="upgrade-button">
          プランを選択
        </Link>
      </div>
    </div>
  );
};

// サブスクリプション管理画面
const SubscriptionSettings = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [paymentMethod, setPaymentMethod] = useState(null);
  
  // サブスクリプション情報を取得
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/subscription');
        const data = await response.json();
        setSubscription(data.subscription);
      } catch (error) {
        console.error('サブスクリプション取得エラー:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubscription();
  }, []);
  
  // プランの変更を処理
  const handleChangePlan = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/subscription/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSubscription(data.subscription);
        toast.success('プランが変更されました');
      } else {
        toast.error(data.message || 'プラン変更に失敗しました');
      }
    } catch (error) {
      console.error('プラン変更エラー:', error);
      toast.error('エラーが発生しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };
  
  // サブスクリプションのキャンセルを処理
  const handleCancelSubscription = async (reason?: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSubscription(data.subscription);
        toast.success('サブスクリプションは期間終了時にキャンセルされます');
      } else {
        toast.error(data.message || 'キャンセルに失敗しました');
      }
    } catch (error) {
      console.error('キャンセルエラー:', error);
      toast.error('エラーが発生しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div className="subscription-settings">
      <h2>サブスクリプション設定</h2>
      
      {/* 現在のステータス表示 */}
      <div className="subscription-status">
        <h3>現在のプラン</h3>
        {subscription ? (
          <>
            <div className="status-card">
              <div className="plan-info">
                <h4>{getPlanName(subscription.plan)}</h4>
                <p className="status">{getStatusText(subscription.status)}</p>
                
                {subscription.status === 'trialing' && (
                  <p className="trial-info">
                    トライアル終了日: {formatDate(subscription.trialEnd)}
                  </p>
                )}
                
                <p className="period-info">
                  次回の更新日: {formatDate(subscription.currentPeriodEnd)}
                </p>
                
                {subscription.cancelAtPeriodEnd && (
                  <p className="cancel-info">
                    ※ 次回の更新日でサブスクリプションは終了します
                  </p>
                )}
              </div>
              
              {!subscription.cancelAtPeriodEnd && (
                <button 
                  className="cancel-button"
                  onClick={() => setCancelModalOpen(true)}
                >
                  キャンセル
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="no-subscription">
            <p>現在アクティブなサブスクリプションはありません</p>
          </div>
        )}
      </div>
      
      {/* プラン選択セクション */}
      {(!subscription || subscription.status === 'trialing') && (
        <div className="plan-selection">
          <h3>プランを選択</h3>
          <div className="plans-container">
            <div 
              className={`plan-card ${selectedPlan === 'monthly' ? 'selected' : ''}`}
              onClick={() => setSelectedPlan('monthly')}
            >
              <div className="plan-header">
                <h4>月額プラン</h4>
                <p className="price">¥550/月</p>
              </div>
              <div className="plan-features">
                <ul>
                  <li>全機能利用可能</li>
                  <li>毎月自動更新</li>
                  <li>いつでもキャンセル可能</li>
                </ul>
              </div>
            </div>
            
            <div 
              className={`plan-card ${selectedPlan === 'yearly' ? 'selected' : ''}`}
              onClick={() => setSelectedPlan('yearly')}
            >
              <div className="plan-header">
                <h4>年額プラン</h4>
                <p className="price">¥5,000/年</p>
                <span className="save-badge">2ヶ月分お得</span>
              </div>
              <div className="plan-features">
                <ul>
                  <li>全機能利用可能</li>
                  <li>年に一度の更新</li>
                  <li>最大の費用対効果</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="payment-section">
            <h3>お支払い情報</h3>
            <PaymentMethodForm 
              onPaymentMethodChange={setPaymentMethod} 
            />
            
            <button 
              className="subscribe-button"
              disabled={!paymentMethod || loading}
              onClick={handleChangePlan}
            >
              {loading ? 'お手続き中...' : 'プランに登録する'}
            </button>
          </div>
        </div>
      )}
      
      {/* 請求履歴セクション */}
      <BillingHistory />
    </div>
  );
};
```

**Webhook処理**
```typescript
// Stripe Webhookハンドラー
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (error) {
    console.error('Webhook署名検証エラー:', error);
    return new Response(`Webhook Error: ${error.message}`, { status: 400 });
  }
  
  // イベントタイプに基づいて処理
  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
        
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
        
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
        
      default:
        console.log(`未処理のイベントタイプ: ${event.type}`);
    }
    
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Webhook処理エラー:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook処理に失敗しました' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

### 2.3 開発スケジュール

**フェーズ1: 基盤構築（2週間）**
- Stripe連携設定
- データベースモデルの拡張
- バックエンドAPIの実装
- Webhookハンドラー実装

**フェーズ2: フロントエンド実装（2週間）**
- サブスクリプション管理UI実装
- 決済フォーム実装
- トライアル期間表示の実装
- プラン選択画面の実装

**フェーズ3: テストと最適化（1週間）**
- 課金フローのテスト
- エラーケースの対応
- ユーザビリティの調整
- セキュリティの検証

**フェーズ4: ロールアウト（1週間）**
- ステージング環境でのテスト
- 決済情報のセキュリティ監査
- 本番環境へのデプロイ
- モニタリングツールの設定

## 3. 優先順位付けと実装スケジュール

### 3.1 優先順位

**高優先度（最初に実装）**
1. SNSガイド機能基本実装
2. トライアル期間管理と表示
3. 基本的なサブスクリプション管理UI

**中優先度（次のフェーズ）**
1. SNSガイドの詳細コンテンツとビジュアル拡充
2. 支払い処理とStripe連携
3. サブスクリプションステータス管理

**低優先度（時間があれば実装）**
1. ガイド表示のアニメーションと改善
2. 請求履歴と詳細なレポート機能
3. プラン比較ツール

### 3.2 全体スケジュール

**第1週: 計画と準備**
- SNSガイド機能の詳細設計
- サブスクリプションデータモデルの設計
- Stripe連携の準備

**第2-3週: SNSガイド機能実装**
- 基本的なヘルプアイコンとモーダル実装
- 各SNSプラットフォームのガイドコンテンツ作成
- UI/UXテストと改善

**第4-6週: サブスクリプション基盤実装**
- データベースモデル拡張
- Stripe連携実装
- トライアル管理機能実装

**第7-8週: サブスクリプションUI実装**
- サブスクリプション管理画面
- プラン選択・変更UI
- 支払い情報管理UI

**第9週: 統合とテスト**
- 機能統合
- エンドツーエンドテスト
- パフォーマンス最適化

**第10週: デプロイと監視**
- ステージング環境での最終テスト
- 本番環境へのデプロイ
- 監視ツールのセットアップとアラート設定

## 4. リスク評価と対策

### 4.1 SNSガイド機能のリスク

**リスク1: SNSプラットフォームUIの変更**
- **影響**: ガイドの説明とスクリーンショットが実際のUIと一致しなくなる
- **対策**: モジュラー設計でコンテンツを容易に更新できるようにする、定期的な見直しスケジュールの設定

**リスク2: スマートフォン機種による差異**
- **影響**: デバイスによってUIが異なり、ガイドが正確でなくなる可能性
- **対策**: 一般的な手順に重点を置き、機種固有の説明は最小限にする、OS別ガイドの用意

### 4.2 サブスクリプション機能のリスク

**リスク1: 決済処理の失敗**
- **影響**: 収益機会の損失、ユーザー体験の低下
- **対策**: 堅牢なエラーハンドリング、リトライメカニズム、明確なユーザー通知

**リスク2: セキュリティリスク**
- **影響**: 支払い情報漏洩、コンプライアンス違反
- **対策**: PCI DSS準拠、Stripeによる支払い情報処理の委託、セキュリティ監査の実施

**リスク3: サブスクリプション管理の複雑さ**
- **影響**: バグの発生、ユーザーの混乱
- **対策**: 徹底的なテスト、明確なステータス表示、詳細なログ記録

## 5. 評価指標（KPI）

### 5.1 SNSガイド機能の評価指標

- **ガイド利用率**: 「？」アイコンをクリック/タップするユーザーの割合
- **完了率**: ガイドを最後まで見たユーザーの割合
- **SNS登録成功率**: ガイド表示後にSNS情報を正しく登録できたユーザーの割合
- **ユーザーフィードバック**: 「理解しました」チェックボックスにチェックを入れたユーザーの割合

### 5.2 サブスクリプション機能の評価指標

- **トライアル→有料転換率**: トライアル期間後に有料プランに移行するユーザーの割合
- **年間プラン選択率**: 月額プランではなく年間プランを選択するユーザーの割合
- **解約率**: 月ごとの解約率
- **平均顧客生涯価値（LTV）**: ユーザーあたりの平均収益
- **支払い失敗率**: 支払い処理が失敗する割合

## 6. テスト計画

### 6.1 SNSガイド機能のテスト

1. **ユニットテスト**
   - コンポーネントのレンダリングテスト
   - 各SNSプラットフォームのデータ構造テスト
   - イベントハンドリングテスト

2. **UI/UXテスト**
   - 異なるデバイスサイズでのレスポンシブテスト
   - アニメーションとトランジションの検証
   - アクセシビリティテスト

3. **ユーザーテスト**
   - 5-10名の実際のユーザーによるガイド使用テスト
   - フィードバック収集と改善点の特定
   - 理解度の評価

### 6.2 サブスクリプション機能のテスト

1. **ユニットテスト**
   - APIエンドポイントのテスト
   - データモデルとデータ整合性のテスト
   - バリデーションロジックのテスト

2. **統合テスト**
   - Stripeとの連携テスト
   - Webhookハンドラーのテスト
   - 課金サイクルのテスト

3. **エンドツーエンドテスト**
   - 完全な支払いフローのテスト
   - エラーケースとエッジケースのテスト
   - 長期的なサブスクリプションライフサイクルのテスト

4. **セキュリティテスト**
   - ペネトレーションテスト
   - 支払い情報の安全性検証
   - データ保護の検証

## 7. 開発後の運用計画

### 7.1 SNSガイド機能の運用

- **四半期ごとの内容更新**: 各SNSプラットフォームのUI変更に応じた更新
- **利用統計の分析**: ガイド使用状況の定期的な分析と最適化
- **フィードバックループ**: ユーザーからのフィードックに基づく継続的な改善

### 7.2 サブスクリプション機能の運用

- **支払い問題のモニタリング**: 失敗した支払いの監視と対応
- **解約理由の分析**: キャンセル理由の収集と分析による改善
- **価格戦略の最適化**: 転換率と顧客生涯価値に基づく料金プランの調整
- **レポート生成**: 経営陣向けの定期的な収益レポートの作成

## 8. ドキュメント計画

### 8.1 開発者向けドキュメント

- **技術仕様書**: 実装の詳細と構造の説明
- **APIドキュメント**: バックエンドAPIの使用方法
- **コンポーネントライブラリ**: 再利用可能なUIコンポーネントの説明
- **データモデル図**: データベース構造の説明

### 8.2 ユーザー向けドキュメント

- **ヘルプセンター記事**: SNSアカウント追加の手順
- **FAQ**: サブスクリプションに関するよくある質問と回答
- **決済に関するガイド**: 支払い方法の変更、請求書の確認方法など
- **トラブルシューティング**: 一般的な問題と解決策

## 9. まとめと次のステップ

本開発計画では、Shareサービスの次期開発として、SNSガイド機能とサブスクリプション機能の実装を詳細に計画しました。これらの機能は、ユーザーのオンボーディング体験の向上と収益化モデルの確立という二つの重要な目標に貢献します。

開発は約10週間で完了する予定で、SNSガイド機能の実装を先行し、その後サブスクリプション機能の実装へと進めます。リスク管理とテスト計画を徹底し、品質の高い機能をリリースすることを目指します。

### 次のステップ

1. デザインチームとの最終調整
2. スプリント計画の詳細化
3. 開発環境のセットアップ
4. プロトタイプ作成と初期テスト
5. 開発開始