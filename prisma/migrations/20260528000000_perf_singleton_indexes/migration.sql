-- Add singleton field to all single-record models (atomic upsert support)
ALTER TABLE "Contact" ADD COLUMN "singleton" BOOLEAN NOT NULL DEFAULT true;
CREATE UNIQUE INDEX "Contact_singleton_key" ON "Contact"("singleton");

ALTER TABLE "Footer" ADD COLUMN "singleton" BOOLEAN NOT NULL DEFAULT true;
CREATE UNIQUE INDEX "Footer_singleton_key" ON "Footer"("singleton");

ALTER TABLE "Home" ADD COLUMN "singleton" BOOLEAN NOT NULL DEFAULT true;
CREATE UNIQUE INDEX "Home_singleton_key" ON "Home"("singleton");

ALTER TABLE "PromoBanner" ADD COLUMN "singleton" BOOLEAN NOT NULL DEFAULT true;
CREATE UNIQUE INDEX "PromoBanner_singleton_key" ON "PromoBanner"("singleton");

ALTER TABLE "AboutUs" ADD COLUMN "singleton" BOOLEAN NOT NULL DEFAULT true;
CREATE UNIQUE INDEX "AboutUs_singleton_key" ON "AboutUs"("singleton");

-- Compound index: RefreshToken cleanup query (userId + expiresAt)
CREATE INDEX "RefreshToken_userId_expiresAt_idx" ON "RefreshToken"("userId", "expiresAt");

-- Compound index: Treatment list ordered by active+order
CREATE INDEX "Treatment_active_order_idx" ON "Treatment"("active", "order");

-- Index: BlogPost list ordered by createdAt DESC
CREATE INDEX "BlogPost_createdAt_idx" ON "BlogPost"("createdAt");
