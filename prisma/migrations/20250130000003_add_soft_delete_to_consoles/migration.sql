-- AlterTable: Add deletedAt column for soft delete
ALTER TABLE "consoles" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;

-- CreateIndex: Add index on deletedAt for better query performance
CREATE INDEX IF NOT EXISTS "consoles_deletedAt_idx" ON "consoles"("deletedAt");

