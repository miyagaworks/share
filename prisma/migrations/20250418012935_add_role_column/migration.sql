/*
  Warnings:

  - You are about to drop the column `subscriptionId` on the `CorporateTenant` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[corporateTenantId]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "CorporateTenant" DROP CONSTRAINT "CorporateTenant_subscriptionId_fkey";

-- DropIndex
DROP INDEX "CorporateTenant_subscriptionId_key";

-- AlterTable
ALTER TABLE "CorporateTenant" DROP COLUMN "subscriptionId";

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "corporateTenantId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'user';

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_corporateTenantId_key" ON "Subscription"("corporateTenantId");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_corporateTenantId_fkey" FOREIGN KEY ("corporateTenantId") REFERENCES "CorporateTenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
