-- Enable extension untuk UUID generation (jika belum ada)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateTable
CREATE TABLE "ChecklistItemCompletion" (
    "id" TEXT NOT NULL,
    "checklistItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChecklistItemCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistItemCompletion_checklistItemId_userId_key" ON "ChecklistItemCompletion"("checklistItemId", "userId");

-- CreateIndex
CREATE INDEX "ChecklistItemCompletion_checklistItemId_idx" ON "ChecklistItemCompletion"("checklistItemId");

-- CreateIndex
CREATE INDEX "ChecklistItemCompletion_userId_idx" ON "ChecklistItemCompletion"("userId");

-- AddForeignKey
ALTER TABLE "ChecklistItemCompletion" ADD CONSTRAINT "ChecklistItemCompletion_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "ProgressChecklistItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistItemCompletion" ADD CONSTRAINT "ChecklistItemCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Migrate existing data: Create ChecklistItemCompletion entries for completed checklist items
-- Using gen_random_uuid() from pgcrypto extension (enabled above)
INSERT INTO "ChecklistItemCompletion" ("id", "checklistItemId", "userId", "completedAt")
SELECT 
    gen_random_uuid()::text as "id",
    "id" as "checklistItemId",
    "completedBy" as "userId",
    COALESCE("completedAt", CURRENT_TIMESTAMP) as "completedAt"
FROM "ProgressChecklistItem"
WHERE "completed" = true AND "completedBy" IS NOT NULL;

-- AlterTable: Remove old columns from ProgressChecklistItem
ALTER TABLE "ProgressChecklistItem" DROP COLUMN "completed",
DROP COLUMN "completedBy",
DROP COLUMN "completedAt";

-- DropIndex: Remove index on completed column (no longer exists)
DROP INDEX IF EXISTS "ProgressChecklistItem_completed_idx";

