-- DropIndex
DROP INDEX "production_lines_managerId_key";

-- AlterTable
ALTER TABLE "production_lines" ADD COLUMN     "targetDate" TIMESTAMP(3),
ADD COLUMN     "targetProduct" TEXT;

-- CreateIndex
CREATE INDEX "production_lines_managerId_idx" ON "production_lines"("managerId");
