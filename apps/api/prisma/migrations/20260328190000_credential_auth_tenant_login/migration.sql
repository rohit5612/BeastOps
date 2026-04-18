-- Add credential auth fields for tenant-aware login.
ALTER TABLE "User"
ADD COLUMN "passwordHash" TEXT,
ADD COLUMN "lastLoginAt" TIMESTAMP(3);
