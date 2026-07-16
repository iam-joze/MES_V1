-- CreateTable
CREATE TABLE "scrap_logs" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "stageId" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "wasteType" TEXT NOT NULL,
    "notes" TEXT,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scrap_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "scrap_logs" ADD CONSTRAINT "scrap_logs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scrap_logs" ADD CONSTRAINT "scrap_logs_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "job_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

