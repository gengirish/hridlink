import { headers } from "next/headers";
import type { ApiResponse } from "@/lib/api-response";
import { filterCookiesForFly, getFlyProxyConfig } from "@/lib/fly-proxy";

/** Server-only fetch to Fly (preferred) or same-origin `/api/*` with incoming cookies. */
export async function serverFetchJson<T>(path: string): Promise<T | null> {
  const h = headers();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const cookie = filterCookiesForFly(h.get("cookie"));
  const fly = getFlyProxyConfig();

  const url = fly ? `${fly.upstream}${normalized}` : buildSameOriginUrl(normalized, h);
  if (!url) return null;

  const reqHeaders: Record<string, string> = {};
  if (cookie) reqHeaders.cookie = cookie;
  if (fly) reqHeaders["x-internal-secret"] = fly.secret;

  const res = await fetch(url, { headers: reqHeaders, cache: "no-store" });
  if (!res.ok) return null;
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return null;
  }
  const body = json as ApiResponse<T>;
  return body.success && body.data != null ? body.data : null;
}

function buildSameOriginUrl(path: string, h: ReturnType<typeof headers>): string | null {
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return null;
  const proto = h.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
  return `${proto}://${host}${path}`;
}
