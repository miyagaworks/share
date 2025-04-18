/*
  Warnings:

  - You are about to drop the column `corporateTenantId` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[subscriptionId]` on the table `CorporateTenant` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_corporateTenantId_fkey";

-- DropIndex
DROP INDEX "Subscription_corporateTenantId_key";

-- AlterTable
ALTER TABLE "CorporateTenant" ADD COLUMN     "subscriptionId" TEXT;

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "corporateTenantId";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role";

-- CreateIndex
CREATE UNIQUE INDEX "CorporateTenant_subscriptionId_key" ON "CorporateTenant"("subscriptionId");

-- AddForeignKey
ALTER TABLE "CorporateTenant" ADD CONSTRAINT "CorporateTenant_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
