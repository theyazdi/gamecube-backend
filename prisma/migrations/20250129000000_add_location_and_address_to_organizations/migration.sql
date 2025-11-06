-- AlterTable
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "address" TEXT,
ADD COLUMN IF NOT EXISTS "latitude" DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS "longitude" DECIMAL(11, 8);

