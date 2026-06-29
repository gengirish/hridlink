-- AlterTable
ALTER TABLE "findings" ADD COLUMN "reviewedById" TEXT;

-- AddForeignKey
ALTER TABLE "findings" ADD CONSTRAINT "findings_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
