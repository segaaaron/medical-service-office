-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateTable
CREATE TABLE "Treatment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "longDescription" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "imageUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Treatment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "patientName" TEXT NOT NULL,
    "patientPhone" TEXT NOT NULL,
    "patientEmail" TEXT,
    "treatmentId" TEXT,
    "treatmentName" TEXT NOT NULL,
    "notes" TEXT,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Treatment_slug_key" ON "Treatment"("slug");

-- CreateIndex
CREATE INDEX "Treatment_category_idx" ON "Treatment"("category");

-- CreateIndex
CREATE INDEX "Treatment_active_idx" ON "Treatment"("active");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_published_idx" ON "BlogPost"("published");

-- CreateIndex
CREATE INDEX "BlogPost_publishedAt_idx" ON "BlogPost"("publishedAt");

-- CreateIndex
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");

-- CreateIndex
CREATE INDEX "Appointment_scheduledAt_idx" ON "Appointment"("scheduledAt");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "Treatment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
