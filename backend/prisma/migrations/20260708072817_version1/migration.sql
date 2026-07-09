-- CreateEnum
CREATE TYPE "Role" AS ENUM ('EXECUTIVE', 'MANAGER', 'OPERATOR');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StageStatus" AS ENUM ('PENDING', 'AVAILABLE', 'RUNNING', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "FaultSeverity" AS ENUM ('CRITICAL', 'MINOR');

-- CreateEnum
CREATE TYPE "QuantityInputFrequency" AS ENUM ('ONCE', 'PER_BATCH', 'HOURLY');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "credentialHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_lines" (
    "id" TEXT NOT NULL,
    "lineCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "managerId" TEXT,

    CONSTRAINT "production_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blueprints" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "stationTag" TEXT,
    "estimatedDurationMinutes" INTEGER NOT NULL DEFAULT 0,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "guidelinesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "guidelinesContent" TEXT,
    "checklistEnabled" BOOLEAN NOT NULL DEFAULT false,
    "checklistValidationTiming" TEXT,
    "quantityLoggingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "qcFormEnabled" BOOLEAN NOT NULL DEFAULT false,
    "faultCategoriesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blueprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blueprint_quantities" (
    "id" TEXT NOT NULL,
    "blueprintId" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "unitLabel" TEXT NOT NULL,
    "minValue" DOUBLE PRECISION,
    "maxValue" DOUBLE PRECISION,
    "inputFrequency" "QuantityInputFrequency" NOT NULL DEFAULT 'PER_BATCH',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blueprint_quantities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blueprint_checklist_items" (
    "id" TEXT NOT NULL,
    "blueprintId" TEXT NOT NULL,
    "itemText" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blueprint_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blueprint_qc_questions" (
    "id" TEXT NOT NULL,
    "blueprintId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "responseType" TEXT NOT NULL,
    "numericMinValue" DOUBLE PRECISION,
    "numericMaxValue" DOUBLE PRECISION,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blueprint_qc_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blueprint_fault_categories" (
    "id" TEXT NOT NULL,
    "blueprintId" TEXT NOT NULL,
    "faultName" TEXT NOT NULL,
    "severity" "FaultSeverity" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blueprint_fault_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productName" TEXT,
    "targetQuantity" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'Units',
    "status" "JobStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "targetDate" TIMESTAMP(3),
    "scheduledStartAt" TIMESTAMP(3),
    "scheduledEndAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "lineId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_stages" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "blueprintId" TEXT,
    "stageOrder" INTEGER NOT NULL,
    "stageName" TEXT NOT NULL,
    "estimatedDurationMinutes" INTEGER NOT NULL DEFAULT 0,
    "stationTag" TEXT,
    "status" "StageStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "operatorId" TEXT,
    "scheduledStartAt" TIMESTAMP(3),
    "scheduledEndAt" TIMESTAMP(3),
    "actualStartedAt" TIMESTAMP(3),
    "actualEndedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "process_sessions" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "operatorId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "process_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch_entries" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "batchNumber" INTEGER NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantityData" JSONB NOT NULL,
    "notes" TEXT,

    CONSTRAINT "batch_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fault_logs" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "stageId" TEXT,
    "operatorId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "severity" "FaultSeverity" NOT NULL,
    "category" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolutionNotes" TEXT,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fault_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_identifier_key" ON "users"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "production_lines_lineCode_key" ON "production_lines"("lineCode");

-- CreateIndex
CREATE UNIQUE INDEX "production_lines_managerId_key" ON "production_lines"("managerId");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_jobId_key" ON "jobs"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "job_stages_jobId_stageOrder_key" ON "job_stages"("jobId", "stageOrder");

-- CreateIndex
CREATE UNIQUE INDEX "batch_entries_sessionId_batchNumber_key" ON "batch_entries"("sessionId", "batchNumber");

-- AddForeignKey
ALTER TABLE "production_lines" ADD CONSTRAINT "production_lines_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blueprint_quantities" ADD CONSTRAINT "blueprint_quantities_blueprintId_fkey" FOREIGN KEY ("blueprintId") REFERENCES "blueprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blueprint_checklist_items" ADD CONSTRAINT "blueprint_checklist_items_blueprintId_fkey" FOREIGN KEY ("blueprintId") REFERENCES "blueprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blueprint_qc_questions" ADD CONSTRAINT "blueprint_qc_questions_blueprintId_fkey" FOREIGN KEY ("blueprintId") REFERENCES "blueprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blueprint_fault_categories" ADD CONSTRAINT "blueprint_fault_categories_blueprintId_fkey" FOREIGN KEY ("blueprintId") REFERENCES "blueprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "production_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_stages" ADD CONSTRAINT "job_stages_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_stages" ADD CONSTRAINT "job_stages_blueprintId_fkey" FOREIGN KEY ("blueprintId") REFERENCES "blueprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_stages" ADD CONSTRAINT "job_stages_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_sessions" ADD CONSTRAINT "process_sessions_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "job_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_sessions" ADD CONSTRAINT "process_sessions_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_entries" ADD CONSTRAINT "batch_entries_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "process_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fault_logs" ADD CONSTRAINT "fault_logs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fault_logs" ADD CONSTRAINT "fault_logs_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "job_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fault_logs" ADD CONSTRAINT "fault_logs_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
