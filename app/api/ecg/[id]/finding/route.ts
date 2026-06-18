import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionAppUser, hasAppRole } from "@/lib/auth/app-user";
import { submitFindingSchema } from "@/lib/validators";
import { ok, err, serverErr } from "@/lib/api-response";
import { UserRole, ECGStatus, Severity } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionAppUser();
  if (!user) return err("Unauthorized", 401);
  if (!hasAppRole(user.appRole, [UserRole.CARDIOLOGIST])) return err("Forbidden", 403);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON", 400);
  }

  const parsed = submitFindingSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0].message, 422);

  const { id } = params;
  try {
    const record = await prisma.eCGRecord.findUnique({ where: { id } });
    if (!record) return err("ECG record not found", 404);

    await prisma.$transaction([
      prisma.finding.upsert({
        where: { ecgRecordId: id },
        create: {
          ecgRecordId: id,
          severity: parsed.data.severity,
          clinicalNotes: parsed.data.clinicalNotes,
          recommendation: parsed.data.recommendation,
        },
        update: {
          severity: parsed.data.severity,
          clinicalNotes: parsed.data.clinicalNotes,
          recommendation: parsed.data.recommendation,
        },
      }),
      prisma.eCGRecord.update({
        where: { id },
        data: {
          status: parsed.data.severity === Severity.URGENT
            ? ECGStatus.URGENT
            : ECGStatus.REVIEWED,
        },
      }),
    ]);

    return ok({ id });
  } catch (e) {
    return serverErr(e, "PATCH /api/ecg/[id]/finding");
  }
}
