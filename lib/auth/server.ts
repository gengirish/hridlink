import { createNeonAuth } from "@neondatabase/auth/next/server";

function neonAuthEnv() {
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;

  if (baseUrl && cookieSecret && cookieSecret.length >= 32) {
    return { baseUrl, cookies: { secret: cookieSecret } as const };
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET (32+ characters) are required in production. See https://neon.com/docs/auth/overview"
    );
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
