-- AlterTable
ALTER TABLE "job_downtime_logs" ADD COLUMN     "stageId" TEXT;

-- CreateTable
CREATE TABLE "qc_responses" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "responseText" TEXT,
    "passed" BOOLEAN,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qc_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "qc_responses_stageId_questionId_key" ON "qc_responses"("stageId", "questionId");

-- AddForeignKey
ALTER TABLE "qc_responses" ADD CONSTRAINT "qc_responses_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "job_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_responses" ADD CONSTRAINT "qc_responses_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "blueprint_qc_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

