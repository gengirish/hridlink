/**
 * Turn opaque Neon Auth / Better Auth messages into actionable copy for operators.
 */
export function formatAuthActionError(message: string | undefined, fallback: string): string {
  const m = (message ?? "").trim() || fallback;
  if (/invalid\s+origin/i.test(m)) {
    return `${m} — Add this exact site URL (scheme + host, no trailing slash) under Neon Console → your project → Auth → trusted / allowed application URLs. It must match the address bar and NEXT_PUBLIC_APP_URL.`;
  }
  return m;
}
