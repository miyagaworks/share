-- AlterTable
ALTER TABLE "CorporateTenant" ADD COLUMN     "accountStatus" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "billingAddress" JSONB,
ADD COLUMN     "billingContact" TEXT,
ADD COLUMN     "billingEmail" TEXT,
ADD COLUMN     "dataRetentionDays" INTEGER NOT NULL DEFAULT 365,
ADD COLUMN     "notificationSettings" JSONB,
ADD COLUMN     "securitySettings" JSONB;
