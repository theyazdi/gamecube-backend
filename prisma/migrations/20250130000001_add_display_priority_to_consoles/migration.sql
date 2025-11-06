-- AlterTable
ALTER TABLE "consoles" ADD COLUMN IF NOT EXISTS "displayPriority" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "consoles_displayPriority_idx" ON "consoles"("displayPriority");

