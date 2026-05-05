-- Migrate existing RECEPTIONIST users to ADMIN before removing the enum value
UPDATE "User" SET role = 'ADMIN' WHERE role = 'RECEPTIONIST';

-- PostgreSQL does not support DROP VALUE on enums; recreate the type
ALTER TABLE "User" ALTER COLUMN role DROP DEFAULT;

CREATE TYPE "Role_new" AS ENUM ('ADMIN');

ALTER TABLE "User"
  ALTER COLUMN role TYPE "Role_new"
  USING role::text::"Role_new";

ALTER TABLE "User" ALTER COLUMN role SET DEFAULT 'ADMIN'::"Role_new";

DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";
