-- AlterTable
ALTER TABLE "games" ALTER COLUMN "platform" SET DATA TYPE TEXT[];

DROP INDEX IF EXISTS "games_platform_idx";

-- CreateTable
CREATE TABLE "consoles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT,
    "releaseYear" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consoles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "consoles_name_key" ON "consoles"("name");

-- CreateIndex
CREATE INDEX "consoles_category_idx" ON "consoles"("category");
