import { createNeonAuth } from "@neondatabase/auth/next/server";

/** Vercel / dashboard pastes sometimes include BOM or trailing newlines — breaks `new URL(relative, base)`. */
function normalizeAuthEnvString(value: string | undefined): string | undefined {
  if (value == null) return undefined;
  const cleaned = value.replace(/^\uFEFF/, "").replace(/\u200b/g, "").trim();
  return cleaned.length > 0 ? cleaned : undefined;
}

function neonAuthEnv() {
  const baseUrl = normalizeAuthEnvString(process.env.NEON_AUTH_BASE_URL);
  const cookieSecret = normalizeAuthEnvString(process.env.NEON_AUTH_COOKIE_SECRET);

  if (baseUrl && cookieSecret && cookieSecret.length >= 32) {
    return { baseUrl, cookies: { secret: cookieSecret } as const };
  }

  if (process.env.NODE_ENV === "production") {
    /** `next build` on Vercel runs server layouts; env vars are not always needed for the compile graph. */
    const isVercelNpmBuild =
      process.env.VERCEL === "1" && process.env.npm_lifecycle_event === "build";
    if (!isVercelNpmBuild) {
      throw new Error(
        "NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET (32+ characters) are required in production. See https://neon.com/docs/auth/overview"
      );
    }
    console.warn(
      "[auth] Vercel production build: NEON_AUTH_* missing — using placeholders for build only. Set secrets on the Vercel project for runtime."
    );
    return {
      baseUrl: baseUrl || "http://127.0.0.1:9",
      cookies: { secret: (cookieSecret && cookieSecret.length >= 32 ? cookieSecret : "01234567890123456789012345678901") as string },
    };
  }

  console.warn(
    "[auth] NEON_AUTH_BASE_URL / NEON_AUTH_COOKIE_SECRET missing — using dev placeholders. Auth will not work until they are set."
  );

  return {
    baseUrl: baseUrl || "http://127.0.0.1:9",
    cookies: { secret: "01234567890123456789012345678901" },
  };
}

export const auth = createNeonAuth({
  ...neonAuthEnv(),
  logLevel: "warn",
});
