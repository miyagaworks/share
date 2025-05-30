# ShareMVPの詳細要件定義

## 1. MVPの目的と範囲

### 1.1 目的
- ユーザーが実際にSNSと連絡先情報を一つのプロフィールにまとめて共有できる基本機能を提供する
- 実際のユーザーからフィードバックを集め、改善方向を特定する
- プロダクトの価値提案を検証し、有料転換の可能性を確認する

### 1.2 優先事項
- 使いやすさ（5分以内で設定完了できること）
- モバイル対応の完成度
- 必要最小限の機能で価値を提供すること
- 安定して動作すること

### 1.3 MVPに含む主要機能
1. ユーザー認証
2. プロフィール基本情報管理
3. SNSリンク管理（少なくとも5種類のSNS）
4. 基本的な連絡先情報管理
5. シンプルなカラーカスタマイズ
6. QRコード共有
7. 公開プロフィール表示
8. 7日間トライアルと支払い機能

### 1.4 MVPに含まない機能（後続フェーズ）
- SNSの詳細なカスタマイズ（12種類以上）
- サブカラー設定
- vCard生成・ダウンロード
- NFC連携
- 詳細なプライバシー設定
- 法人向け機能
- ホワイトラベル機能

## 2. 詳細機能要件

### 2.1 ユーザー認証機能

#### 2.1.1 サインアップ
- **機能**: メールアドレスとパスワードでの登録
- **要件**:
  - メールアドレスの有効性確認
  - パスワード強度の検証（8文字以上、1つ以上の数字と特殊文字）
  - 利用規約とプライバシーポリシーへの同意確認
  - アカウント作成完了のメール送信
- **オプション機能**: GoogleアカウントまたはAppleアカウントでのサインアップ

#### 2.1.2 ログイン
- **機能**: 登録済みユーザーの認証
- **要件**:
  - メールアドレスとパスワードでのログイン
  - 「パスワードを忘れた」機能
  - セッション管理（一定期間のログイン状態保持）
- **オプション機能**: Google/Appleでのソーシャルログイン

#### 2.1.3 アカウント管理
- **機能**: ユーザーアカウントの基本設定
- **要件**:
  - パスワード変更
  - メールアドレス変更
  - アカウント削除オプション

### 2.2 プロフィール基本情報

#### 2.2.1 基本情報設定
- **機能**: ユーザーの基本情報管理
- **要件**:
  - 名前（日本語）: 必須
  - 名前（英語/ローマ字）: 必須
  - プロフィール画像: オプション、デフォルトはイニシャルアイコン
  - 自己紹介文: オプション、最大300文字

#### 2.2.2 プロフィール画像アップロード
- **機能**: ユーザー画像のアップロードと表示
- **要件**:
  - 画像アップロード（JPG, PNG形式）
  - 画像クロップ機能
  - 画像サイズの最適化（最大1MB）
  - デフォルトアイコンへのリセットオプション

### 2.3 SNSリンク管理

#### 2.3.1 対応SNS（MVP段階）
1. LINE
2. YouTube
3. X
4. Instagram
5. TikTok

#### 2.3.2 SNS追加機能
- **機能**: SNSアカウントの追加
- **要件**:
  - プラットフォーム選択
  - ユーザー名またはURL入力
  - 入力補助機能（各SNSのURLフォーマットのガイド）
  - URLバリデーション

#### 2.3.3 SNS管理機能
- **機能**: 追加済みSNSの管理
- **要件**:
  - SNSの追加/編集/削除
  - アイコン表示（SVG形式）
  - 表示順の変更（ドラッグ＆ドロップ）
  - 追加したSNSのプレビュー表示

#### 2.3.4 カスタムリンク
- **機能**: 任意のウェブサイトリンクの追加
- **要件**:
  - リンク名称の設定
  - URL入力
  - URLバリデーション
  - MVP段階では最大5つまで

### 2.4 連絡先情報管理

#### 2.4.1 基本連絡先情報
- **機能**: 連絡先情報の管理
- **要件**:
  - メールアドレス（オプション、アカウントメールと別に設定可能）
  - 電話番号（オプション）
  - 会社/組織名（オプション）
  - 役職（オプション）

### 2.5 デザインカスタマイズ

#### 2.5.1 カラーカスタマイズ
- **機能**: プロフィールのカラーテーマ設定
- **要件**:
  - メインカラー選択（カラーピッカー）
  - テーマカラーのプレビュー
  - プリセットカラーの提供（8〜10種類）
  - カスタムカラーコードの直接入力（16進数）

#### 2.5.2 テーマ適用
- **機能**: 選択したカラーの適用
- **要件**:
  - メインカラーに基づくテーマの自動生成
  - コントラスト確保のための自動調整
  - プロフィールページへの即時反映

### 2.6 共有機能

#### 2.6.1 QRコード生成
- **機能**: プロフィール共有用QRコード
- **要件**:
  - ユニークなQRコードの自動生成
  - QRコードの表示
  - QRコードのダウンロード（PNG形式）
  - QRコードのシェア機能

#### 2.6.2 共有URL
- **機能**: 固有のプロフィールURL
- **要件**:
  - 短縮URL形式（app.sns-share.com/12345）
  - URLのコピー機能
  - SNSでの共有機能（LINE, X, Facebookなど）

### 2.7 公開プロフィール表示

#### 2.7.1 プロフィールページ
- **機能**: 公開プロフィールの表示
- **要件**:
  - レスポンシブデザイン（モバイル優先）
  - プロフィール基本情報の表示
  - SNSアイコングリッドの表示
  - 連絡先情報の表示
  - カスタムカラーテーマの適用

#### 2.7.2 端末最適化
- **機能**: 閲覧デバイスに合わせた最適化
- **要件**:
  - デバイス種別の自動検出（iOS/Android/デスクトップ）
  - iOS向け最適化：連絡先への直接追加機能
  - Android向け最適化：連絡先追加の最適化
  - SNSアプリへのディープリンク（可能な場合）

### 2.8 サブスクリプション機能

#### 2.8.1 トライアル機能
- **機能**: 7日間の無料トライアル
- **要件**:
  - トライアル期間の自動設定（登録時）
  - トライアル残り日数の表示
  - トライアル終了前の通知

#### 2.8.2 支払い機能
- **機能**: サブスクリプション支払い
- **要件**:
  - 月額プラン（500円）と年額プラン（5,000円）の選択
  - クレジットカード決済（Stripe連携）
  - 支払い履歴の表示
  - サブスクリプションのキャンセル機能

## 3. 非機能要件

### 3.1 パフォーマンス要件
- ページロード時間: 3秒以内
- レスポンス時間: API呼び出しは500ms以内
- QRコード生成: 1秒以内
- 画像最適化: プロフィール画像の自動リサイズと圧縮

### 3.2 セキュリティ要件
- HTTPS通信のみ許可
- パスワードのハッシュ化保存
- アクセストークンの安全な管理
- CSRF対策の実装
- XSS対策の実装

### 3.3 ユーザビリティ要件
- 5分以内で初期設定を完了できる
- スマートフォンでの片手操作に最適化
- わかりやすいエラーメッセージ
- 操作フィードバックの提供（ローディング表示、成功通知など）
- アクセシビリティガイドラインへの準拠（WCAG 2.1 AA）

### 3.4 信頼性要件
- 99.9%の稼働率
- バックアップ: 日次
- エラー検出と通知システム
- 障害からの自動復旧機能

### 3.5 拡張性要件
- 新しいSNSプラットフォームの容易な追加
- 将来的な機能拡張に対応できるアーキテクチャ
- 国際化（i18n）の基盤準備

## 4. ユーザーストーリーとアクセプタンス基準

### 4.1 ユーザー登録とプロフィール作成

#### ユーザーストーリー
**As a** 新規ユーザー  
**I want to** 簡単にアカウントを作成し、基本プロフィールを設定できる  
**So that** サービスをすぐに利用開始できる

#### アクセプタンス基準
1. ユーザーはメールアドレスとパスワードで登録できる
2. Googleアカウントを使って登録できる
3. 登録後、基本プロフィール情報（名前、画像など）を設定できる
4. 登録から5分以内にプロフィール設定が完了できる

### 4.2 SNSリンク管理

#### ユーザーストーリー
**As a** 登録済みユーザー  
**I want to** 自分のSNSアカウントをプロフィールに追加・管理できる  
**So that** 他の人が簡単に私のSNSをフォローできる

#### アクセプタンス基準
1. ユーザーは少なくとも5種類の主要SNSから選択してリンクを追加できる
2. 追加したSNSのユーザー名またはURLを入力できる
3. 各SNSのURLの入力方法についてのガイダンスが表示される
4. 追加したSNSはグリッド形式で表示され、順序の変更が可能
5. 設定したSNSリンクをタップすると、対応するSNSアプリまたはウェブサイトに移動する

### 4.3 プロフィールカスタマイズ

#### ユーザーストーリー
**As a** 登録済みユーザー  
**I want to** プロフィールの色をカスタマイズできる  
**So that** 自分の個性を表現できる

#### アクセプタンス基準
1. ユーザーはカラーピッカーを使ってメインカラーを選択できる
2. 選択した色はプロフィールデザインにリアルタイムで反映される
3. プリセットカラーから選択することもできる
4. 選択した色はプロフィールページのテーマカラーとして適用される
5. コントラストが自動的に調整され、テキストが読みやすくなる

### 4.4 プロフィール共有

#### ユーザーストーリー
**As a** 登録済みユーザー  
**I want to** 自分のプロフィールを簡単に共有できる  
**So that** 他の人が私のSNSや連絡先にすぐにアクセスできる

#### アクセプタンス基準
1. ユーザー固有のプロフィールURL（app.sns-share.com/12345形式）が生成される
2. QRコードが自動生成され、表示される
3. QRコードをPNG形式でダウンロードできる
4. ワンタップでURLをコピーできる
5. LINE、X、Facebookなどで直接共有できるボタンがある

### 4.5 プロフィール閲覧（訪問者視点）

#### ユーザーストーリー
**As a** プロフィール訪問者  
**I want to** 共有されたプロフィールを閲覧し、連絡先やSNSにアクセスできる  
**So that** 相手とすぐに繋がることができる

#### アクセプタンス基準
1. 共有URLやQRコードからプロフィールページにアクセスできる
2. プロフィールページはスマートフォンで見やすく表示される
3. SNSアイコンをタップすると、対応するアプリやウェブサイトに移動する
4. 訪問者のデバイス（iOS/Android）に最適化された操作が可能
5. 連絡先情報を簡単に保存できる

### 4.6 トライアルと支払い

#### ユーザーストーリー
**As a** トライアルユーザー  
**I want to** サービスを試し、気に入ったら簡単に有料プランに移行できる  
**So that** 継続して利用できる

#### アクセプタンス基準
1. 新規登録時に7日間の無料トライアルが自動的に開始される
2. トライアル期間中はすべての機能が利用可能
3. トライアル残り日数が明示的に表示される
4. トライアル終了前に通知がある
5. クレジットカードで簡単に支払い登録ができる
6. 月額プラン（500円）または年額プラン（5,000円）を選択できる

## 5. UI/UX仕様

### 5.1 全体的なUI設計

#### 5.1.1 配色
- **プライマリカラー**: ユーザーカスタマイズ可能（デフォルト: #3B82F6）
- **ニュートラルカラー**: グレースケール (#F9FAFB, #F3F4F6, #E5E7EB, #D1D5DB, #9CA3AF, #6B7280, #4B5563, #374151, #1F2937, #111827)
- **アクセントカラー**: エラー（#EF4444）、成功（#10B981）、警告（#F59E0B）、情報（#3B82F6）

#### 5.1.2 タイポグラフィ
- **フォントファミリー**: 
  - システムフォント（-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif）
  - 日本語: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif
- **フォントサイズ**:
  - 見出し1: 24px/1.5
  - 見出し2: 20px/1.5
  - 見出し3: 18px/1.5
  - 本文: 16px/1.5
  - 小テキスト: 14px/1.5
  - 極小テキスト: 12px/1.5

#### 5.1.3 コンポーネント
- **ボタン**: プライマリ、セカンダリ、アウトライン、