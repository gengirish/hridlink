import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPatientSchema } from "@/lib/validators";
import { ok, err, serverErr } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone");
  if (!phone) return err("phone query param is required", 400);

  try {
    const patient = await prisma.patient.findUnique({
      where: { phone },
      select: { id: true, fullName: true, age: true, village: true, district: true },
    });
    if (!patient) return err("Patient not found", 404);
    return ok(patient);
  } catch (e) {
    return serverErr(e, "GET /api/patients");
  }
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON", 400);
  }

  const parsed = createPatientSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0].message, 422);

  try {
    const existing = await prisma.patient.findUnique({
      where: { phone: parsed.data.phone },
    });
    if (existing) return err("Phone number already registered", 409);

    const patient = await prisma.patient.create({
      data: parsed.data,
      select: { id: true, fullName: true },
    });
    return ok(patient, 201);
  } catch (e) {
    return serverErr(e, "POST /api/patients");
  }
}
