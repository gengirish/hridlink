import { prisma } from "./prisma.js";
import type { UserRole } from "@prisma/client";
import { ensureAppUserForNeonUser } from "./ensure-app-user.js";

type NeonUser = { id: string; email?: string | null; name?: string | null };

type CachedUser = {
  userId: string;
  appRole: UserRole | null;
  userPhone: string | null;
  expiresAt: number;
};

// 5-minute in-process TTL cache — avoids 2 DB queries on every API request
const sessionCache = new Map<string, CachedUser>();
const CACHE_TTL_MS = 5 * 60 * 1000;

/** Match Next `lib/auth/server.ts` — pasted Fly secrets may include BOM / CRLF. */
function normalizeAuthBaseUrl(raw: string | undefined): string | undefined {
  if (raw == null) return undefined;
  const cleaned = raw.replace(/^\uFEFF/, "").replace(/\u200b/g, "").trim().replace(/\/$/, "");
  return cleaned.length > 0 ? cleaned : undefined;
}

export async function getNeonUserFromCookies(cookieHeader: string | undefined): Promise<NeonUser | null> {
  if (!cookieHeader?.trim()) return null;
  const base = normalizeAuthBaseUrl(process.env.NEON_AUTH_BASE_URL);
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
      user?: { id?: string; email?: string | null; name?: string | null } | null;
      session?: { user?: { id?: string; email?: string | null; name?: string | null } | null } | null;
    };
    const user = body.user ?? body.session?.user;
    if (!user?.id) return null;
    return { id: user.id, email: user.email, name: user.name };
  } catch (e) {
    console.warn("[api-fly] get-session failed:", e);
    return null;
  }
}

export async function getSessionAppUser(cookieHeader: string | undefined) {
  const neonUser = await getNeonUserFromCookies(cookieHeader);
  if (!neonUser) return null;

  const cached = sessionCache.get(neonUser.id);
  if (cached && cached.expiresAt > Date.now()) {
    return { neonUser, appRole: cached.appRole, userId: cached.userId, userPhone: cached.userPhone } as const;
  }

  await ensureAppUserForNeonUser(neonUser);

  const row = await prisma.user.findFirst({
    where: {
      OR: [
        { authUserId: neonUser.id },
        ...(neonUser.email ? [{ email: neonUser.email.trim() }] : []),
      ],
    },
    select: { id: true, role: true, phone: true },
  });

  const entry: CachedUser = {
    userId: row?.id ?? "",
    appRole: row?.role ?? null,
    userPhone: row?.phone ?? null,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };
  sessionCache.set(neonUser.id, entry);

  return { neonUser, appRole: row?.role ?? null, userId: row?.id ?? null, userPhone: row?.phone ?? null } as const;
}

export function hasAppRole(appRole: UserRole | null, allowed: UserRole[]): boolean {
  return appRole != null && allowed.includes(appRole);
}
