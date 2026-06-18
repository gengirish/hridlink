import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin, ECG_BUCKET } from "@/lib/supabase";
import { sendToCardiologist } from "@/lib/notify";
import { ok, err, serverErr } from "@/lib/api-response";
import { ECGStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE = 10 * 1024 * 1024;

export async function GET(req: NextRequest) {
  const statusParam = req.nextUrl.searchParams.get("status");

  try {
    const where = statusParam && Object.values(ECGStatus).includes(statusParam as ECGStatus)
      ? { status: statusParam as ECGStatus }
      : {};

    const records = await prisma.eCGRecord.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        status: true,
        fileUrl: true,
        healthWorkerNotes: true,
        createdAt: true,
        patient: {
          select: { fullName: true, age: true, village: true, district: true },
        },
        finding: { select: { severity: true } },
      },
    });
    return ok(records);
  } catch (e) {
    return serverErr(e, "GET /api/ecg");
  }
}

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return err("Expected multipart/form-data", 400);
  }

  const file = formData.get("file") as File | null;
  const patientId = formData.get("patientId") as string | null;
  const notes = (formData.get("healthWorkerNotes") as string | null) ?? undefined;

  if (!file) return err("ECG file is required", 400);
  if (!patientId) return err("patientId is required", 400);
  if (file.size > MAX_SIZE) return err("File too large (max 10 MB)", 413);
  if (!ALLOWED_TYPES.includes(file.type)) {
    return err("File type not supported. Use JPG, PNG, WebP, or PDF.", 415);
  }

  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true, fullName: true, age: true, village: true },
    });
    if (!patient) return err("Patient not found", 404);

    const ext = file.type === "application/pdf" ? "pdf" : file.type.split("/")[1] ?? "jpg";
    const path = `ecg/${patientId}/${Date.now()}.${ext}`;
    const bytes = await file.arrayBuffer();

    const { error: uploadError } = await supabaseAdmin.storage
      .from(ECG_BUCKET)
      .upload(path, Buffer.from(bytes), { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error("[POST /api/ecg] Supabase upload error:", uploadError);
      return err("File upload failed", 502);
    }

    const { data: { publicUrl } } = supabaseAdmin.storage.from(ECG_BUCKET).getPublicUrl(path);

    const record = await prisma.eCGRecord.create({
      data: { patientId, fileUrl: publicUrl, healthWorkerNotes: notes ?? null },
      select: { id: true },
    });

    sendToCardiologist({
      patientName: patient.fullName,
      age: patient.age,
      village: patient.village,
    }).catch((e) => console.error("[notify]", e));

    return ok({ id: record.id }, 201);
  } catch (e) {
    return serverErr(e, "POST /api/ecg");
  }
}
