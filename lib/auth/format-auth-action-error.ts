/**
 * Turn opaque Neon Auth / Better Auth messages into actionable copy for operators.
 */
export function formatAuthActionError(message: string | undefined, fallback: string): string {
  const m = (message ?? "").trim() || fallback;
  if (/invalid\s+origin/i.test(m)) {
    return `${m} — In Neon Console open your database branch → Auth → Configuration → Domains → Add domain. Use the exact app origin (e.g. https://hridlink.vercel.app): include https, no trailing slash, same host as the address bar and NEXT_PUBLIC_APP_URL. Docs: https://neon.com/docs/auth/guides/configure-domains`;
  }
  return m;
}
