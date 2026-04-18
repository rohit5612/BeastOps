-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "moduleAccess" JSONB;

-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "departmentId" TEXT;

-- CreateIndex
CREATE INDEX "Role_departmentId_idx" ON "Role"("departmentId");

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
