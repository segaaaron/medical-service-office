-- Drop unused longDescription column from Treatment table
ALTER TABLE "Treatment" DROP COLUMN IF EXISTS "longDescription";
