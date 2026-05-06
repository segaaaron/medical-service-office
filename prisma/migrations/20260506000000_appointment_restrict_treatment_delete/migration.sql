-- Change Appointment→Treatment relation from CASCADE to RESTRICT
-- Prevents deleting a treatment that has associated appointments

ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_treatmentId_fkey";
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_treatmentId_fkey"
  FOREIGN KEY ("treatmentId") REFERENCES "Treatment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
