-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('pending', 'approved', 'deleted');

-- CreateTable: reviews
CREATE TABLE "reviews" (
    "id"           UUID         NOT NULL DEFAULT gen_random_uuid(),
    "patient_name" VARCHAR(100) NOT NULL,
    "treatment"    VARCHAR(150),
    "body"         TEXT         NOT NULL,
    "rating"       SMALLINT     NOT NULL,
    "status"       "ReviewStatus" NOT NULL DEFAULT 'pending',
    "ip_hash"      VARCHAR(64),
    "created_at"   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at"  TIMESTAMPTZ,
    "deleted_at"   TIMESTAMPTZ,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable: rate_limits
CREATE TABLE "rate_limits" (
    "ip_hash"  VARCHAR(64) NOT NULL,
    "count"    SMALLINT    NOT NULL DEFAULT 1,
    "reset_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("ip_hash")
);

-- CreateIndex: reviews
CREATE INDEX "reviews_status_idx"    ON "reviews"("status");
CREATE INDEX "reviews_created_at_idx" ON "reviews"("created_at" DESC);
CREATE INDEX "reviews_status_approved_at_idx" ON "reviews"("status", "approved_at" DESC);
