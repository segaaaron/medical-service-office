-- Add order column to Treatment table
ALTER TABLE "Treatment" ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS "Treatment_order_idx" ON "Treatment"("order");
