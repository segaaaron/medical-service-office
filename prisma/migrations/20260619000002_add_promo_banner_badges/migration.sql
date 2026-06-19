-- Add optional badges field (comma-separated offer chips) to PromoBanner
ALTER TABLE "PromoBanner" ADD COLUMN IF NOT EXISTS "badges" TEXT;
