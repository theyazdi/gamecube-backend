-- CreateTable
CREATE TABLE "organization_working_hours" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "is24Hours" BOOLEAN NOT NULL DEFAULT false,
    "startTime" TEXT,
    "endTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_working_hours_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_working_hours_organizationId_dayOfWeek_key" ON "organization_working_hours"("organizationId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "organization_working_hours_organizationId_idx" ON "organization_working_hours"("organizationId");

-- CreateIndex
CREATE INDEX "organization_working_hours_dayOfWeek_idx" ON "organization_working_hours"("dayOfWeek");

-- CreateIndex
CREATE INDEX "organization_working_hours_organizationId_dayOfWeek_idx" ON "organization_working_hours"("organizationId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "organization_working_hours_isClosed_is24Hours_idx" ON "organization_working_hours"("isClosed", "is24Hours");

-- AddForeignKey
ALTER TABLE "organization_working_hours" ADD CONSTRAINT "organization_working_hours_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

