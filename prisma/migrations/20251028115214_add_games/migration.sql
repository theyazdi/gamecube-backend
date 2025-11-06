-- CreateTable
CREATE TABLE "games" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "coverImage" TEXT,
    "category" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "platform" TEXT NOT NULL,
    "releaseYear" INTEGER NOT NULL,
    "isAccepted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "games_platform_idx" ON "games"("platform");

-- CreateIndex
CREATE INDEX "games_isAccepted_idx" ON "games"("isAccepted");
