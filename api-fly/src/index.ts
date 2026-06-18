import express from "express";
import multer from "multer";
import { Gender, UserRole, Severity } from "@prisma/client";
import { prisma } from "./lib/prisma.js";
import { ok, err, serverErr } from "./lib/json.js";
import { createPatientSchema, submitFindingSchema } from "./lib/validators.js";
import { supabaseAdmin, ECG_BUCKET } from "./lib/supabase.js";
import { sendToCardiologist, sendToHealthWorker } from "./lib/notify.js";
import { getSessionAppUser, hasAppRole } from "./lib/session.js";

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

const PORT = Number(process.env.PORT ?? 8080);

app.disable("x-powered-by");

app.get("/health", (_req, res) => {
  res.status(200).send("ok");
});

app.get("/api/patients", async (req, res) => {
  try {
    const phone = typeof req.query.phone === "string" ? req.query.phone : null;
    if (!phone) return err(res, "phone query param required", 400);

    const patient = await prisma.patient.findUnique({
      where: { phone },
      select: { id: true, fullName: true, age: true, village: true, district: true, phone: true },
    });

    if (!patient) return err(res, "Patient not found", 404);
    return ok(res, patient);
  } catch (e) {
    return serverErr(res, e, "GET /api/patients");
  }
});

app.post("/api/patients", express.json(), async (req, res) => {
  try {
    const parsed = createPatientSchema.safeParse(req.body);
    if (!parsed.success) {
      return err(res, parsed.error.errors[0]?.message ?? "Validation error", 422);
    }

    const existing = await prisma.patient.findUnique({ where: { phone: parsed.data.phone } });
    if (existing) return err(res, "A patient with this phone number already exists", 409);

    const patient = await prisma.patient.create({
      data: {
        ...parsed.data,
        gender: parsed.data.gender as Gender,
      },
      select: { id: true, fullName: true },
    });

    return ok(res, patient, 201);
  } catch (e) {
    return serverErr(res, e, "POST /api/patients");
  }
});

app.get("/api/ecg", async (req, res) => {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const where = status ? { status: status as "PENDING" | "REVIEWED" | "URGENT" } : {};

    const records = await prisma.eCGRecord.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        fileUrl: true,
        healthWorkerNotes: true,
        createdAt: true,
        patient: {
          select: { fullName: true, age: true, village: true, district: true },
        },
        finding: {
          select: { severity: true },
        },
      },
    });

    return ok(res, records);
  } catch (e) {
    return serverErr(res, e, "GET /api/ecg");
  }
});

app.post("/api/ecg", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const patientId = typeof req.body.patientId === "string" ? req.body.patientId : null;
    const healthWorkerNotes =
      typeof req.body.healthWorkerNotes === "string" ? req.body.healthWorkerNotes : null;

    if (!file) return err(res, "ECG file is required", 400);
    if (!patientId) return err(res, "patientId is required", 400);

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true, fullName: true, age: true, village: true },
    });
    if (!patient) return err(res, "Patient not found", 404);

    const ext = file.originalname.split(".").pop() ?? "bin";
    const path = `${patientId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(ECG_BUCKET)
      .upload(path, file.buffer, {
        contentType: file.mimetype || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error("[ecg upload] supabase error:", uploadError);
      return err(res, "File upload failed", 500);
    }

    const { data: publicData } = supabaseAdmin.storage.from(ECG_BUCKET).getPublicUrl(path);

    const ecgRecord = await prisma.eCGRecord.create({
      data: {
        patientId,
        fileUrl: publicData.publicUrl,
        healthWorkerNotes: healthWorkerNotes ?? null,
      },
      select: { id: true },
    });

    sendToCardiologist({
      patientName: patient.fullName,
      age: patient.age,
      village: patient.village,
    }).catch((e) => console.error("[notify] cardiologist:", e));

    return ok(res, ecgRecord, 201);
  } catch (e) {
    return serverErr(res, e, "POST /api/ecg");
  }
});

app.patch("/api/ecg/:id/finding", express.json(), async (req, res) => {
  try {
    const row = await getSessionAppUser(req.headers.cookie);
    if (!row || !hasAppRole(row.appRole, [UserRole.CARDIOLOGIST])) {
      return err(res, "Forbidden", 403);
    }

    const ecgId = req.params.id;
    const parsed = submitFindingSchema.safeParse(req.body);
    if (!parsed.success) {
      return err(res, parsed.error.errors[0]?.message ?? "Validation error", 422);
    }

    const ecgRecord = await prisma.eCGRecord.findUnique({
      where: { id: ecgId },
      include: {
        patient: { select: { fullName: true, phone: true } },
        finding: { select: { id: true } },
      },
    });

    if (!ecgRecord) return err(res, "ECG record not found", 404);
    if (ecgRecord.finding) return err(res, "Finding already submitted for this ECG", 409);

    const { severity, clinicalNotes, recommendation } = parsed.data;
    const newStatus = severity === "URGENT" ? "URGENT" : "REVIEWED";

    const [finding] = await prisma.$transaction([
      prisma.finding.create({
        data: {
          ecgRecordId: ecgId,
          severity: severity as Severity,
          clinicalNotes,
          recommendation,
        },
        select: { id: true },
      }),
      prisma.eCGRecord.update({
        where: { id: ecgId },
        data: { status: newStatus },
      }),
    ]);

    sendToHealthWorker({
      healthWorkerPhone: ecgRecord.patient.phone,
      patientName: ecgRecord.patient.fullName,
      severity,
      recommendation,
    }).catch((e) => console.error("[notify] health-worker:", e));

    return ok(res, finding);
  } catch (e) {
    return serverErr(res, e, "PATCH /api/ecg/:id/finding");
  }
});

app.get("/api/admin/stats", async (req, res) => {
  try {
    const row = await getSessionAppUser(req.headers.cookie);
    if (!row || !hasAppRole(row.appRole, [UserRole.ADMIN])) {
      return err(res, "Forbidden", 403);
    }

    const [totalPatients, ecgRecords] = await prisma.$transaction([
      prisma.patient.count(),
      prisma.eCGRecord.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          createdAt: true,
          patient: { select: { fullName: true, village: true } },
          finding: {
            select: { severity: true, createdAt: true },
          },
        },
      }),
    ]);

    const bySeverity = { NORMAL: 0, WATCH: 0, URGENT: 0 };
    for (const r of ecgRecords) {
      if (r.finding?.severity === "NORMAL") bySeverity.NORMAL++;
      else if (r.finding?.severity === "WATCH") bySeverity.WATCH++;
      else if (r.finding?.severity === "URGENT") bySeverity.URGENT++;
    }

    return ok(res, {
      totalPatients,
      totalECGs: ecgRecords.length,
      bySeverity,
      records: ecgRecords,
    });
  } catch (e) {
    return serverErr(res, e, "GET /api/admin/stats");
  }
});

app.listen(PORT, () => {
  console.log(`[api-fly] listening on :${PORT}`);
});
