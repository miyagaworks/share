-- CreateTable
CREATE TABLE "CorporateSnsLink" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "username" TEXT,
    "url" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorporateSnsLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CorporateSnsLink_tenantId_platform_key" ON "CorporateSnsLink"("tenantId", "platform");

-- AddForeignKey
ALTER TABLE "CorporateSnsLink" ADD CONSTRAINT "CorporateSnsLink_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "CorporateTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
