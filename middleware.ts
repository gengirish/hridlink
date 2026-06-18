import { auth } from "@/lib/auth/server";

/**
 * Session gate for role-sensitive routes only. Public routes are not matched.
 * @see https://neon.com/docs/auth/reference/nextjs-server#authmiddleware
 */
export default auth.middleware({
  loginUrl: "/sign-in",
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/cardiologist/:path*",
    "/api/admin/:path*",
    "/api/ecg/:id/finding",
  ],
};
