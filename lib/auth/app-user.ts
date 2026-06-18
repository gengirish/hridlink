import { UserRole } from "@prisma/client";
import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

/**
 * Signed-in Neon Auth session plus app role from Prisma (`users.authUserId` or `users.email`).
 */
export async function getSessionAppUser() {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) return null;

  const row = await prisma.user.findFirst({
    where: {
      OR: [
        { authUserId: session.user.id },
        ...(session.user.email ? [{ email: session.user.email }] : []),
      ],
    },
    select: { role: true },
  });

  return { session, appRole: row?.role ?? null } as const;
}

export function hasAppRole(appRole: UserRole | null, allowed: UserRole[]): boolean {
  return appRole != null && allowed.includes(appRole);
}
