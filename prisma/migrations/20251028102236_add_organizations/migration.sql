-- CreateTable
CREATE TABLE "organizations" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT,
    "managerPhones" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "gallery" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "indexImage" TEXT,
    "logoImage" TEXT,
    "tfHour" BOOLEAN NOT NULL DEFAULT false,
    "isCube" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_uuid_key" ON "organizations"("uuid");

-- CreateIndex
CREATE INDEX "organizations_uuid_idx" ON "organizations"("uuid");

-- CreateIndex
CREATE INDEX "organizations_province_idx" ON "organizations"("province");

-- CreateIndex
CREATE INDEX "organizations_city_idx" ON "organizations"("city");
