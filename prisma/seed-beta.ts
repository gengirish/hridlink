/**
 * Idempotent beta/demo seed — safe to run on production.
 * Does NOT delete existing rows. Upserts demo users, patients, and sample ECGs.
 *
 * Usage: npm run db:seed-beta
 */
import { PrismaClient, ECGStatus, Severity, Gender, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://hridlink.vercel.app").replace(/\/$/, "");
const SAMPLE_ECG = `${APP_URL}/samples/ecg-sample.svg`;

const BETA_USERS = [
  {
    email: "hw@hridlink.com",
    authUserId: "seed_beta_hw_001",
    name: "Lakshmi Devi",
    phone: "+919876543212",
    role: UserRole.HEALTH_WORKER,
  },
  {
    email: "dr.cardiac@hridlink.com",
    authUserId: "seed_beta_cardio_001",
    name: "Dr. Anand Sharma",
    phone: "+919000000001",
    role: UserRole.CARDIOLOGIST,
  },
  {
    email: "admin@hridlink.com",
    authUserId: "seed_beta_admin_001",
    name: "Pilot Admin",
    phone: "+919000000002",
    role: UserRole.ADMIN,
  },
] as const;

const DEMO_PATIENTS = [
  {
    fullName: "Ramanna Goud",
    age: 58,
    gender: Gender.MALE,
    village: "Kothapally",
    district: "Nalgonda",
    aadhaarLast4: "1234",
    phone: "+919876543210",
  },
  {
    fullName: "Sarojamma Reddy",
    age: 64,
    gender: Gender.FEMALE,
    village: "Bommalaramaram",
    district: "Yadadri",
    aadhaarLast4: "5678",
    phone: "+919876543211",
  },
] as const;

async function upsertBetaUser(user: (typeof BETA_USERS)[number]) {
  const existing = await prisma.user.findUnique({ where: { email: user.email } });
  if (existing) {
    if (existing.authUserId.startsWith("seed_")) {
      return prisma.user.update({
        where: { email: user.email },
        data: {
          name: user.name,
          phone: user.phone,
          role: user.role,
        },
      });
    }
    return prisma.user.update({
      where: { email: user.email },
      data: { role: user.role, phone: user.phone ?? existing.phone },
    });
  }
  return prisma.user.create({ data: { ...user } });
}

async function upsertPatient(data: (typeof DEMO_PATIENTS)[number]) {
  return prisma.patient.upsert({
    where: { phone: data.phone },
    create: data,
    update: {
      fullName: data.fullName,
      age: data.age,
      gender: data.gender,
      village: data.village,
      district: data.district,
      aadhaarLast4: data.aadhaarLast4,
    },
  });
}

async function ensureDemoEcg(opts: {
  patientId: string;
  uploadedById: string | null;
  status: ECGStatus;
  notes: string;
  finding?: {
    severity: Severity;
    clinicalNotes: string;
    recommendation: string;
    reviewedById?: string | null;
  };
}) {
  const existing = await prisma.eCGRecord.findFirst({
    where: {
      patientId: opts.patientId,
      healthWorkerNotes: opts.notes,
      status: opts.status,
    },
    include: { finding: true },
  });

  if (existing) {
    if (opts.finding && !existing.finding) {
      await prisma.finding.create({
        data: {
          ecgRecordId: existing.id,
          severity: opts.finding.severity,
          clinicalNotes: opts.finding.clinicalNotes,
          recommendation: opts.finding.recommendation,
          reviewedById: opts.finding.reviewedById ?? undefined,
        },
      });
    }
    return existing;
  }

  const ecg = await prisma.eCGRecord.create({
    data: {
      patientId: opts.patientId,
      uploadedById: opts.uploadedById ?? undefined,
      fileUrl: SAMPLE_ECG,
      healthWorkerNotes: opts.notes,
      status: opts.status,
    },
  });

  if (opts.finding) {
    await prisma.finding.create({
      data: {
        ecgRecordId: ecg.id,
        severity: opts.finding.severity,
        clinicalNotes: opts.finding.clinicalNotes,
        recommendation: opts.finding.recommendation,
        reviewedById: opts.finding.reviewedById ?? undefined,
      },
    });
  }

  return ecg;
}

async function main() {
  console.log("[seed-beta] Upserting beta users…");
  const users = await Promise.all(BETA_USERS.map(upsertBetaUser));
  const hw = users.find((u) => u.email === "hw@hridlink.com")!;
  const cardio = users.find((u) => u.email === "dr.cardiac@hridlink.com")!;

  console.log("[seed-beta] Upserting demo patients…");
  const [p1, p2] = await Promise.all(DEMO_PATIENTS.map(upsertPatient));

  console.log("[seed-beta] Ensuring demo ECG records…");
  await ensureDemoEcg({
    patientId: p1.id,
    uploadedById: hw.id,
    status: ECGStatus.PENDING,
    notes: "Patient reports chest pain since morning. (Demo case — pending review)",
  });

  await ensureDemoEcg({
    patientId: p1.id,
    uploadedById: hw.id,
    status: ECGStatus.REVIEWED,
    notes: "Routine check. (Demo case — reviewed)",
    finding: {
      severity: Severity.NORMAL,
      clinicalNotes: "No significant abnormalities detected.",
      recommendation: "Continue medication. Review in 3 months.",
      reviewedById: cardio.id,
    },
  });

  await ensureDemoEcg({
    patientId: p2.id,
    uploadedById: hw.id,
    status: ECGStatus.URGENT,
    notes: "Shortness of breath, irregular heartbeat. (Demo case — urgent)",
    finding: {
      severity: Severity.URGENT,
      clinicalNotes: "Ventricular tachycardia detected. Immediate intervention needed.",
      recommendation: "Refer to district hospital immediately. Call 108.",
      reviewedById: cardio.id,
    },
  });

  console.log("\n[seed-beta] Done. Beta accounts (sign up once at /sign-up if not registered):");
  console.log("  Health worker  hw@hridlink.com");
  console.log("  Cardiologist    dr.cardiac@hridlink.com");
  console.log("  Admin           admin@hridlink.com");
  console.log(`  Demo password   ${process.env.BETA_DEMO_PASSWORD ?? "HridLinkDemo2026!"}`);
  console.log("\n  Demo patients: +919876543210 (Ramanna), +919876543211 (Sarojamma)");
  console.log(`  Demo guide:    ${APP_URL}/demo`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
