import "./load-env.js";
import express from "express";
import multer from "multer";
import { Gender, UserRole, Severity, ECGStatus } from "@prisma/client";
import { prisma } from "./lib/prisma.js";
import { ok, err, serverErr } from "./lib/json.js";
import { createPatientSchema, submitFindingSchema } from "./lib/validators.js";
import { supabaseAdmin, ECG_BUCKET } from "./lib/supabase.js";
import { sendToCardiologist, sendToHealthWorker } from "./lib/notify.js";
import { getSessionAppUser, hasAppRole } from "./lib/session.js";

const staffAccess: UserRole[] = [UserRole.HEALTH_WORKER, UserRole.CARDIOLOGIST, UserRole.ADMIN];
const ecgListAccess: UserRole[] = [UserRole.CARDIOLOGIST, UserRole.ADMIN];
const ecgUploadAccess: UserRole[] = [UserRole.HEALTH_WORKER, UserRole.CARDIOLOGIST, UserRole.ADMIN];

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
]);

const VALID_ECG_STATUSES = new Set<string>(Object.values(ECGStatus));

/** Supabase signed URL TTL (seconds) passed to createSignedUrl */
const ECG_SIGNED_URL_TTL_SEC = 3600;
const ECG_SIGNED_URL_TTL_MS = ECG_SIGNED_URL_TTL_SEC * 1000;
/** Refresh client-side cache before Supabase expiry (55 min cap per product requirement) */
const ECG_SIGNED_URL_CACHE_MS = Math.min(3_300_000, ECG_SIGNED_URL_TTL_MS);

type EcgSignedUrlCacheEntry = { signedUrl: string; expiresAt: number };

const ecgSignedUrlCache = new Map<string, EcgSignedUrlCacheEntry>();

async function getCachedEcgListFileUrl(params: {
  supabaseUrl: string;
  storagePath: string | null;
  fileUrl: string;
}): Promise<string> {
  const { supabaseUrl, storagePath, fileUrl } = params;
  const publicPrefix = `${supabaseUrl}/storage/v1/object/public/${ECG_BUCKET}/`;

  let cacheKey: string;
  let objectPath: string | null;

  if (storagePath) {
    cacheKey = storagePath;
    objectPath = storagePath;
  } else if (fileUrl.startsWith(publicPrefix)) {
    objectPath = fileUrl.slice(publicPrefix.length);
    cacheKey = objectPath;
  } else {
    cacheKey = `__unsigned_as_is__:${fileUrl}`;
    objectPath = null;
  }

  const now = Date.now();
  const hit = ecgSignedUrlCache.get(cacheKey);
  if (hit && hit.expiresAt > now) return hit.signedUrl;

  if (objectPath == null) {
    ecgSignedUrlCache.set(cacheKey, { signedUrl: fileUrl, expiresAt: now + ECG_SIGNED_URL_CACHE_MS });
    return fileUrl;
  }

  const { data } = await supabaseAdmin.storage
    .from(ECG_BUCKET)
    .createSignedUrl(objectPath, ECG_SIGNED_URL_TTL_SEC);
  const signedUrl = data?.signedUrl ?? fileUrl;
  ecgSignedUrlCache.set(cacheKey, { signedUrl, expiresAt: now + ECG_SIGNED_URL_CACHE_MS });
  return signedUrl;
}

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

const PORT = Number(process.env.PORT ?? 8080);
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET;

app.disable("x-powered-by");

// Verify X-Internal-Secret on all routes except /health
app.use((req, res, next) => {
  if (req.path === "/health") return next();
  if (!INTERNAL_SECRET) {
    console.warn("[api-fly] INTERNAL_API_SECRET not set — accepting all requests (dev mode)");
    return next();
  }
  if (req.headers["x-internal-secret"] !== INTERNAL_SECRET) {
    return err(res, "Forbidden", 403);
  }
  next();
});

app.get("/health", (_req, res) => {
  res.status(200).send("ok");
});

// --- Patients ---

app.get("/api/patients", async (req, res) => {
  try {
    const session = await getSessionAppUser(req.headers.cookie);
    if (!session || session.appRole == null) return err(res, "Authentication required", 401);
    if (!hasAppRole(session.appRole, staffAccess)) return err(res, "Forbidden", 403);

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
    const session = await getSessionAppUser(req.headers.cookie);
    if (!session || session.appRole == null) return err(res, "Authentication required", 401);
    if (!hasAppRole(session.appRole, staffAccess)) return err(res, "Forbidden", 403);

    const parsed = createPatientSchema.safeParse(req.body);
    if (!parsed.success) return err(res, parsed.error.errors[0]?.message ?? "Validation error", 422);

    const existing = await prisma.patient.findUnique({ where: { phone: parsed.data.phone } });
    if (existing) return err(res, "A patient with this phone number already exists", 409);

    const patient = await prisma.patient.create({
      data: { ...parsed.data, gender: parsed.data.gender as Gender },
      select: { id: true, fullName: true },
    });

    return ok(res, patient, 201);
  } catch (e) {
    return serverErr(res, e, "POST /api/patients");
  }
});

// --- ECG ---

app.get("/api/ecg", async (req, res) => {
  try {
    const session = await getSessionAppUser(req.headers.cookie);
    if (!session || session.appRole == null) return err(res, "Authentication required", 401);
    if (!hasAppRole(session.appRole, ecgListAccess)) return err(res, "Forbidden", 403);

    const rawStatus = typeof req.query.status === "string" ? req.query.status : undefined;
    if (rawStatus && !VALID_ECG_STATUSES.has(rawStatus)) {
      return err(res, `Invalid status. Must be one of: ${[...VALID_ECG_STATUSES].join(", ")}`, 400);
    }

    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "50"), 10)));
    const where = rawStatus ? { status: rawStatus as ECGStatus } : {};

    const [records, total] = await prisma.$transaction([
      prisma.eCGRecord.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
        select: {
          id: true,
          status: true,
          storagePath: true,
          fileUrl: true,
          healthWorkerNotes: true,
          createdAt: true,
          patient: { select: { fullName: true, age: true, village: true, district: true } },
          finding: { select: { severity: true } },
        },
      }),
      prisma.eCGRecord.count({ where }),
    ]);

    // List omits signing — clients call GET /api/ecg/:id/signed-file-url when viewing an ECG (cached there).
    return ok(res, { items: records, total, page, limit });
  } catch (e) {
    return serverErr(res, e, "GET /api/ecg");
  }
});

app.get("/api/ecg/:id/signed-file-url", async (req, res) => {
  try {
    const session = await getSessionAppUser(req.headers.cookie);
    if (!session || session.appRole == null) return err(res, "Authentication required", 401);
    if (!hasAppRole(session.appRole, ecgListAccess)) return err(res, "Forbidden", 403);

    const ecgId = req.params.id;
    const row = await prisma.eCGRecord.findUnique({
      where: { id: ecgId },
      select: { storagePath: true, fileUrl: true },
    });
    if (!row) return err(res, "ECG record not found", 404);

    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "").replace(/\/$/, "");
    const fileUrl = await getCachedEcgListFileUrl({
      supabaseUrl,
      storagePath: row.storagePath,
      fileUrl: row.fileUrl,
    });
    return ok(res, { fileUrl });
  } catch (e) {
    return serverErr(res, e, "GET /api/ecg/:id/signed-file-url");
  }
});

app.post("/api/ecg", upload.single("file"), async (req, res) => {
  try {
    const session = await getSessionAppUser(req.headers.cookie);
    if (!session || session.appRole == null) return err(res, "Authentication required", 401);
    if (!hasAppRole(session.appRole, ecgUploadAccess)) return err(res, "Forbidden", 403);

    const file = req.file;
    const patientId = typeof req.body.patientId === "string" ? req.body.patientId : null;
    const healthWorkerNotes =
      typeof req.body.healthWorkerNotes === "string" ? req.body.healthWorkerNotes : null;

    if (!file) return err(res, "ECG file is required", 400);
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return err(res, "Only JPEG, PNG, GIF, WebP and PDF files are accepted", 415);
    }
    if (!patientId) return err(res, "patientId is required", 400);

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true, fullName: true, age: true, village: true },
    });
    if (!patient) return err(res, "Patient not found", 404);

    const ext = file.originalname.split(".").pop()?.toLowerCase() ?? "bin";
    const storagePath = `${patientId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(ECG_BUCKET)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error("[ecg upload] supabase error:", uploadError);
      return err(res, "File upload failed", 500);
    }

    const ecgRecord = await prisma.eCGRecord.create({
      data: {
        patientId,
        uploadedById: session.userId ?? undefined,
        storagePath,
        fileUrl: storagePath, // placeholder; signed URLs generated on read
        healthWorkerNotes: healthWorkerNotes ?? null,
      },
      select: { id: true },
    });

    try {
      await sendToCardiologist({
        patientName: patient.fullName,
        age: patient.age,
        village: patient.village,
      });
    } catch (e) {
      console.error("[notify] cardiologist notification failed:", e);
      // Non-fatal: upload succeeded; caller should follow up manually
    }

    return ok(res, ecgRecord, 201);
  } catch (e) {
    return serverErr(res, e, "POST /api/ecg");
  }
});

app.patch("/api/ecg/:id/finding", express.json(), async (req, res) => {
  try {
    const session = await getSessionAppUser(req.headers.cookie);
    if (!session || session.appRole == null) return err(res, "Authentication required", 401);
    if (!hasAppRole(session.appRole, [UserRole.CARDIOLOGIST])) return err(res, "Forbidden", 403);

    const ecgId = req.params.id;
    const parsed = submitFindingSchema.safeParse(req.body);
    if (!parsed.success) return err(res, parsed.error.errors[0]?.message ?? "Validation error", 422);

    const ecgRecord = await prisma.eCGRecord.findUnique({
      where: { id: ecgId },
      include: {
        patient: { select: { fullName: true, phone: true } },
        uploadedBy: { select: { phone: true, email: true } },
        finding: { select: { id: true } },
      },
    });

    if (!ecgRecord) return err(res, "ECG record not found", 404);
    if (ecgRecord.finding) return err(res, "Finding already submitted for this ECG", 409);

    const { severity, clinicalNotes, recommendation } = parsed.data;
    const newStatus = severity === "URGENT" ? "URGENT" : "REVIEWED";

    const [finding] = await prisma.$transaction([
      prisma.finding.create({
        data: { ecgRecordId: ecgId, severity: severity as Severity, clinicalNotes, recommendation },
        select: { id: true },
      }),
      prisma.eCGRecord.update({ where: { id: ecgId }, data: { status: newStatus } }),
    ]);

    const healthWorkerPhone = ecgRecord.uploadedBy?.phone;
    if (healthWorkerPhone) {
      try {
        await sendToHealthWorker({
          healthWorkerPhone,
          healthWorkerEmail: ecgRecord.uploadedBy?.email,
          patientName: ecgRecord.patient.fullName,
          severity,
          recommendation,
        });
      } catch (e) {
        console.error("[notify] health-worker notification failed:", e);
      }
    } else {
      console.warn(`[notify] ECG ${ecgId} has no uploadedBy phone — health worker not notified`);
    }

    return ok(res, finding);
  } catch (e) {
    return serverErr(res, e, "PATCH /api/ecg/:id/finding");
  }
});

// --- Admin ---

app.get("/api/admin/stats", async (req, res) => {
  try {
    const session = await getSessionAppUser(req.headers.cookie);
    if (!session || session.appRole == null) return err(res, "Authentication required", 401);
    if (!hasAppRole(session.appRole, [UserRole.ADMIN])) return err(res, "Forbidden", 403);

    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
    const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit ?? "100"), 10)));

    const [totalPatients, severityGroups, totalECGs, records] = await prisma.$transaction([
      prisma.patient.count(),
      prisma.finding.groupBy({
        by: ["severity"],
        _count: { _all: true },
        orderBy: { severity: "asc" },
      }),
      prisma.eCGRecord.count(),
      prisma.eCGRecord.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
        select: {
          id: true,
          status: true,
          createdAt: true,
          patient: { select: { fullName: true, village: true, district: true, phone: true } },
          finding: { select: { severity: true, createdAt: true } },
        },
      }),
    ]);

    const bySeverity = { NORMAL: 0, WATCH: 0, URGENT: 0 };
    for (const row of severityGroups) {
      if (row.severity === "NORMAL" || row.severity === "WATCH" || row.severity === "URGENT") {
        const c = row._count;
        const n =
          typeof c === "object" && c !== null && "_all" in c && typeof (c as { _all: unknown })._all === "number"
            ? (c as { _all: number })._all
            : 0;
        bySeverity[row.severity] = n;
      }
    }

    return ok(res, { totalPatients, totalECGs, bySeverity, records, page, limit });
  } catch (e) {
    return serverErr(res, e, "GET /api/admin/stats");
  }
});

app.listen(PORT, () => {
  console.log(`[api-fly] listening on :${PORT}`);
});
