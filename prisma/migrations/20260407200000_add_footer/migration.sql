-- CreateTable
CREATE TABLE "Footer" (
    "id" TEXT NOT NULL,
    "doctorName" TEXT,
    "specialty" TEXT,
    "description" TEXT,
    "whatsappUrl" TEXT,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "facialTreatments" JSONB,
    "bodyTreatments" JSONB,
    "officeLinks" JSONB,
    "legalLinks" JSONB,
    "copyrightText" TEXT,
    "designedByText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Footer_pkey" PRIMARY KEY ("id")
);
