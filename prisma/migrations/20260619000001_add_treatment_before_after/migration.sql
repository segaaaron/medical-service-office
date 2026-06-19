-- Add optional before/after image columns to Treatment (same storage as image_url)
ALTER TABLE "Treatment" ADD COLUMN IF NOT EXISTS "before_image_url" TEXT;
ALTER TABLE "Treatment" ADD COLUMN IF NOT EXISTS "after_image_url" TEXT;
