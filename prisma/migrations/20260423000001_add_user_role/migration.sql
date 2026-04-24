-- CreateEnum Role (if not exists)
DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('ADMIN', 'RECEPTIONIST');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddColumn role to User (if not exists)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" "Role" NOT NULL DEFAULT 'RECEPTIONIST';
