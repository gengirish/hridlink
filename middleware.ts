import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { cleanEnv, filterCookiesForFly } from "@/lib/fly-proxy";

// Page routes gated by Neon Auth middleware (Fly API routes auth via session cookies + roles)
const AUTH_PROTECTED = ["/admin", "/cardiologist", "/register", "/ecg-upload"];
// Routes proxied to Fly.io — need X-Internal-Secret injected
const FLY_PROXIED = ["/api/patients", "/api/ecg", "/api/admin"];

const authMiddleware = auth.middleware({ loginUrl: "/sign-in" });
const INTERNAL_SECRET = cleanEnv(process.env.INTERNAL_API_SECRET);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Auth gate for protected routes
  const needsAuth = AUTH_PROTECTED.some((p) => pathname.startsWith(p));
  if (needsAuth) {
    // @ts-expect-error — auth middleware is Next.js-compatible; event arg unused
    const authResult = await Promise.resolve(authMiddleware(req, {}));
    if (authResult) return authResult as NextResponse;
  }

  // 2. Inject X-Internal-Secret for Fly.io-proxied routes (headers forwarded by Next.js rewrites)
  if (INTERNAL_SECRET && FLY_PROXIED.some((p) => pathname.startsWith(p))) {
    const reqHeaders = new Headers(req.headers);
    reqHeaders.set("x-internal-secret", INTERNAL_SECRET);
    const filteredCookie = filterCookiesForFly(req.headers.get("cookie"));
    if (filteredCookie) reqHeaders.set("cookie", filteredCookie);
    else reqHeaders.delete("cookie");
    return NextResponse.next({ request: { headers: reqHeaders } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/cardiologist/:path*",
    "/register",
    "/ecg-upload",
    "/api/admin",
    "/api/admin/:path*",
    "/api/ecg",
    "/api/ecg/:path*",
    "/api/patients",
    "/api/patients/:path*",
  ],
};
