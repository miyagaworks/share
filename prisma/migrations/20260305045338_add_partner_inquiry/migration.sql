-- CreateTable
CREATE TABLE "public"."PartnerInquiry" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "preferences" TEXT[],
    "consultationDate1" TEXT,
    "consultationDate2" TEXT,
    "consultationDate3" TEXT,
    "question" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "notes" TEXT,

    CONSTRAINT "PartnerInquiry_pkey" PRIMARY KEY ("id")
);
