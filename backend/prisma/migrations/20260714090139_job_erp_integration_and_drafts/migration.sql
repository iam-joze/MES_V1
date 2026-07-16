-- CreateEnum
CREATE TYPE "JobSource" AS ENUM ('MANUAL', 'ERP');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'ERP';

-- AlterTable
ALTER TABLE "job_stages" ADD COLUMN     "instruction" TEXT,
ADD COLUMN     "requiresQc" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "actualProducedQty" INTEGER,
ADD COLUMN     "actualScrapQty" INTEGER,
ADD COLUMN     "batchNumber" TEXT,
ADD COLUMN     "externalWorkOrderId" TEXT,
ADD COLUMN     "source" "JobSource" NOT NULL DEFAULT 'MANUAL';

-- CreateTable
CREATE TABLE "job_material_requirements" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "qtyPerUnit" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "totalRequired" DOUBLE PRECISION NOT NULL,
    "wastagePct" DOUBLE PRECISION,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_material_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_downtime_logs" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_downtime_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "jobs_externalWorkOrderId_key" ON "jobs"("externalWorkOrderId");

-- AddForeignKey
ALTER TABLE "job_material_requirements" ADD CONSTRAINT "job_material_requirements_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_downtime_logs" ADD CONSTRAINT "job_downtime_logs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

