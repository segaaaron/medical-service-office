-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "whatsappNumber" TEXT NOT NULL,
    "whatsappUrl" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "instagramUsername" TEXT NOT NULL,
    "instagramUrl" TEXT NOT NULL,
    "facebookName" TEXT NOT NULL,
    "facebookUrl" TEXT NOT NULL,
    "mondayFridayHours" TEXT NOT NULL,
    "saturdayHours" TEXT NOT NULL,
    "sundayStatus" TEXT NOT NULL,
    "locationDescription" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);
