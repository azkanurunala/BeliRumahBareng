-- AlterTable
ALTER TABLE "PaymentPlan" ADD COLUMN     "bookingFeeAmount" DECIMAL(15,2),
ADD COLUMN     "bookingFeePaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentType" TEXT;

-- AlterTable
ALTER TABLE "UnitAssignment" ADD COLUMN     "isLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lockedAt" TIMESTAMP(3),
ADD COLUMN     "lockedBy" TEXT;

-- CreateTable
CREATE TABLE "PurchaseTransaction" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "unitId" INTEGER NOT NULL,
    "state" TEXT NOT NULL,
    "paymentType" TEXT,
    "bookingFeeAmount" DECIMAL(15,2),
    "bookingDate" TIMESTAMP(3),
    "paymentProofUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewRecord" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "interviewDate" TIMESTAMP(3) NOT NULL,
    "interviewerId" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "location" TEXT,
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KprStatus" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "bankName" TEXT,
    "submittedDate" TIMESTAMP(3),
    "approvedDate" TIMESTAMP(3),
    "rejectedDate" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KprStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstructionCheckpoint" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL,
    "milestone" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "photos" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConstructionCheckpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "fromState" TEXT,
    "toState" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PurchaseTransaction_projectId_idx" ON "PurchaseTransaction"("projectId");

-- CreateIndex
CREATE INDEX "PurchaseTransaction_userId_idx" ON "PurchaseTransaction"("userId");

-- CreateIndex
CREATE INDEX "PurchaseTransaction_state_idx" ON "PurchaseTransaction"("state");

-- CreateIndex
CREATE INDEX "PurchaseTransaction_paymentType_idx" ON "PurchaseTransaction"("paymentType");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseTransaction_projectId_userId_unitId_key" ON "PurchaseTransaction"("projectId", "userId", "unitId");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewRecord_transactionId_key" ON "InterviewRecord"("transactionId");

-- CreateIndex
CREATE INDEX "InterviewRecord_transactionId_idx" ON "InterviewRecord"("transactionId");

-- CreateIndex
CREATE INDEX "InterviewRecord_result_idx" ON "InterviewRecord"("result");

-- CreateIndex
CREATE INDEX "InterviewRecord_interviewDate_idx" ON "InterviewRecord"("interviewDate");

-- CreateIndex
CREATE INDEX "Appointment_transactionId_idx" ON "Appointment"("transactionId");

-- CreateIndex
CREATE INDEX "Appointment_type_idx" ON "Appointment"("type");

-- CreateIndex
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");

-- CreateIndex
CREATE INDEX "Appointment_scheduledDate_idx" ON "Appointment"("scheduledDate");

-- CreateIndex
CREATE UNIQUE INDEX "KprStatus_transactionId_key" ON "KprStatus"("transactionId");

-- CreateIndex
CREATE INDEX "KprStatus_transactionId_idx" ON "KprStatus"("transactionId");

-- CreateIndex
CREATE INDEX "KprStatus_status_idx" ON "KprStatus"("status");

-- CreateIndex
CREATE INDEX "ConstructionCheckpoint_transactionId_idx" ON "ConstructionCheckpoint"("transactionId");

-- CreateIndex
CREATE INDEX "ConstructionCheckpoint_status_idx" ON "ConstructionCheckpoint"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ConstructionCheckpoint_transactionId_progress_key" ON "ConstructionCheckpoint"("transactionId", "progress");

-- CreateIndex
CREATE INDEX "ActivityLog_transactionId_idx" ON "ActivityLog"("transactionId");

-- CreateIndex
CREATE INDEX "ActivityLog_actorId_idx" ON "ActivityLog"("actorId");

-- CreateIndex
CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog"("action");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "UnitAssignment_isLocked_idx" ON "UnitAssignment"("isLocked");

-- AddForeignKey
ALTER TABLE "PurchaseTransaction" ADD CONSTRAINT "PurchaseTransaction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseTransaction" ADD CONSTRAINT "PurchaseTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewRecord" ADD CONSTRAINT "InterviewRecord_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "PurchaseTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewRecord" ADD CONSTRAINT "InterviewRecord_interviewerId_fkey" FOREIGN KEY ("interviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "PurchaseTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KprStatus" ADD CONSTRAINT "KprStatus_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "PurchaseTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionCheckpoint" ADD CONSTRAINT "ConstructionCheckpoint_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "PurchaseTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "PurchaseTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
