/** Strip BOM / CRLF pasted from Vercel or Fly env UIs. */
export function cleanEnv(val: string | undefined): string | undefined {
  if (val == null) return undefined;
  const cleaned = val.replace(/^\uFEFF/, "").replace(/\u200b/g, "").replace(/\r/g, "").trim();
  return cleaned.length > 0 ? cleaned : undefined;
}

export function getFlyProxyConfig(): { upstream: string; secret: string } | null {
  const upstream = cleanEnv(process.env.API_UPSTREAM_URL)?.replace(/\/$/, "");
  const secret = cleanEnv(process.env.INTERNAL_API_SECRET);
  if (!upstream || !secret) return null;
  return { upstream, secret };
}

const NEON_AUTH_COOKIE_PREFIXES = ["__Secure-neon-auth.", "neon-auth."] as const;
const NEON_AUTH_BLOATED_COOKIE_SUFFIX = ".local.session_data";

/**
 * Neon session tokens often contain `+`. Some proxies mis-parse `+` in Cookie headers
 * and drop later headers (including x-internal-secret). Forward only auth cookies
 * needed by Fly, excluding the large client cache cookie.
 */
export function filterCookiesForFly(cookieHeader: string | null | undefined): string {
  if (!cookieHeader?.trim()) return "";

  const pairs: string[] = [];
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const name = part.slice(0, eq).trim();
    const rawValue = part.slice(eq + 1).trim();
    if (!NEON_AUTH_COOKIE_PREFIXES.some((prefix) => name.startsWith(prefix))) continue;
    if (name.endsWith(NEON_AUTH_BLOATED_COOKIE_SUFFIX)) continue;
    pairs.push(`${name}=${encodeURIComponent(decodeURIComponent(rawValue))}`);
  }
  return pairs.join("; ");
}
