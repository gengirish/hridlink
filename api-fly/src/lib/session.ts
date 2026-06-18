import { prisma } from "./prisma.js";
import type { UserRole } from "@prisma/client";

type NeonUser = { id: string; email?: string | null };

/**
 * Resolve Neon Auth session by forwarding cookies to the hosted Better Auth `/get-session`.
 * Same contract as `@neondatabase/auth` server `get-session` upstream.
 */
export async function getNeonUserFromCookies(cookieHeader: string | undefined): Promise<NeonUser | null> {
  if (!cookieHeader?.trim()) return null;
  const base = process.env.NEON_AUTH_BASE_URL?.replace(/\/$/, "");
  if (!base) {
    console.warn("[api-fly] NEON_AUTH_BASE_URL not set — cannot resolve session");
    return null;
  }
  try {
    const res = await fetch(`${base}/get-session`, {
      method: "GET",
      headers: { cookie: cookieHeader },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      user?: { id?: string; email?: string | null } | null;
      session?: { user?: { id?: string; email?: string | null } | null } | null;
    };
    const user = body.user ?? body.session?.user;
    if (!user?.id) return null;
    return { id: user.id, email: user.email };
  } catch (e) {
    console.warn("[api-fly] get-session failed:", e);
    return null;
  }
}

export async function getSessionAppUser(cookieHeader: string | undefined) {
  const neonUser = await getNeonUserFromCookies(cookieHeader);
  if (!neonUser) return null;

  const row = await prisma.user.findFirst({
    where: {
      OR: [{ authUserId: neonUser.id }, ...(neonUser.email ? [{ email: neonUser.email }] : [])],
    },
    select: { role: true },
  });

  return { neonUser, appRole: row?.role ?? null } as const;
}

export function hasAppRole(appRole: UserRole | null, allowed: UserRole[]): boolean {
  return appRole != null && allowed.includes(appRole);
}
