-- AlterTable
ALTER TABLE "CorporateTenant" ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "interval" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "firstNameKana" TEXT,
ADD COLUMN     "headerText" TEXT,
ADD COLUMN     "isFinancialAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "lastNameKana" TEXT,
ADD COLUMN     "nameKana" TEXT,
ADD COLUMN     "textColor" TEXT;

-- CreateTable
CREATE TABLE "CorporateActivityLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CorporateActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QrCodePage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "profileUrl" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL,
    "secondaryColor" TEXT NOT NULL,
    "accentColor" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "lastAccessed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "textColor" TEXT,
    "nameEn" TEXT,

    CONSTRAINT "QrCodePage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "imageUrl" TEXT,
    "startDate" TIMESTAMPTZ(6) NOT NULL,
    "endDate" TIMESTAMPTZ(6),
    "targetGroup" TEXT NOT NULL DEFAULT 'all',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationRead" (
    "id" UUID NOT NULL,
    "notificationId" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "readAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "NotificationRead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminEmailLog" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "targetGroup" TEXT NOT NULL,
    "ctaText" TEXT,
    "ctaUrl" TEXT,
    "sentCount" INTEGER NOT NULL,
    "failCount" INTEGER NOT NULL,
    "sentBy" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminEmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyRequest" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdempotencyRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CancelRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "requestedCancelDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "currentPlan" TEXT NOT NULL,
    "currentInterval" TEXT NOT NULL,
    "paidAmount" INTEGER NOT NULL,
    "refundAmount" INTEGER NOT NULL,
    "usedMonths" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "adminNotes" TEXT,
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CancelRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialAdmin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "addedBy" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialRecord" (
    "id" TEXT NOT NULL,
    "recordType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "category" TEXT NOT NULL,
    "recordDate" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "isAutoImported" BOOLEAN NOT NULL DEFAULT false,
    "feeAmount" DECIMAL(65,30),
    "netAmount" DECIMAL(65,30),
    "contractorId" TEXT,
    "needsApproval" BOOLEAN NOT NULL DEFAULT false,
    "approvalStatus" TEXT NOT NULL DEFAULT 'approved',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "inputBy" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "editHistory" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlySettlement" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "totalRevenue" INTEGER NOT NULL,
    "totalExpenses" INTEGER NOT NULL,
    "profit" INTEGER NOT NULL,
    "contractorShare" INTEGER NOT NULL,
    "yoshitsuneShare" INTEGER NOT NULL,
    "yoshitsunePercent" DOUBLE PRECISION NOT NULL DEFAULT 15.0,
    "kenseiShare" INTEGER NOT NULL,
    "kenseiPercent" DOUBLE PRECISION NOT NULL DEFAULT 15.0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "finalizedBy" TEXT,
    "finalizedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlySettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueShareAdjustment" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "adjustmentType" TEXT NOT NULL,
    "targetPerson" TEXT NOT NULL,
    "originalPercent" DOUBLE PRECISION NOT NULL,
    "adjustedPercent" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "proposedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevenueShareAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialAccessLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeTransaction" (
    "id" TEXT NOT NULL,
    "stripePaymentId" TEXT NOT NULL,
    "stripeChargeId" TEXT,
    "stripeCustomerId" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'jpy',
    "description" TEXT,
    "customerEmail" TEXT,
    "stripeFeeAmount" DECIMAL(65,30) NOT NULL,
    "stripeFeeRate" DECIMAL(65,30) NOT NULL,
    "netAmount" DECIMAL(65,30) NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "settledDate" TIMESTAMP(3),
    "actualSettledDate" TIMESTAMP(3),
    "subscriptionType" TEXT,
    "planName" TEXT,
    "status" TEXT NOT NULL,
    "refundAmount" DECIMAL(65,30),
    "refundReason" TEXT,
    "stripeMetadata" JSONB,
    "webhookProcessed" BOOLEAN NOT NULL DEFAULT false,
    "financialRecordId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StripeTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyExpense" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "category" TEXT NOT NULL,
    "subCategory" TEXT,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "expenseType" TEXT NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringCycle" TEXT,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "approvalStatus" TEXT NOT NULL DEFAULT 'approved',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvalComments" TEXT,
    "rejectionReason" TEXT,
    "paymentMethod" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'paid',
    "paidDate" TIMESTAMP(3),
    "invoiceNumber" TEXT,
    "receiptUrl" TEXT,
    "attachmentUrls" JSONB,
    "taxIncluded" BOOLEAN NOT NULL DEFAULT true,
    "taxRate" DECIMAL(65,30),
    "taxAmount" DECIMAL(65,30),
    "financialRecordId" TEXT,
    "inputBy" TEXT NOT NULL,
    "editHistory" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyProfitSummary" (
    "id" TEXT NOT NULL,
    "targetYear" INTEGER NOT NULL,
    "targetMonth" INTEGER NOT NULL,
    "totalRevenue" DECIMAL(65,30) NOT NULL,
    "stripeTransactionCount" INTEGER NOT NULL,
    "averageTransactionAmount" DECIMAL(65,30) NOT NULL,
    "totalStripeFees" DECIMAL(65,30) NOT NULL,
    "averageFeeRate" DECIMAL(65,30) NOT NULL,
    "totalCompanyExpenses" DECIMAL(65,30) NOT NULL,
    "totalContractorExpenses" DECIMAL(65,30) NOT NULL,
    "totalExpenses" DECIMAL(65,30) NOT NULL,
    "grossProfit" DECIMAL(65,30) NOT NULL,
    "netProfit" DECIMAL(65,30) NOT NULL,
    "profitMargin" DECIMAL(65,30) NOT NULL,
    "totalAllocations" DECIMAL(65,30) NOT NULL,
    "remainingProfit" DECIMAL(65,30) NOT NULL,
    "isFinalized" BOOLEAN NOT NULL DEFAULT false,
    "finalizedAt" TIMESTAMP(3),
    "finalizedBy" TEXT,
    "revenueBreakdown" JSONB,
    "expenseBreakdown" JSONB,
    "allocationBreakdown" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyProfitSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeWebhookLog" (
    "id" TEXT NOT NULL,
    "stripeEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventData" JSONB NOT NULL,
    "processingStatus" TEXT NOT NULL DEFAULT 'pending',
    "processingResult" TEXT,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdTransactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StripeWebhookLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoSyncSettings" (
    "id" TEXT NOT NULL,
    "stripeAutoSync" BOOLEAN NOT NULL DEFAULT true,
    "syncFrequency" TEXT NOT NULL DEFAULT 'realtime',
    "lastSyncAt" TIMESTAMP(3),
    "defaultStripeFeeRate" DECIMAL(65,30) NOT NULL DEFAULT 0.036,
    "notifyOnLargeTransaction" BOOLEAN NOT NULL DEFAULT true,
    "largeTransactionThreshold" DECIMAL(65,30) NOT NULL DEFAULT 100000,
    "updatedBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutoSyncSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TouchSealOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT,
    "subscriptionId" TEXT,
    "orderType" TEXT NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "postalCode" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "sealTotal" INTEGER NOT NULL,
    "shippingFee" INTEGER NOT NULL DEFAULT 200,
    "taxAmount" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "trackingNumber" TEXT,
    "shippedAt" TIMESTAMP(3),
    "shippedBy" TEXT,
    "stripePaymentIntentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TouchSealOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TouchSealItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "memberUserId" TEXT,
    "color" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL DEFAULT 500,
    "qrSlug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TouchSealItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CorporateActivityLog_tenantId_createdAt_idx" ON "CorporateActivityLog"("tenantId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "CorporateActivityLog_userId_idx" ON "CorporateActivityLog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "QrCodePage_slug_key" ON "QrCodePage"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationRead_notificationId_user_id_key" ON "NotificationRead"("notificationId", "user_id");

-- CreateIndex
CREATE INDEX "AdminEmailLog_sentBy_idx" ON "AdminEmailLog"("sentBy");

-- CreateIndex
CREATE INDEX "AdminEmailLog_targetGroup_idx" ON "AdminEmailLog"("targetGroup");

-- CreateIndex
CREATE INDEX "AdminEmailLog_sentAt_idx" ON "AdminEmailLog"("sentAt");

-- CreateIndex
CREATE INDEX "IdempotencyRequest_expiresAt_idx" ON "IdempotencyRequest"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_userId_key" ON "EmailVerificationToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_token_key" ON "EmailVerificationToken"("token");

-- CreateIndex
CREATE INDEX "CancelRequest_userId_idx" ON "CancelRequest"("userId");

-- CreateIndex
CREATE INDEX "CancelRequest_status_idx" ON "CancelRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialAdmin_userId_key" ON "FinancialAdmin"("userId");

-- CreateIndex
CREATE INDEX "FinancialAdmin_userId_idx" ON "FinancialAdmin"("userId");

-- CreateIndex
CREATE INDEX "FinancialAdmin_addedBy_idx" ON "FinancialAdmin"("addedBy");

-- CreateIndex
CREATE INDEX "FinancialAdmin_isActive_idx" ON "FinancialAdmin"("isActive");

-- CreateIndex
CREATE INDEX "FinancialRecord_recordType_recordDate_idx" ON "FinancialRecord"("recordType", "recordDate");

-- CreateIndex
CREATE INDEX "FinancialRecord_sourceType_isAutoImported_idx" ON "FinancialRecord"("sourceType", "isAutoImported");

-- CreateIndex
CREATE INDEX "FinancialRecord_contractorId_idx" ON "FinancialRecord"("contractorId");

-- CreateIndex
CREATE INDEX "FinancialRecord_approvalStatus_idx" ON "FinancialRecord"("approvalStatus");

-- CreateIndex
CREATE INDEX "FinancialRecord_type_date_idx" ON "FinancialRecord"("type", "date");

-- CreateIndex
CREATE INDEX "MonthlySettlement_year_month_idx" ON "MonthlySettlement"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlySettlement_year_month_key" ON "MonthlySettlement"("year", "month");

-- CreateIndex
CREATE INDEX "RevenueShareAdjustment_year_month_idx" ON "RevenueShareAdjustment"("year", "month");

-- CreateIndex
CREATE INDEX "RevenueShareAdjustment_targetPerson_idx" ON "RevenueShareAdjustment"("targetPerson");

-- CreateIndex
CREATE INDEX "FinancialAccessLog_userId_createdAt_idx" ON "FinancialAccessLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "FinancialAccessLog_action_createdAt_idx" ON "FinancialAccessLog"("action", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "StripeTransaction_stripePaymentId_key" ON "StripeTransaction"("stripePaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "StripeTransaction_stripeChargeId_key" ON "StripeTransaction"("stripeChargeId");

-- CreateIndex
CREATE UNIQUE INDEX "StripeTransaction_financialRecordId_key" ON "StripeTransaction"("financialRecordId");

-- CreateIndex
CREATE INDEX "StripeTransaction_transactionDate_idx" ON "StripeTransaction"("transactionDate");

-- CreateIndex
CREATE INDEX "StripeTransaction_status_idx" ON "StripeTransaction"("status");

-- CreateIndex
CREATE INDEX "StripeTransaction_subscriptionType_idx" ON "StripeTransaction"("subscriptionType");

-- CreateIndex
CREATE INDEX "StripeTransaction_webhookProcessed_idx" ON "StripeTransaction"("webhookProcessed");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyExpense_financialRecordId_key" ON "CompanyExpense"("financialRecordId");

-- CreateIndex
CREATE INDEX "CompanyExpense_category_expenseDate_idx" ON "CompanyExpense"("category", "expenseDate");

-- CreateIndex
CREATE INDEX "CompanyExpense_expenseType_idx" ON "CompanyExpense"("expenseType");

-- CreateIndex
CREATE INDEX "CompanyExpense_approvalStatus_idx" ON "CompanyExpense"("approvalStatus");

-- CreateIndex
CREATE INDEX "CompanyExpense_paymentStatus_idx" ON "CompanyExpense"("paymentStatus");

-- CreateIndex
CREATE INDEX "MonthlyProfitSummary_targetYear_targetMonth_idx" ON "MonthlyProfitSummary"("targetYear", "targetMonth");

-- CreateIndex
CREATE INDEX "MonthlyProfitSummary_isFinalized_idx" ON "MonthlyProfitSummary"("isFinalized");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyProfitSummary_targetYear_targetMonth_key" ON "MonthlyProfitSummary"("targetYear", "targetMonth");

-- CreateIndex
CREATE UNIQUE INDEX "StripeWebhookLog_stripeEventId_key" ON "StripeWebhookLog"("stripeEventId");

-- CreateIndex
CREATE INDEX "StripeWebhookLog_eventType_processingStatus_idx" ON "StripeWebhookLog"("eventType", "processingStatus");

-- CreateIndex
CREATE INDEX "StripeWebhookLog_createdAt_idx" ON "StripeWebhookLog"("createdAt");

-- CreateIndex
CREATE INDEX "TouchSealOrder_userId_idx" ON "TouchSealOrder"("userId");

-- CreateIndex
CREATE INDEX "TouchSealOrder_tenantId_idx" ON "TouchSealOrder"("tenantId");

-- CreateIndex
CREATE INDEX "TouchSealOrder_status_idx" ON "TouchSealOrder"("status");

-- CreateIndex
CREATE INDEX "TouchSealOrder_orderDate_idx" ON "TouchSealOrder"("orderDate");

-- CreateIndex
CREATE INDEX "TouchSealItem_orderId_idx" ON "TouchSealItem"("orderId");

-- CreateIndex
CREATE INDEX "TouchSealItem_memberUserId_idx" ON "TouchSealItem"("memberUserId");

-- CreateIndex
CREATE INDEX "TouchSealItem_qrSlug_idx" ON "TouchSealItem"("qrSlug");

-- AddForeignKey
ALTER TABLE "CorporateActivityLog" ADD CONSTRAINT "CorporateActivityLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "CorporateTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateActivityLog" ADD CONSTRAINT "CorporateActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrCodePage" ADD CONSTRAINT "QrCodePage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRead" ADD CONSTRAINT "NotificationRead_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminEmailLog" ADD CONSTRAINT "AdminEmailLog_sentBy_fkey" FOREIGN KEY ("sentBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancelRequest" ADD CONSTRAINT "CancelRequest_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancelRequest" ADD CONSTRAINT "CancelRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialAdmin" ADD CONSTRAINT "FinancialAdmin_addedBy_fkey" FOREIGN KEY ("addedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialAdmin" ADD CONSTRAINT "FinancialAdmin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialRecord" ADD CONSTRAINT "FinancialRecord_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialRecord" ADD CONSTRAINT "FinancialRecord_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlySettlement" ADD CONSTRAINT "MonthlySettlement_finalizedBy_fkey" FOREIGN KEY ("finalizedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueShareAdjustment" ADD CONSTRAINT "RevenueShareAdjustment_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueShareAdjustment" ADD CONSTRAINT "RevenueShareAdjustment_proposedBy_fkey" FOREIGN KEY ("proposedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialAccessLog" ADD CONSTRAINT "FinancialAccessLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StripeTransaction" ADD CONSTRAINT "StripeTransaction_financialRecordId_fkey" FOREIGN KEY ("financialRecordId") REFERENCES "FinancialRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyExpense" ADD CONSTRAINT "CompanyExpense_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyExpense" ADD CONSTRAINT "CompanyExpense_financialRecordId_fkey" FOREIGN KEY ("financialRecordId") REFERENCES "FinancialRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyExpense" ADD CONSTRAINT "CompanyExpense_inputBy_fkey" FOREIGN KEY ("inputBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TouchSealOrder" ADD CONSTRAINT "TouchSealOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TouchSealOrder" ADD CONSTRAINT "TouchSealOrder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "CorporateTenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TouchSealOrder" ADD CONSTRAINT "TouchSealOrder_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TouchSealItem" ADD CONSTRAINT "TouchSealItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "TouchSealOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TouchSealItem" ADD CONSTRAINT "TouchSealItem_memberUserId_fkey" FOREIGN KEY ("memberUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TouchSealItem" ADD CONSTRAINT "TouchSealItem_qrSlug_fkey" FOREIGN KEY ("qrSlug") REFERENCES "QrCodePage"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;
