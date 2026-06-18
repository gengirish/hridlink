/**
 * Server-only: sync Prisma `User` from Neon Auth session. Do not import from client code.
 */
import { auth } from "./server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function syncAppUserFromSession(): Promise<void> {
  const { data: session, error } = await auth.getSession();
  if (error || !session?.user?.id) return;

  const email = session.user.email?.trim();
  if (!email) return;

  const name =
    session.user.name?.trim() ||
    (email.includes("@") ? email.split("@")[0]! : email) ||
    "User";

  const update: { email?: string; name?: string } = {};
  if (session.user.email?.trim()) update.email = session.user.email.trim();
  if (session.user.name?.trim()) update.name = session.user.name.trim();

  const existing = await prisma.user.findUnique({ where: { authUserId: session.user.id } });
  if (!existing) {
    // Check if a seeded row exists for this email (e.g. dr.cardiac@hridlink.com)
    const byEmail = await prisma.user.findUnique({ where: { email } });
    if (byEmail) {
      // Claim the seeded row — link real Neon Auth UUID while preserving the seeded role
      await prisma.user.update({
        where: { email },
        data: { authUserId: session.user.id, ...update },
      });
    } else {
      await prisma.user.create({
        data: {
          authUserId: session.user.id,
          email,
          name,
          role: UserRole.HEALTH_WORKER,
        },
      });
    }
    return;
  }
  if (Object.keys(update).length > 0) {
    await prisma.user.update({
      where: { authUserId: session.user.id },
      data: update,
    });
  }
}
