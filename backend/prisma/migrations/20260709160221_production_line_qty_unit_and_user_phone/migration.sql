-- AlterTable
ALTER TABLE "production_lines" ADD COLUMN     "targetQuantity" INTEGER,
ADD COLUMN     "unit" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phone" TEXT;
