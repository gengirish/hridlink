import { PrismaClient, ECGStatus, Severity, Gender, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction([
    prisma.finding.deleteMany(),
    prisma.eCGRecord.deleteMany(),
    prisma.patient.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const [p1, p2] = await Promise.all([
    prisma.patient.create({
      data: {
        fullName: "Ramanna Goud",
        age: 58,
        gender: Gender.MALE,
        village: "Kothapally",
        district: "Nalgonda",
        aadhaarLast4: "1234",
        phone: "+919876543210",
      },
    }),
    prisma.patient.create({
      data: {
        fullName: "Sarojamma Reddy",
        age: 64,
        gender: Gender.FEMALE,
        village: "Bommalaramaram",
        district: "Yadadri",
        aadhaarLast4: "5678",
        phone: "+919876543211",
      },
    }),
  ]);

  const ecg1 = await prisma.eCGRecord.create({
    data: {
      patientId: p1.id,
      fileUrl: "https://example.com/ecg/seed-ecg-1.pdf",
      healthWorkerNotes: "Patient reports chest pain since morning.",
      status: ECGStatus.PENDING,
    },
  });

  const ecg2 = await prisma.eCGRecord.create({
    data: {
      patientId: p1.id,
      fileUrl: "https://example.com/ecg/seed-ecg-2.pdf",
      healthWorkerNotes: "Routine check.",
      status: ECGStatus.REVIEWED,
    },
  });

  const ecg3 = await prisma.eCGRecord.create({
    data: {
      patientId: p2.id,
      fileUrl: "https://example.com/ecg/seed-ecg-3.pdf",
      healthWorkerNotes: "Shortness of breath, irregular heartbeat.",
      status: ECGStatus.URGENT,
    },
  });

  await prisma.finding.create({
    data: {
      ecgRecordId: ecg2.id,
      severity: Severity.NORMAL,
      clinicalNotes: "No significant abnormalities detected.",
      recommendation: "Continue medication. Review in 3 months.",
    },
  });

  await prisma.finding.create({
    data: {
      ecgRecordId: ecg3.id,
      severity: Severity.URGENT,
      clinicalNotes: "Ventricular tachycardia detected. Immediate intervention needed.",
      recommendation: "Refer to NIMS Hyderabad immediately. Call 108.",
    },
  });

  await Promise.all([
    prisma.user.create({
      data: {
        authUserId: "seed_cardiologist_001",
        email: "dr.cardiac@hridlink.com",
        name: "Dr. Anand Sharma",
        phone: "+919000000001",
        role: UserRole.CARDIOLOGIST,
      },
    }),
    prisma.user.create({
      data: {
        authUserId: "seed_admin_001",
        email: "admin@hridlink.com",
        name: "Admin HridLink",
        phone: "+919000000002",
        role: UserRole.ADMIN,
      },
    }),
  ]);

  console.log("Seed complete: 2 patients, 3 ECGs, 2 findings, 1 cardiologist, 1 admin");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
