/*
  Warnings:

  - You are about to drop the `TouchSealItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TouchSealOrder` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."TouchSealItem" DROP CONSTRAINT "TouchSealItem_memberUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TouchSealItem" DROP CONSTRAINT "TouchSealItem_orderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TouchSealItem" DROP CONSTRAINT "TouchSealItem_qrSlug_fkey";

-- DropForeignKey
ALTER TABLE "public"."TouchSealOrder" DROP CONSTRAINT "TouchSealOrder_subscriptionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TouchSealOrder" DROP CONSTRAINT "TouchSealOrder_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TouchSealOrder" DROP CONSTRAINT "TouchSealOrder_userId_fkey";

-- DropTable
DROP TABLE "public"."TouchSealItem";

-- DropTable
DROP TABLE "public"."TouchSealOrder";

-- CreateTable
CREATE TABLE "public"."OneTapSealOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT,
    "subscriptionId" TEXT,
    "orderType" TEXT NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "shippingAddress" JSONB NOT NULL,
    "sealTotal" INTEGER NOT NULL,
    "shippingFee" INTEGER NOT NULL DEFAULT 185,
    "taxAmount" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "trackingNumber" TEXT,
    "shippedAt" TIMESTAMP(3),
    "shippedBy" TEXT,
    "stripePaymentIntentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OneTapSealOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OneTapSealItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "memberUserId" TEXT,
    "color" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL DEFAULT 550,
    "profileSlug" TEXT NOT NULL,
    "qrSlug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OneTapSealItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OneTapSealOrder_userId_idx" ON "public"."OneTapSealOrder"("userId");

-- CreateIndex
CREATE INDEX "OneTapSealOrder_tenantId_idx" ON "public"."OneTapSealOrder"("tenantId");

-- CreateIndex
CREATE INDEX "OneTapSealOrder_status_idx" ON "public"."OneTapSealOrder"("status");

-- CreateIndex
CREATE INDEX "OneTapSealOrder_orderDate_idx" ON "public"."OneTapSealOrder"("orderDate");

-- CreateIndex
CREATE INDEX "OneTapSealItem_orderId_idx" ON "public"."OneTapSealItem"("orderId");

-- CreateIndex
CREATE INDEX "OneTapSealItem_memberUserId_idx" ON "public"."OneTapSealItem"("memberUserId");

-- CreateIndex
CREATE INDEX "OneTapSealItem_profileSlug_idx" ON "public"."OneTapSealItem"("profileSlug");

-- CreateIndex
CREATE INDEX "OneTapSealItem_qrSlug_idx" ON "public"."OneTapSealItem"("qrSlug");

-- AddForeignKey
ALTER TABLE "public"."OneTapSealOrder" ADD CONSTRAINT "OneTapSealOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OneTapSealOrder" ADD CONSTRAINT "OneTapSealOrder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."CorporateTenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OneTapSealOrder" ADD CONSTRAINT "OneTapSealOrder_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OneTapSealItem" ADD CONSTRAINT "OneTapSealItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."OneTapSealOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OneTapSealItem" ADD CONSTRAINT "OneTapSealItem_memberUserId_fkey" FOREIGN KEY ("memberUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OneTapSealItem" ADD CONSTRAINT "OneTapSealItem_profileSlug_fkey" FOREIGN KEY ("profileSlug") REFERENCES "public"."Profile"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OneTapSealItem" ADD CONSTRAINT "OneTapSealItem_qrSlug_fkey" FOREIGN KEY ("qrSlug") REFERENCES "public"."QrCodePage"("slug") ON DELETE SET NULL ON UPDATE CASCADE;
