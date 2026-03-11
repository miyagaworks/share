-- AlterTable
ALTER TABLE "public"."CorporateTenant" ADD COLUMN     "partnerId" TEXT;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "partnerId" TEXT;

-- CreateTable
CREATE TABLE "public"."Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "logoUrl" TEXT,
    "logoWidth" INTEGER,
    "logoHeight" INTEGER,
    "primaryColor" TEXT NOT NULL DEFAULT '#3B82F6',
    "secondaryColor" TEXT,
    "faviconUrl" TEXT,
    "customDomain" TEXT,
    "domainVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailFromName" TEXT,
    "emailFromAddress" TEXT,
    "emailReplyTo" TEXT,
    "supportEmail" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'basic',
    "maxAccounts" INTEGER NOT NULL DEFAULT 300,
    "billingStatus" TEXT NOT NULL DEFAULT 'active',
    "billingEmail" TEXT,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "adminUserId" TEXT NOT NULL,
    "accountStatus" TEXT NOT NULL DEFAULT 'active',
    "trialEndsAt" TIMESTAMP(3),
    "companyName" TEXT,
    "companyAddress" TEXT,
    "privacyPolicyUrl" TEXT,
    "termsUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PartnerActivityLog" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Partner_slug_key" ON "public"."Partner"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_customDomain_key" ON "public"."Partner"("customDomain");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_adminUserId_key" ON "public"."Partner"("adminUserId");

-- CreateIndex
CREATE INDEX "PartnerActivityLog_partnerId_createdAt_idx" ON "public"."PartnerActivityLog"("partnerId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "public"."Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CorporateTenant" ADD CONSTRAINT "CorporateTenant_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "public"."Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Partner" ADD CONSTRAINT "Partner_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PartnerActivityLog" ADD CONSTRAINT "PartnerActivityLog_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "public"."Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
