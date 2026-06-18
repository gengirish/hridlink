-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('HEALTH_WORKER', 'CARDIOLOGIST', 'ADMIN');

-- CreateEnum
CREATE TYPE "ECGStatus" AS ENUM ('PENDING', 'REVIEWED', 'URGENT');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('NORMAL', 'WATCH', 'URGENT');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'HEALTH_WORKER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" "Gender" NOT NULL,
    "village" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "aadhaarLast4" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecg_records" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "healthWorkerNotes" TEXT,
    "status" "ECGStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ecg_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "findings" (
    "id" TEXT NOT NULL,
    "ecgRecordId" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "clinicalNotes" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "findings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_clerkUserId_key" ON "users"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "patients_phone_key" ON "patients"("phone");

-- CreateIndex
CREATE INDEX "patients_phone_idx" ON "patients"("phone");

-- CreateIndex
CREATE INDEX "ecg_records_patientId_idx" ON "ecg_records"("patientId");

-- CreateIndex
CREATE INDEX "ecg_records_status_createdAt_idx" ON "ecg_records"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "findings_ecgRecordId_key" ON "findings"("ecgRecordId");

-- AddForeignKey
ALTER TABLE "ecg_records" ADD CONSTRAINT "ecg_records_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "findings" ADD CONSTRAINT "findings_ecgRecordId_fkey" FOREIGN KEY ("ecgRecordId") REFERENCES "ecg_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
