-- Add map coordinates to Contact singleton
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "mapsUrl" TEXT;

-- Populate the existing singleton with the current clinic pin
UPDATE "Contact"
SET "latitude" = -17.386471,
    "longitude" = -66.152366,
    "mapsUrl" = 'https://www.google.com/maps?q=-17.386471,-66.152366'
WHERE "singleton" = true;
