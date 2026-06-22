import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";

// Routes that the Neon Auth middleware must gate
const AUTH_PROTECTED = ["/admin", "/cardiologist", "/register", "/ecg-upload", "/api/admin", "/api/ecg/"];
// Routes proxied to Fly.io — need X-Internal-Secret injected
const FLY_PROXIED = ["/api/patients", "/api/ecg", "/api/admin"];

const authMiddleware = auth.middleware({ loginUrl: "/sign-in" });

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Auth gate for protected routes
  const needsAuth = AUTH_PROTECTED.some((p) => pathname.startsWith(p));
  if (needsAuth) {
    // @ts-expect-error — auth middleware is Next.js-compatible; event arg unused
    const authResult = await Promise.resolve(authMiddleware(req, {}));
    // If auth middleware returned a redirect or error, honour it
    if (authResult && (authResult as NextResponse).status !== 200) {
      return authResult as NextResponse;
    }
  }

  // 2. Inject X-Internal-Secret for Fly.io-proxied routes (headers forwarded by Next.js rewrites)
  const secret = process.env.INTERNAL_API_SECRET;
  if (secret && FLY_PROXIED.some((p) => pathname.startsWith(p))) {
    const headers = new Headers(req.headers);
    headers.set("x-internal-secret", secret);
    return NextResponse.next({ request: { headers } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/cardiologist/:path*",
    "/register",
    "/ecg-upload",
    "/api/admin/:path*",
    "/api/ecg",
    "/api/ecg/:path*",
    "/api/patients",
    "/api/patients/:path*",
  ],
};
