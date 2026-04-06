-- AlterTable
ALTER TABLE "Treatment" ADD COLUMN "tag" TEXT;
ALTER TABLE "Treatment" ALTER COLUMN "price" DROP NOT NULL;
ALTER TABLE "Treatment" ALTER COLUMN "category" DROP NOT NULL;

-- DropIndex
DROP INDEX IF EXISTS "Treatment_category_idx";
