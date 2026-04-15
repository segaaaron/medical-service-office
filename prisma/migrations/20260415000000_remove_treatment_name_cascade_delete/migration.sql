-- Delete appointments that have no treatmentId (would violate NOT NULL constraint)
DELETE FROM "Appointment" WHERE "treatmentId" IS NULL;

-- Drop existing foreign key constraint
ALTER TABLE "Appointment" DROP CONSTRAINT IF EXISTS "Appointment_treatmentId_fkey";

-- Remove treatmentName column
ALTER TABLE "Appointment" DROP COLUMN IF EXISTS "treatmentName";

-- Make treatmentId NOT NULL
ALTER TABLE "Appointment" ALTER COLUMN "treatmentId" SET NOT NULL;

-- Re-add foreign key with CASCADE
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_treatmentId_fkey"
  FOREIGN KEY ("treatmentId") REFERENCES "Treatment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
