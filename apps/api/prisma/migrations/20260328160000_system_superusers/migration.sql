-- CreateEnum
CREATE TYPE "SystemAccountType" AS ENUM ('NONE', 'SUPERUSER', 'BACKUP_SUPERUSER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "systemAccount" "SystemAccountType" NOT NULL DEFAULT 'NONE';

-- AlterTable
ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
