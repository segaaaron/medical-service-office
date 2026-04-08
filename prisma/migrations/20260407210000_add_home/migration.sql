-- CreateTable
CREATE TABLE "Home" (
    "id" TEXT NOT NULL,
    "specialties" TEXT,
    "doctorName" TEXT,
    "subtitle" TEXT,
    "description" TEXT,
    "highlightedText" TEXT,
    "btn1Text" TEXT,
    "btn2Text" TEXT,
    "stat1Value" TEXT,
    "stat1Label" TEXT,
    "stat2Value" TEXT,
    "stat2Label" TEXT,
    "stat3Value" TEXT,
    "stat3Label" TEXT,
    "faqSectionLabel" TEXT,
    "faqTitle" TEXT,
    "faqs" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Home_pkey" PRIMARY KEY ("id")
);
