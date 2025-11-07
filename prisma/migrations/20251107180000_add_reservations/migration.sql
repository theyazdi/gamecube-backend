-- CreateTable
CREATE TABLE "reservations" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "userId" INTEGER,
    "organizationId" INTEGER NOT NULL,
    "stationId" INTEGER NOT NULL,
    "consoleId" INTEGER NOT NULL,
    "playerCount" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "invoiceId" TEXT,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "isAccepted" BOOLEAN NOT NULL DEFAULT false,
    "isBlockedByOrg" BOOLEAN NOT NULL DEFAULT false,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "reservedDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reservations_uuid_key" ON "reservations"("uuid");

-- CreateIndex
CREATE INDEX "reservations_uuid_idx" ON "reservations"("uuid");

-- CreateIndex
CREATE INDEX "reservations_userId_idx" ON "reservations"("userId");

-- CreateIndex
CREATE INDEX "reservations_organizationId_idx" ON "reservations"("organizationId");

-- CreateIndex
CREATE INDEX "reservations_stationId_idx" ON "reservations"("stationId");

-- CreateIndex
CREATE INDEX "reservations_consoleId_idx" ON "reservations"("consoleId");

-- CreateIndex
CREATE INDEX "reservations_reservedDate_idx" ON "reservations"("reservedDate");

-- CreateIndex
CREATE INDEX "reservations_startTime_endTime_idx" ON "reservations"("startTime", "endTime");

-- CreateIndex
CREATE INDEX "reservations_organizationId_reservedDate_startTime_idx" ON "reservations"("organizationId", "reservedDate", "startTime");

-- CreateIndex
CREATE INDEX "reservations_stationId_reservedDate_startTime_endTime_idx" ON "reservations"("stationId", "reservedDate", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "reservations_consoleId_reservedDate_startTime_idx" ON "reservations"("consoleId", "reservedDate", "startTime");

-- CreateIndex
CREATE INDEX "reservations_reservedDate_startTime_endTime_isPaid_isAccept_idx" ON "reservations"("reservedDate", "startTime", "endTime", "isPaid", "isAccepted");

-- CreateIndex
CREATE INDEX "reservations_organizationId_isAccepted_isPaid_idx" ON "reservations"("organizationId", "isAccepted", "isPaid");

-- CreateIndex
CREATE INDEX "reservations_userId_reservedDate_idx" ON "reservations"("userId", "reservedDate");

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_consoleId_fkey" FOREIGN KEY ("consoleId") REFERENCES "consoles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

