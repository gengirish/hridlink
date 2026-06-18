import { getSessionAppUser, hasAppRole } from "@/lib/auth/app-user";
import { prisma } from "@/lib/prisma";
import { ok, err, serverErr } from "@/lib/api-response";
import { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionAppUser();
  if (!user) return err("Unauthorized", 401);
  if (!hasAppRole(user.appRole, [UserRole.ADMIN])) return err("Forbidden", 403);

  try {
    const [totalPatients, totalECGs, severityCounts, records] = await Promise.all([
      prisma.patient.count(),
      prisma.eCGRecord.count(),
      prisma.finding.groupBy({
        by: ["severity"],
        _count: { severity: true },
      }),
      prisma.eCGRecord.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          createdAt: true,
          status: true,
          patient: { select: { fullName: true, village: true } },
          finding: { select: { severity: true, createdAt: true } },
        },
      }),
    ]);

    const bySeverity = { NORMAL: 0, WATCH: 0, URGENT: 0 } as Record<string, number>;
    for (const row of severityCounts) {
      bySeverity[row.severity] = row._count.severity;
    }

    return ok({ totalPatients, totalECGs, bySeverity, records });
  } catch (e) {
    return serverErr(e, "GET /api/admin/stats");
  }
}
