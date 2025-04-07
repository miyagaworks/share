share/
├── README.md
├── actions
│   ├── jikogene.ts
│   ├── profile.ts
│   ├── sns.ts
│   └── user.ts
├── app
│   ├── [slug]
│   │   └── page.tsx
│   ├── api
│   │   ├── auth
│   │   │   ├── [...nextauth]
│   │   │   │   └── route.ts
│   │   │   ├── change-password
│   │   │   │   └── route.ts
│   │   │   ├── forgot-password
│   │   │   │   └── route.ts
│   │   │   ├── register
│   │   │   │   └── route.ts
│   │   │   ├── reset-password
│   │   │   │   └── route.ts
│   │   │   └── verify-reset-token
│   │   │       └── route.ts
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
│   │   ├── profile
│   │   │   └── route.ts
│   │   ├── subscription
│   │   │   ├── cancel
│   │   │   │   └── route.ts
│   │   │   ├── change-plan
│   │   │   │   └── route.ts
│   │   │   ├── create
│   │   │   │   └── route.ts
│   │   │   ├── reactivate
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   ├── support
│   │   │   └── contact
│   │   │       └── route.ts
│   │   ├── user
│   │   │   ├── check-password
│   │   │   │   └── route.ts
│   │   │   └── delete
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
│   │   ├── client-script.js
│   │   ├── design
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   ├── links
│   │   │   ├── LinkClientWrapper.tsx
│   │   │   ├── components
│   │   │   │   ├── ClientCustomForm.tsx
│   │   │   │   ├── ClientCustomWrapper.tsx
│   │   │   │   ├── ClientSnsForm.tsx
│   │   │   │   ├── CustomLinkClient.tsx
│   │   │   │   ├── CustomLinkEditForm.tsx
│   │   │   │   ├── SnsLinkClient.tsx
│   │   │   │   ├── SnsLinkEditForm.tsx
│   │   │   │   └── index.ts
│   │   │   └── page.tsx
│   │   ├── page.tsx
│   │   ├── profile
│   │   │   └── page.tsx
│   │   ├── share
│   │   │   └── page.tsx
│   │   └── subscription
│   │       └── page.tsx
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
│   ├── page.tsx
│   └── support
│       ├── contact
│       │   └── page.tsx
│       ├── faq
│       │   └── page.tsx
│       └── help
│           └── page.tsx
├── auth.config.ts
├── auth.ts
├── components
│   ├── dashboard
│   │   ├── CustomLinkClient.tsx
│   │   ├── CustomLinkList.tsx
│   │   ├── DesignPreview.tsx
│   │   ├── ImprovedDesignPreview.tsx
│   │   ├── ImprovedSnsLinkList.tsx
│   │   ├── ProfileUrlDisplay.tsx
│   │   ├── QrCodeClient.tsx
│   │   ├── ShareOptionClient.tsx
│   │   ├── SnsLinkClient.tsx
│   │   └── SubscriptionOverview.tsx
│   ├── forms
│   │   ├── CustomLinkForm.tsx
│   │   ├── DesignForm.tsx
│   │   ├── ImprovedDesignForm.tsx
│   │   ├── ProfileForm.tsx
│   │   └── SNSLinkFormWithGuideIntegration.tsx
│   ├── layout
│   │   ├── AuthLayout.tsx
│   │   ├── DashboardHeader.tsx
│   │   ├── DashboardLayout.tsx
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   ├── PageLayout.tsx
│   │   └── Sidebar.tsx
│   ├── profile
│   │   ├── ProfileCustomLink.tsx
│   │   └── ProfileSnsLink.tsx
│   ├── providers
│   │   ├── SessionProvider.tsx
│   │   └── ToastProvider.tsx
│   ├── shared
│   │   ├── Breadcrumb.tsx
│   │   ├── ErrorMessage.tsx
│   │   ├── FaqItem.tsx
│   │   ├── FaqSection.tsx
│   │   ├── ImprovedSnsIcon.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── SnsGuideModalWithDescription.tsx
│   ├── subscription
│   │   ├── PaymentMethodForm.tsx
│   │   ├── SubscriptionSettings.tsx
│   │   ├── SubscriptionStatus.tsx
│   │   └── TrialBanner.tsx
│   └── ui
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── DashboardCard.tsx
│       ├── Dialog.tsx
│       ├── EnhancedColorPicker.tsx
│       ├── ImageUpload.tsx
│       ├── Input.tsx
│       ├── QuickIntroButton.tsx
│       ├── SimpleFooter.tsx
│       ├── Spinner.tsx
│       └── Tabs.tsx
├── docs
│   ├── corporate-plan.md
│   ├── development-process.md
│   ├── mvp-requirements.md
│   ├── mvp-technical-design.md
│   ├── progress-tracking.md
│   ├── project-overview.md
│   ├── security-privacy-plan.md
│   ├── share-next-development-plan.md
│   ├── share-project-plan.md
│   ├── share-roadmap.md
│   ├── share_ディレクトリ構造.md
│   ├── sns-share-strategy-complete.md
│   ├── treeコマンド
│   ├── ui-design-plan.md
│   ├── ui-plan.md
│   └── white-label-solution.md
├── eslint.config.mjs
├── lib
│   ├── email.ts
│   ├── jikogene
│   │   ├── ai-service.ts
│   │   ├── env.ts
│   │   ├── fallback-generator.ts
│   │   ├── prompt-builder.ts
│   │   └── validator.ts
│   ├── prisma.ts
│   ├── stripe.ts
│   ├── stripeClient.ts
│   ├── utils
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── colorUtils.ts
│   │   └── validation.ts
│   └── utils.ts
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
│   │   └── migration_lock.toml
│   └── schema.prisma
├── providers
├── public
│   ├── bereal.svg
│   ├── favicon.ico
│   ├── favicon.svg
│   ├── file.svg
│   ├── globe.svg
│   ├── google-logo.svg
│   ├── images
│   │   └── guides
│   │       ├── bereal-step1.png
│   │       ├── bereal-step2.png
│   │       ├── bereal-step3.png
│   │       ├── facebook-step1.png
│   │       ├── facebook-step2.png
│   │       ├── facebook-step3.png
│   │       ├── facebook-step4.png
│   │       ├── instagram-step1.png
│   │       ├── instagram-step2.png
│   │       ├── line-step1.png
│   │       ├── line-step2.png
│   │       ├── line-step3.png
│   │       ├── line-step4.png
│   │       ├── note-step1.png
│   │       ├── note-step2.png
│   │       ├── pinterest-step1.png
│   │       ├── pinterest-step2.png
│   │       ├── pinterest-step3.png
│   │       ├── pinterest-step4.png
│   │       ├── threads-step1.png
│   │       ├── tiktok-step1.png
│   │       ├── tiktok-step2.png
│   │       ├── x-step1.png
│   │       ├── x-step2.png
│   │       ├── youtube-step1.png
│   │       ├── youtube-step2.png
│   │       ├── youtube-step3.png
│   │       └── youtube-step4.png
│   ├── jikogene.svg
│   ├── line.svg
│   ├── logo.svg
│   ├── logo_blue.svg
│   ├── logo_white.svg
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
│   │   └── apple-touch-icon.png
│   ├── vercel.svg
│   └── window.svg
├── schemas
│   └── auth.ts
├── scripts
│   ├── create-missing-subscriptions.ts
│   ├── generate-prisma-migration.js
│   └── setup-guide-images.mjs
├── share_db_backup.sql
├── tsconfig.json
└── types
    ├── next-auth.d.ts
    ├── prisma-extensions.ts
    ├── sns-guide.ts
    ├── sns.ts
    └── tinycolor2.d.ts


