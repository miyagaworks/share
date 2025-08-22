# ファイル修正時の重要な指示

## 基本原則
修正が必要な箇所のみを変更し、関係のない部分は一切触らないでください。

## 必須の作業手順
1. 完全な理解が最優先
   - ファイル全体を詳細に読み込み、コードの構造と機能を完全に把握してください
   - 各関数やクラスの役割、依存関係を理解してください
   - 既存のロジックやアルゴリズムの意図を正確に把握してください

影響範囲の明確化
修正要求の具体的な範囲を特定してください
どの部分が修正対象で、どの部分が対象外かを明確にしてください
修正による他の部分への影響を慎重に検討してください

変更の最小化
修正要求に直接関係する部分のみを変更してください
「改善」や「最適化」と思われる変更も、明示的に要求されていない限り行わないでください
既存のコーディングスタイルや命名規則を維持してください

## 絶対に避けるべき行為
❌ 要求されていない「改善」や「リファクタリング」
❌ 変数名や関数名の勝手な変更
❌ コメントの削除や変更
❌ インデントやフォーマットの変更
❌ ライブラリのインポート文の変更
❌ 設定値やパラメータの変更
❌ エラーハンドリング方法の変更
❌ 既存のアルゴリズムやロジックの変更

## 変更前の確認事項
- [ ] ファイル全体を読み、既存の機能を理解しましたか？
- [ ] 修正箇所が明確に特定できていますか？
- [ ] 修正による影響範囲を把握していますか？
- [ ] 既存の動作を壊す可能性がないことを確認しましたか？

## 回答形式
修正を行う際は、以下の形式で回答してください：

【修正内容の説明】
- 修正箇所：[具体的な行数や関数名]
- 修正理由：[要求された内容]
- 影響範囲：[変更による影響]

【変更したコード】
[修正した部分のみ]

【確認事項】
- 関係のない部分は一切変更していません
- 既存の機能に影響を与えません
## 重要な注意
「より良いコード」にしようとする善意の変更も、明示的に要求されていない限り絶対に行わないでください。既存のコードが動作している場合、それには理由があります。

tree -I 'node_modules|.git|.next|dist|build'

share/
├── actions
│   ├── corporateSns.ts
│   ├── jikogene.ts
│   ├── profile.ts
│   ├── sns.ts
│   └── user.ts
├── app
│   ├── [slug]
│   │   └── page.tsx
│   ├── api
│   │   ├── address
│   │   │   └── search
│   │   │       └── route.ts
│   │   ├── admin
│   │   │   ├── access
│   │   │   │   └── route.ts
│   │   │   ├── cancel-requests
│   │   │   │   ├── [id]
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── company-expenses
│   │   │   │   └── route.ts
│   │   │   ├── email
│   │   │   │   ├── history
│   │   │   │   │   ├── [id]
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── financial
│   │   │   │   └── dashboard
│   │   │   │       └── route.ts
│   │   │   ├── financial-admins
│   │   │   │   └── route.ts
│   │   │   ├── fix-permanent-users
│   │   │   │   └── route.ts
│   │   │   ├── grant-permanent
│   │   │   │   └── route.ts
│   │   │   ├── monthly-settlement
│   │   │   │   └── route.ts
│   │   │   ├── notifications
│   │   │   │   ├── [id]
│   │   │   │   │   └── route.ts
│   │   │   │   ├── create
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── one-tap-seal
│   │   │   │   └── orders
│   │   │   │       ├── [id]
│   │   │   │       │   └── route.ts
│   │   │   │       └── route.ts
│   │   │   ├── permissions
│   │   │   │   └── route.ts
│   │   │   ├── profile
│   │   │   │   └── route.ts
│   │   │   ├── profiles
│   │   │   │   └── route.ts
│   │   │   ├── revenue-adjustment
│   │   │   │   └── route.ts
│   │   │   ├── stripe
│   │   │   │   ├── revenue
│   │   │   │   │   ├── fetch
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   ├── settings
│   │   │   │   │   └── route.ts
│   │   │   │   └── webhook-logs
│   │   │   │       └── route.ts
│   │   │   ├── subscriptions
│   │   │   │   └── route.ts
│   │   │   ├── system-info
│   │   │   │   └── route.ts
│   │   │   └── users
│   │   │       ├── delete
│   │   │       │   └── route.ts
│   │   │       ├── export
│   │   │       │   └── route.ts
│   │   │       ├── route.ts
│   │   │       └── search
│   │   │           └── route.ts
│   │   ├── auth
│   │   │   ├── [...nextauth]
│   │   │   │   └── route.ts
│   │   │   ├── callback
│   │   │   │   └── google
│   │   │   │       └── route.ts
│   │   │   ├── change-password
│   │   │   │   └── route.ts
│   │   │   ├── dashboard-redirect
│   │   │   │   └── route.ts
│   │   │   ├── debug
│   │   │   │   └── route.ts
│   │   │   ├── error
│   │   │   │   └── route.ts
│   │   │   ├── forgot-password
│   │   │   │   └── route.ts
│   │   │   ├── providers
│   │   │   │   └── route.ts
│   │   │   ├── register
│   │   │   │   └── route.ts
│   │   │   ├── reset-password
│   │   │   │   └── route.ts
│   │   │   ├── send-verification-email
│   │   │   │   └── route.ts
│   │   │   ├── session
│   │   │   │   └── route.ts
│   │   │   ├── set-password
│   │   │   │   └── route.ts
│   │   │   ├── signin
│   │   │   │   └── route.ts
│   │   │   ├── verify-email
│   │   │   │   └── route.ts
│   │   │   └── verify-reset-token
│   │   │       └── route.ts
│   │   ├── corporate
│   │   │   ├── access
│   │   │   │   └── route.ts
│   │   │   ├── activity
│   │   │   │   └── route.ts
│   │   │   ├── admin
│   │   │   │   └── transfer
│   │   │   │       └── route.ts
│   │   │   ├── branding
│   │   │   │   └── route.ts
│   │   │   ├── departments
│   │   │   │   ├── [id]
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── members
│   │   │   │   └── qr-slugs
│   │   │   │       └── route.ts
│   │   │   ├── settings
│   │   │   │   ├── delete
│   │   │   │   │   └── route.ts
│   │   │   │   ├── export
│   │   │   │   │   └── route.ts
│   │   │   │   ├── reactivate
│   │   │   │   │   └── route.ts
│   │   │   │   ├── route.ts
│   │   │   │   └── suspend
│   │   │   │       └── route.ts
│   │   │   ├── sns
│   │   │   │   ├── [id]
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── tenant
│   │   │   │   └── route.ts
│   │   │   └── users
│   │   │       ├── [id]
│   │   │       │   ├── resend-invite
│   │   │       │   │   └── route.ts
│   │   │       │   └── route.ts
│   │   │       ├── invite
│   │   │       │   ├── accept
│   │   │       │   │   └── route.ts
│   │   │       │   ├── info
│   │   │       │   │   └── route.ts
│   │   │       │   └── route.ts
│   │   │       └── route.ts
│   │   ├── corporate-member
│   │   │   ├── design
│   │   │   │   └── route.ts
│   │   │   ├── links
│   │   │   │   ├── custom
│   │   │   │   │   ├── [id]
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   ├── route.ts
│   │   │   │   └── sns
│   │   │   │       ├── [id]
│   │   │   │       │   └── route.ts
│   │   │   │       └── route.ts
│   │   │   ├── profile
│   │   │   │   ├── route.ts
│   │   │   │   └── update
│   │   │   │       └── route.ts
│   │   │   └── share
│   │   │       └── route.ts
│   │   ├── corporate-profile
│   │   │   ├── route.ts
│   │   │   └── update
│   │   │       └── route.ts
│   │   ├── cron
│   │   │   └── trial-notification
│   │   │       ├── cleanup-idempotency
│   │   │       │   └── route.ts
│   │   │       └── route.ts
│   │   ├── debug-auth
│   │   │   └── route.ts
│   │   ├── jikogene
│   │   │   └── route.ts
│   │   ├── links
│   │   │   ├── custom
│   │   │   │   ├── [id]
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── route.ts
│   │   │   └── sns
│   │   │       ├── [id]
│   │   │       │   └── route.ts
│   │   │       └── route.ts
│   │   ├── notifications
│   │   │   ├── read
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   ├── one-tap-seal
│   │   │   ├── create-payment-intent
│   │   │   │   └── route.ts
│   │   │   ├── order
│   │   │   │   └── route.ts
│   │   │   ├── orders
│   │   │   │   └── route.ts
│   │   │   └── validate-qr
│   │   │       └── route.ts
│   │   ├── profile
│   │   │   ├── route.ts
│   │   │   ├── share
│   │   │   │   └── route.ts
│   │   │   └── update
│   │   │       └── route.ts
│   │   ├── qr-image
│   │   │   └── route.ts
│   │   ├── qrcode
│   │   │   ├── [slug]
│   │   │   │   └── route.ts
│   │   │   ├── check-slug
│   │   │   │   └── route.ts
│   │   │   ├── create
│   │   │   │   └── route.ts
│   │   │   ├── route.ts
│   │   │   └── update
│   │   │       └── [id]
│   │   │           └── route.ts
│   │   ├── route-config.ts
│   │   ├── subscription
│   │   │   ├── cancel
│   │   │   │   └── route.ts
│   │   │   ├── cancel-request
│   │   │   │   └── route.ts
│   │   │   ├── create
│   │   │   │   └── route.ts
│   │   │   ├── reactivate
│   │   │   │   └── route.ts
│   │   │   ├── route.ts
│   │   │   └── verify-payment
│   │   │       └── route.ts
│   │   ├── support
│   │   │   └── contact
│   │   │       └── route.ts
│   │   ├── system
│   │   │   └── connection-status
│   │   │       └── route.ts
│   │   ├── test-db
│   │   │   └── route.ts
│   │   ├── test-email
│   │   │   └── route.ts
│   │   ├── test-financial
│   │   ├── user
│   │   │   ├── [userId]
│   │   │   │   └── profile
│   │   │   │       └── route.ts
│   │   │   ├── check-email-verification
│   │   │   │   └── route.ts
│   │   │   ├── check-password
│   │   │   │   └── route.ts
│   │   │   ├── dashboard-info
│   │   │   │   └── route.ts
│   │   │   ├── delete
│   │   │   │   └── route.ts
│   │   │   └── permanent-plan-type
│   │   │       └── route.ts
│   │   ├── vcard
│   │   │   └── [userId]
│   │   │       └── route.ts
│   │   └── webhook
│   │       ├── stripe
│   │       │   └── route.ts
│   │       └── stripe.ts
│   ├── auth
│   │   ├── change-password
│   │   │   └── page.tsx
│   │   ├── email-verification
│   │   │   └── page.tsx
│   │   ├── error
│   │   │   └── page.tsx
│   │   ├── forgot-password
│   │   │   └── page.tsx
│   │   ├── invite
│   │   │   └── page.tsx
│   │   ├── reset-password
│   │   │   └── page.tsx
│   │   ├── set-password
│   │   │   └── page.tsx
│   │   ├── signin
│   │   │   └── page.tsx
│   │   └── signup
│   │       └── page.tsx
│   ├── company
│   │   ├── about
│   │   │   └── page.tsx
│   │   └── service
│   │       └── page.tsx
│   ├── dashboard
│   │   ├── account
│   │   │   └── delete
│   │   │       └── page.tsx
│   │   ├── admin
│   │   │   ├── cancel-requests
│   │   │   │   └── page.tsx
│   │   │   ├── company-expenses
│   │   │   │   └── page.tsx
│   │   │   ├── contractor-payments
│   │   │   │   └── page.tsx
│   │   │   ├── email
│   │   │   │   └── page.tsx
│   │   │   ├── financial
│   │   │   │   └── page.tsx
│   │   │   ├── financial-admins
│   │   │   │   └── page.tsx
│   │   │   ├── notifications
│   │   │   │   └── page.tsx
│   │   │   ├── one-tap-seal-orders
│   │   │   │   └── page.tsx
│   │   │   ├── page.tsx
│   │   │   ├── permissions
│   │   │   │   ├── fix-permanent-button.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── profile
│   │   │   │   └── page.tsx
│   │   │   ├── profiles
│   │   │   │   └── page.tsx
│   │   │   ├── stripe
│   │   │   │   └── revenue
│   │   │   │       └── page.tsx
│   │   │   ├── subscriptions
│   │   │   │   └── page.tsx
│   │   │   └── users
│   │   │       ├── export
│   │   │       │   └── page.tsx
│   │   │       └── page.tsx
│   │   ├── client-script.js
│   │   ├── corporate
│   │   │   ├── branding
│   │   │   │   └── page.tsx
│   │   │   ├── departments
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── onboarding
│   │   │   │   └── page.tsx
│   │   │   ├── page.tsx
│   │   │   ├── settings
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── sns
│   │   │   │   ├── components
│   │   │   │   │   ├── CorporateSnsAddForm.tsx
│   │   │   │   │   ├── CorporateSnsDeleteConfirm.tsx
│   │   │   │   │   ├── CorporateSnsEditForm.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── page.tsx
│   │   │   │   ├── types.ts
│   │   │   │   └── utils.ts
│   │   │   └── users
│   │   │       ├── invite
│   │   │       │   └── page.tsx
│   │   │       └── page.tsx
│   │   ├── corporate-member
│   │   │   ├── design
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── links
│   │   │   │   └── page.tsx
│   │   │   ├── page.tsx
│   │   │   ├── profile
│   │   │   │   └── page.tsx
│   │   │   └── share
│   │   │       ├── page.tsx
│   │   │       └── qrcode
│   │   │           └── page.tsx
│   │   ├── design
│   │   │   └── page.tsx
│   │   ├── layout-optimized.tsx
│   │   ├── layout.tsx
│   │   ├── links
│   │   │   ├── components
│   │   │   │   ├── ClientCustomForm.tsx
│   │   │   │   ├── ClientCustomWrapper.tsx
│   │   │   │   ├── ClientSnsForm.tsx
│   │   │   │   ├── CustomLinkClient.tsx
│   │   │   │   ├── CustomLinkEditForm.tsx
│   │   │   │   ├── index.ts
│   │   │   │   ├── SnsLinkClientWrapper.tsx
│   │   │   │   ├── SnsLinkEditForm.tsx
│   │   │   │   └── SnsLinkManager.tsx
│   │   │   └── page.tsx
│   │   ├── page.tsx
│   │   ├── profile
│   │   │   └── page.tsx
│   │   ├── share
│   │   │   └── page.tsx
│   │   └── subscription
│   │       ├── page.tsx
│   │       └── success
│   │           └── page.tsx
│   ├── error.tsx
│   ├── favicon.ico
│   ├── globals.css
│   ├── globals.css.backup
│   ├── jikogene
│   │   ├── components
│   │   │   ├── FormSteps
│   │   │   │   ├── BasicInfo.tsx
│   │   │   │   ├── Hobbies.tsx
│   │   │   │   ├── Keywords.tsx
│   │   │   │   ├── OutputOptions.tsx
│   │   │   │   └── Personality.tsx
│   │   │   ├── IntroductionForm.tsx
│   │   │   ├── JikogeneContent.tsx
│   │   │   ├── Result.tsx
│   │   │   └── StepIndicator.tsx
│   │   ├── hooks
│   │   │   └── useIntroductionForm.ts
│   │   ├── layout.tsx
│   │   ├── lib
│   │   │   └── constants.tsx
│   │   ├── page.tsx
│   │   └── types.ts
│   ├── layout.tsx
│   ├── layout.tsx.backup
│   ├── legal
│   │   ├── privacy
│   │   │   └── page.tsx
│   │   ├── terms
│   │   │   └── page.tsx
│   │   └── transactions
│   │       └── page.tsx
│   ├── not-found.tsx
│   ├── page.tsx
│   ├── qr
│   │   └── [slug]
│   │       ├── page.tsx
│   │       └── QrCodeClient.tsx
│   ├── qrcode
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── styles
│   │   ├── base
│   │   │   └── variables.css
│   │   ├── components
│   │   │   └── buttons.css
│   │   ├── dark-mode
│   │   ├── layouts
│   │   └── themes
│   └── support
│       ├── contact
│       │   ├── ContactPageContent.tsx
│       │   └── page.tsx
│       ├── faq
│       │   └── page.tsx
│       └── help
│           └── page.tsx
├── auth.config.ts
├── auth.ts
├── backup_before_migration_20250816.sql
├── components
│   ├── admin
│   │   └── GrantPermanentAccess.tsx
│   ├── corporate
│   │   ├── ActivityFeed.tsx
│   │   ├── BrandingPreview.tsx
│   │   ├── CorporateSnsIntegration.tsx
│   │   ├── EnhancedBrandingPreview.tsx
│   │   ├── ImprovedBrandingPreview.tsx
│   │   ├── ImprovedMemberDesignSettings.tsx
│   │   ├── MemberProfileForm.tsx
│   │   ├── MemberShareSettings.tsx
│   │   ├── MemberSnsManager.tsx
│   │   ├── OptimizedActivityFeed.tsx
│   │   ├── QrCodeGenerator.tsx
│   │   └── SuspendedBanner.tsx
│   ├── dashboard
│   │   ├── CustomLinkClient.tsx
│   │   ├── CustomLinkList.tsx
│   │   ├── ImprovedDashboardPage.tsx
│   │   ├── ImprovedDesignPreview.tsx
│   │   ├── ImprovedSnsLinkList.tsx
│   │   ├── PersonalShareSettings.tsx
│   │   ├── QrCodeClient.tsx
│   │   ├── ShareOptionClient.tsx
│   │   └── SubscriptionOverview.tsx
│   ├── debug
│   │   ├── NetworkDiagnostic.tsx
│   │   ├── SessionDebug.tsx
│   │   ├── SigninDebug.tsx
│   │   └── SigninDebugOverlay.tsx
│   ├── forms
│   │   ├── CustomLinkForm.tsx
│   │   ├── ImprovedDesignForm.tsx
│   │   ├── ProfileForm.tsx
│   │   └── SNSLinkFormWithGuideIntegration.tsx
│   ├── guards
│   │   ├── CorporateAccessGuard.tsx
│   │   ├── CorporateAdminGuard.tsx
│   │   └── CorporateMemberGuard.tsx
│   ├── layout
│   │   ├── AuthLayout.tsx
│   │   ├── DashboardHeader.tsx
│   │   ├── DashboardLayout.tsx
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   ├── MobileFooter.tsx
│   │   ├── MobileMenuButton.tsx
│   │   ├── NotificationBell.tsx
│   │   ├── PageLayout.tsx
│   │   └── Sidebar.tsx
│   ├── one-tap-seal
│   │   ├── AddressSearchInput.tsx
│   │   ├── OneTapSealColorSelector.tsx
│   │   ├── OneTapSealOrderForm.tsx
│   │   ├── OneTapSealOrderSummary.tsx
│   │   ├── OneTapSealSection.tsx
│   │   ├── OneTapSealStripeCheckout.tsx
│   │   ├── OneTapSealUrlManager.tsx
│   │   └── ShippingAddressForm.tsx
│   ├── profile
│   │   ├── ProfileCustomLink.tsx
│   │   └── ProfileSnsLink.tsx
│   ├── providers
│   │   ├── QueryProvider.tsx
│   │   ├── SessionProvider.tsx
│   │   └── ToastProvider.tsx
│   ├── qrcode
│   │   ├── QrCodeGenerator.tsx
│   │   └── QrCodePreview.tsx
│   ├── RecaptchaWrapper.tsx
│   ├── shared
│   │   ├── AuthDebugger.tsx
│   │   ├── Breadcrumb.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── ErrorMessage.tsx
│   │   ├── FaqItem.tsx
│   │   ├── FaqSection.tsx
│   │   ├── ImprovedSnsIcon.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── SnsGuideModalWithDescription.tsx
│   ├── subscription
│   │   ├── CancelRequestForm.tsx
│   │   ├── CorporateSubscriptionRedirect.tsx
│   │   ├── EnhancedTrialBanner.tsx
│   │   ├── PaymentMethodForm.tsx
│   │   ├── PlanBanner.tsx
│   │   ├── SubscriptionSettings.tsx
│   │   ├── SubscriptionSettingsWithSeal.tsx
│   │   ├── SubscriptionStatus.tsx
│   │   ├── SubscriptionWithOneTapSeal.tsx
│   │   └── TrialBanner.tsx
│   └── ui
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── CorporateBranding.tsx
│       ├── DashboardCard.tsx
│       ├── DepartmentBadge.tsx
│       ├── Dialog.tsx
│       ├── EnhancedColorPicker.tsx
│       ├── ImageUpload.tsx
│       ├── Input.tsx
│       ├── OptimizedMenuCard.tsx
│       ├── QuickIntroButton.tsx
│       ├── SimpleFooter.tsx
│       ├── Spinner.tsx
│       └── Tabs.tsx
├── docs
│   ├── corporate-member-dashboard-plan.md
│   ├── corporate-plan.md
│   ├── development-process.md
│   ├── mvp-requirements.md
│   ├── mvp-technical-design.md
│   ├── one_tap_seal_feature_plan.md
│   ├── progress-tracking.md
│   ├── project-overview.md
│   ├── security-privacy-plan.md
│   ├── share_ディレクトリ構造.md
│   ├── share-next-development-plan.md
│   ├── share-project-plan.md
│   ├── share-roadmap.md
│   ├── sns-share-strategy-complete.md
│   ├── treeコマンド.md
│   ├── ui-design-plan.md
│   ├── ui-plan.md
│   └── white-label-solution.md
├── eslint.config.mjs
├── hooks
│   ├── useActivityFeed.ts
│   ├── useCorporateAccess.ts
│   ├── useCorporateData.ts
│   ├── useDashboardInfo.ts
│   ├── useOptimizedActivity.ts
│   ├── useOptimizedProfile.ts
│   ├── useOptimizedTenant.ts
│   └── usePlanInfo.ts
├── lib
│   ├── address
│   │   ├── address-validator.ts
│   │   └── zipcloud-api.ts
│   ├── corporateAccess
│   │   ├── adminAccess.ts
│   │   ├── api.ts
│   │   ├── index.ts
│   │   ├── permanentAccess.ts
│   │   ├── state.ts
│   │   ├── storage.ts
│   │   └── virtualTenant.ts
│   ├── db-manager.ts
│   ├── email
│   │   ├── index.ts
│   │   └── templates
│   │       ├── admin-notification.ts
│   │       ├── cancel-request.ts
│   │       ├── email-verification.ts
│   │       ├── expense-approval-result.ts
│   │       ├── expense-approval.ts
│   │       ├── grace-period-expired.ts
│   │       ├── invite-email.ts
│   │       └── trial-ending.ts
│   ├── email.ts
│   ├── errorHandler.ts
│   ├── feature-config.ts
│   ├── jikogene
│   │   ├── ai-service.ts
│   │   ├── env.ts
│   │   ├── fallback-generator.ts
│   │   ├── prompt-builder.ts
│   │   └── validator.ts
│   ├── one-tap-seal
│   │   ├── order-calculator.ts
│   │   └── qr-slug-manager.ts
│   ├── prisma.ts
│   ├── profit-allocation.ts
│   ├── react-query.ts
│   ├── stripe-revenue.ts
│   ├── stripe.ts
│   ├── stripeClient.ts
│   ├── subscription-integrity.ts
│   ├── utils
│   │   ├── activity-logger.ts
│   │   ├── admin-access-api.ts
│   │   ├── admin-access-server.ts
│   │   ├── admin-access.ts
│   │   ├── admin-permissions.ts
│   │   ├── api.ts
│   │   ├── corporate-access-server.ts
│   │   ├── corporate-access.ts
│   │   ├── corporate-access.ts.backup
│   │   ├── emailVerification.ts
│   │   ├── expense-email.ts
│   │   ├── idempotency.ts
│   │   ├── logger.ts
│   │   ├── notification-helpers.ts
│   │   ├── performance-monitor.ts
│   │   ├── subscription-server.ts
│   │   ├── subscription.ts
│   │   ├── subscription.ts.backup
│   │   └── validation.ts
│   └── utils.ts
├── middleware
│   ├── checkTenantStatus.ts
│   ├── emailVerificationHandler.ts
│   ├── permanentAccessHandler.ts
│   └── prisma-connection-handler.ts
├── middleware.ts
├── next-env.d.ts
├── next.config.mjs
├── package-lock.json
├── package.json
├── pnpm-lock.yaml
├── postcss.config.mjs
├── prisma
│   ├── migrations
│   │   ├── 20250305082024_init
│   │   │   └── migration.sql
│   │   ├── 20250316042754_add_company_url_fields
│   │   │   └── migration.sql
│   │   ├── 20250316110841_add_sns_icon_color
│   │   │   └── migration.sql
│   │   ├── 20250319212940_add_subscription_models
│   │   │   └── migration.sql
│   │   ├── 20250321231535_add_trial_fields
│   │   │   └── migration.sql
│   │   ├── 20250402234039_add_password_reset_tokens
│   │   │   └── migration.sql
│   │   ├── 20250406131630_add_contact_model
│   │   │   └── migration.sql
│   │   ├── 20250407000850_fix_corporate_tenant_relations
│   │   │   └── migration.sql
│   │   ├── 20250407062009_add_corporate_settings
│   │   │   └── migration.sql
│   │   ├── 20250412092956_add_corporate_sns_links
│   │   │   └── migration.sql
│   │   ├── 20250418012935_add_role_column
│   │   │   └── migration.sql
│   │   ├── 20250418030605_restore_subscription_id_field
│   │   │   └── migration.sql
│   │   ├── 20250421024324_add_header_text_and_color
│   │   │   └── migration.sql
│   │   ├── 20250501013140_add_logo_dimensions
│   │   │   └── migration.sql
│   │   ├── 20250501021655_add_text_settings_to_tenant
│   │   │   └── migration.sql
│   │   ├── 20250501034600_remove_text_settings_from_user
│   │   │   └── migration.sql
│   │   ├── 20250501121519_remove_description_from_corporate_sns
│   │   │   └── migration.sql
│   │   ├── 20250501150000_add_bio_customization
│   │   │   └── migration.sql
│   │   ├── 20250814054714_add_touch_seal_models
│   │   │   └── migration.sql
│   │   └── migration_lock.toml
│   └── schema.prisma
├── public
│   ├── bereal.svg
│   ├── favicon.svg
│   ├── file.svg
│   ├── globe.svg
│   ├── google-logo.svg
│   ├── images
│   │   ├── guides
│   │   │   ├── bereal-step1.png
│   │   │   ├── bereal-step2.png
│   │   │   ├── bereal-step3.png
│   │   │   ├── facebook-step1.png
│   │   │   ├── facebook-step2.png
│   │   │   ├── facebook-step3.png
│   │   │   ├── facebook-step4.png
│   │   │   ├── instagram-step1.png
│   │   │   ├── instagram-step2.png
│   │   │   ├── line-step1.png
│   │   │   ├── line-step2.png
│   │   │   ├── line-step3.png
│   │   │   ├── line-step4.png
│   │   │   ├── lineofi-step1.png
│   │   │   ├── lineofi-step2.png
│   │   │   ├── lineofi-step3.png
│   │   │   ├── note-step1.png
│   │   │   ├── note-step2.png
│   │   │   ├── pinterest-step1.png
│   │   │   ├── pinterest-step2.png
│   │   │   ├── pinterest-step3.png
│   │   │   ├── pinterest-step4.png
│   │   │   ├── threads-step1.png
│   │   │   ├── tiktok-step1.png
│   │   │   ├── tiktok-step2.png
│   │   │   ├── x-step1.png
│   │   │   ├── x-step2.png
│   │   │   ├── youtube-step1.png
│   │   │   ├── youtube-step2.png
│   │   │   ├── youtube-step3.png
│   │   │   └── youtube-step4.png
│   │   ├── icons
│   │   │   ├── addition_iphone.svg
│   │   │   ├── home_android.svg
│   │   │   ├── home_iphone.svg
│   │   │   ├── menu_android.svg
│   │   │   ├── ogp_line.png
│   │   │   ├── ogp.png
│   │   │   └── share_iphone.svg
│   │   ├── nfc
│   │   │   ├── 3colors.png
│   │   │   └── reading.png
│   │   └── usecase
│   │       ├── business-scene.png
│   │       ├── business-scene.webp
│   │       ├── creator-scene.png
│   │       ├── creator-scene.webp
│   │       ├── daily-scene.png
│   │       ├── daily-scene.webp
│   │       ├── event-scene.png
│   │       └── event-scene.webp
│   ├── jikogene.svg
│   ├── line.svg
│   ├── logo_blue.svg
│   ├── logo_share.svg
│   ├── logo_white.svg
│   ├── logo.svg
│   ├── manifest.json
│   ├── next.svg
│   ├── note.svg
│   ├── pixiv.svg
│   ├── pwa
│   │   ├── android-chrome-192x192.png
│   │   ├── android-chrome-512x512.png
│   │   ├── apple-touch-icon-152x152.png
│   │   ├── apple-touch-icon-167x167.png
│   │   ├── apple-touch-icon-180x180.png
│   │   ├── apple-touch-icon.png
│   │   ├── favicon-16x16.png
│   │   ├── favicon-32x32.png
│   │   ├── favicon-48x48.png
│   │   ├── favicon-96x96.png
│   │   └── favicon.ico
│   ├── qr-sw.js
│   ├── qrcode-manifest.json
│   ├── sw.js
│   ├── vercel.svg
│   └── window.svg
├── README.md
├── schemas
│   └── auth.ts
├── scripts
│   └── cleanup-debug-code.sh
├── share_db_backup.sql
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.tsbuildinfo
├── types
│   ├── financial-admin.ts
│   ├── next-auth.d.ts
│   ├── one-tap-seal.ts
│   ├── prisma-extensions.ts
│   ├── profiles.ts
│   ├── recaptcha.d.ts
│   ├── sns-guide.ts
│   ├── sns.ts
│   ├── tinycolor2.d.ts
│   └── user.ts
└── vercel.json