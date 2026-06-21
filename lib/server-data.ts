import { headers } from "next/headers";
import type { ApiResponse } from "@/lib/api-response";

/** Server-only same-origin fetch with the incoming request cookies (for Fly-proxied `/api/*`). */
export async function serverFetchJson<T>(path: string): Promise<T | null> {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return null;
  const proto = h.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const res = await fetch(`${proto}://${host}${normalized}`, {
    headers: { cookie: h.get("cookie") ?? "" },
    cache: "no-store",
  });
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
