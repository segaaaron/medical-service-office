-- CreateTable
CREATE TABLE "PromoBanner" (
    "id"              TEXT NOT NULL,
    "tag"             TEXT,
    "title"           TEXT,
    "highlightedText" TEXT,
    "description"     TEXT,
    "doctorName"      TEXT,
    "location"        TEXT,
    "whatsappText"    TEXT,
    "whatsappUrl"     TEXT,
    "dismissText"     TEXT,
    "imageUrl"        TEXT,
    "active"          BOOLEAN NOT NULL DEFAULT true,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoBanner_pkey" PRIMARY KEY ("id")
);
