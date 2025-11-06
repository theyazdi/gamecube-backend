-- CreateTable: UserOrganization junction table for many-to-many relation
CREATE TABLE IF NOT EXISTS "user_organizations" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_organizations_pkey" PRIMARY KEY ("id")
);

-- CreateUniqueConstraint
CREATE UNIQUE INDEX IF NOT EXISTS "user_organizations_userId_organizationId_key" ON "user_organizations"("userId", "organizationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "user_organizations_userId_idx" ON "user_organizations"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "user_organizations_organizationId_idx" ON "user_organizations"("organizationId");

-- CreateIndex (composite for better query performance)
CREATE INDEX IF NOT EXISTS "user_organizations_userId_organizationId_idx" ON "user_organizations"("userId", "organizationId");

-- AddForeignKey
ALTER TABLE "user_organizations" ADD CONSTRAINT "user_organizations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_organizations" ADD CONSTRAINT "user_organizations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

