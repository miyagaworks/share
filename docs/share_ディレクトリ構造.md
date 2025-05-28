# 重要事項！！
## ベストプラクティスな選択の上、コード生成を行うようにして下さい。
## Editにアップロードしたファイルでは不十分な場合、ディレクトリ構造（全てのファイル）から必要なファイルをリクエストして下さい。
## ファイル共有が不十分で状況が分からないうちはコードは絶対に書かないでください。
## 全ての状況を完璧に把握してから回答を出して下さい。

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
│   │   ├── admin
│   │   │   ├── access
│   │   │   │   └── route.ts
│   │   │   ├── email
│   │   │   │   ├── history
│   │   │   │   │   ├── [id]
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── fix-permanent-users
│   │   │   │   └── route.ts
│   │   │   ├── grant-permanent
│   │   │   │   └── route.ts
│   │   │   ├── notifications
│   │   │   │   ├── [id]
│   │   │   │   │   └── route.ts
│   │   │   │   ├── create
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── permissions
│   │   │   │   └── route.ts
│   │   │   ├── subscriptions
│   │   │   │   └── route.ts
│   │   │   └── users
│   │   │       ├── delete
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
│   │   │   ├── session
│   │   │   │   └── route.ts
│   │   │   ├── signin
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
│   │   │   ├── links
│   │   │   │   └── route.ts
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
│   │   │   │   └── [id]
│   │   │   │       └── route.ts
│   │   │   ├── route.ts
│   │   │   └── sns
│   │   │       └── [id]
│   │   │           └── route.ts
│   │   ├── notifications
│   │   │   ├── read
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   ├── profile
│   │   │   ├── route.ts
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
│   │   │   ├── create
│   │   │   │   └── route.ts
│   │   │   ├── reactivate
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   ├── support
│   │   │   └── contact
│   │   │       └── route.ts
│   │   ├── system
│   │   │   └── connection-status
│   │   │       └── route.ts
│   │   ├── test
│   │   │   └── route.ts
│   │   ├── test-db
│   │   │   └── route.ts
│   │   ├── test-email
│   │   │   └── route.ts
│   │   ├── user
│   │   │   ├── [userId]
│   │   │   │   └── profile
│   │   │   │       └── route.ts
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
│   │       └── stripe
│   │           └── route.ts
│   ├── auth
│   │   ├── change-password
│   │   │   └── page.tsx
│   │   ├── error
│   │   │   └── page.tsx
│   │   ├── forgot-password
│   │   │   └── page.tsx
│   │   ├── invite
│   │   │   └── page.tsx
│   │   ├── reset-password
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
│   │   │   ├── email
│   │   │   │   └── page.tsx
│   │   │   ├── notifications
│   │   │   │   └── page.tsx
│   │   │   ├── page.tsx
│   │   │   ├── permissions
│   │   │   │   ├── fix-permanent-button.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── subscriptions
│   │   │   │   └── page.tsx
│   │   │   └── users
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
│   │   ├── corporate-profile
│   │   │   ├── design
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── profile
│   │   │       └── page.tsx
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
│   │   ├── subscription
│   │   │   └── page.tsx
│   │   └── test-optimization
│   │       └── page.tsx
│   ├── debug
│   │   └── session
│   │       └── route.ts
│   ├── error.tsx
│   ├── favicon.ico
│   ├── globals.css
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
│   │       └── page.tsx
│   ├── qrcode
│   │   ├── layout.tsx
│   │   └── page.tsx
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
│   │   ├── ProfileUrlDisplay.tsx
│   │   ├── QrCodeClient.tsx
│   │   ├── ShareOptionClient.tsx
│   │   └── SubscriptionOverview.tsx
│   ├── forms
│   │   ├── CustomLinkForm.tsx
│   │   ├── ImprovedDesignForm.tsx
│   │   ├── ProfileForm.tsx
│   │   └── SNSLinkFormWithGuideIntegration.tsx
│   ├── guards
│   │   ├── CorporateAccessGuard.tsx
│   │   └── CorporateMemberGuard.tsx
│   ├── layout
│   │   ├── AuthLayout.tsx
│   │   ├── DashboardHeader.tsx
│   │   ├── DashboardLayout.tsx
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   ├── MobileMenuButton.tsx
│   │   ├── NotificationBell.tsx
│   │   ├── PageLayout.tsx
│   │   └── Sidebar.tsx
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
│   │   ├── CorporateSubscriptionRedirect.tsx
│   │   ├── PaymentMethodForm.tsx
│   │   ├── PlanBanner.tsx
│   │   ├── SubscriptionSettings.tsx
│   │   ├── SubscriptionStatus.tsx
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
│   ├── progress-tracking.md
│   ├── project-overview.md
│   ├── security-privacy-plan.md
│   ├── share_ディレクトリ構造.md
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
│   ├── usePlanInfo.ts
│   └── useTestDashboardInfo.ts
├── lib
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
│   │   └── templates
│   │       ├── admin-notification.ts
│   │       ├── grace-period-expired.ts
│   │       ├── invite-email.ts
│   │       └── trial-ending.ts
│   ├── email.ts
│   ├── errorHandler.ts
│   ├── jikogene
│   │   ├── ai-service.ts
│   │   ├── env.ts
│   │   ├── fallback-generator.ts
│   │   ├── prompt-builder.ts
│   │   └── validator.ts
│   ├── prisma.ts
│   ├── react-query.ts
│   ├── stripe.ts
│   ├── stripeClient.ts
│   ├── utils
│   │   ├── activity-logger.ts
│   │   ├── admin-access.ts
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── corporate-access.ts
│   │   ├── idempotency.ts
│   │   ├── logger.ts
│   │   ├── notification-helpers.ts
│   │   ├── performance-monitor.ts
│   │   ├── subscription.ts
│   │   └── validation.ts
│   └── utils.ts
├── manifest.json
├── middleware
│   ├── checkTenantStatus.ts
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
│   │   └── migration_lock.toml
│   └── schema.prisma
├── public
│   ├── bereal.svg
│   ├── favicon.ico
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
│   │   │   ├── ogp_line.png
│   │   │   └── ogp.png
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
│   ├── vercel.svg
│   └── window.svg
├── qr-sw.js
├── qrcode-manifest.json
├── README.md
├── schemas
│   └── auth.ts
├── scripts
│   ├── check-user-relations.ts
│   ├── clean-corporate-sns-username.ts
│   ├── compare-schema.js
│   ├── create-missing-subscriptions.ts
│   ├── delete-user.ts
│   ├── fix-corporate-access.ts
│   ├── fix-tenant-relations.ts
│   ├── generate-prisma-migration.js
│   ├── migrate-subscription-plans.ts
│   ├── migrate-text-settings.ts
│   ├── normalize-individual-plans.ts
│   ├── rollback-optimization.sh
│   ├── set-trial-end-date.mjs
│   ├── setup-guide-images.mjs
│   ├── test-cron-fetch.mjs
│   ├── test-email.js
│   ├── test-optimization.sh
│   └── update-permanent-users-plan.ts
├── share_db_backup.sql
├── sw.js
├── tailwind.config.js
├── tsconfig.json
├── types
│   ├── next-auth.d.ts
│   ├── prisma-extensions.ts
│   ├── profiles.ts
│   ├── sns-guide.ts
│   ├── sns.ts
│   ├── tinycolor2.d.ts
│   └── user.ts
└── vercel.json