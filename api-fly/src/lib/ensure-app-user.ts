import { UserRole } from "@prisma/client";
import { prisma } from "./prisma.js";

function displayNameFromEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return "User";
  const local = email.slice(0, at).trim();
  return local || "User";
}

/**
 * Ensures a `User` row exists for the Neon Auth subject, keyed by `authUserId` (upsert semantics).
 * Create: HEALTH_WORKER, required email/name (synthetic email if absent).
 * Update: refreshes email/name only when non-empty strings are provided; never changes `role`.
 */
export async function ensureAppUserForNeonUser(neonUser: {
  id: string;
  email?: string | null;
  name?: string | null;
}): Promise<void> {
  const trimmedEmail = neonUser.email?.trim() ?? "";
  const trimmedName = neonUser.name?.trim() ?? "";

  const emailForCreate = trimmedEmail || `${neonUser.id}@neon-auth.internal`;
  const nameForCreate = trimmedName || displayNameFromEmail(emailForCreate) || "User";

  const update: { email?: string; name?: string } = {};
  if (trimmedEmail) update.email = trimmedEmail;
  if (trimmedName) update.name = trimmedName;

  const existing = await prisma.user.findUnique({ where: { authUserId: neonUser.id } });
  if (!existing) {
    const byEmail = trimmedEmail
      ? await prisma.user.findUnique({ where: { email: trimmedEmail } })
      : null;
    if (byEmail) {
      await prisma.user.update({
        where: { email: trimmedEmail },
        data: { authUserId: neonUser.id, ...update },
      });
      return;
    }
    await prisma.user.create({
      data: {
        authUserId: neonUser.id,
        email: emailForCreate,
        name: nameForCreate,
        role: UserRole.HEALTH_WORKER,
      },
    });
    return;
  }
  if (Object.keys(update).length > 0) {
    await prisma.user.update({
      where: { authUserId: neonUser.id },
      data: update,
    });
  }
}
