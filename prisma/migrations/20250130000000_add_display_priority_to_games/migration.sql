-- AlterTable
ALTER TABLE "games" ADD COLUMN IF NOT EXISTS "displayPriority" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "games_displayPriority_idx" ON "games"("displayPriority");

