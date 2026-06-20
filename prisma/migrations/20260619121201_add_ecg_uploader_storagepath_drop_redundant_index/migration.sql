-- DropIndex
DROP INDEX "patients_phone_idx";

-- AlterTable
ALTER TABLE "ecg_records" ADD COLUMN     "storagePath" TEXT,
ADD COLUMN     "uploadedById" TEXT;

-- AddForeignKey
ALTER TABLE "ecg_records" ADD CONSTRAINT "ecg_records_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
