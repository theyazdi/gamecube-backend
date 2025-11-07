-- AlterTable
ALTER TABLE "organizations" ADD COLUMN "username" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "organizations_username_key" ON "organizations"("username");

-- CreateIndex
CREATE INDEX "organizations_username_idx" ON "organizations"("username");

