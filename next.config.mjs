import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const upstream = process.env.API_UPSTREAM_URL?.replace(/\/$/, "");

    if (!upstream) {
      // VERCEL=1 on all Vercel builds; VERCEL_ENV is production | preview | development
      if (process.env.VERCEL === "1") {
        const vercelEnv = process.env.VERCEL_ENV;
        if (vercelEnv === "preview" || vercelEnv === "development") {
          // Preview/development: allow build without Fly URL (add API_UPSTREAM_URL in Vercel to test /api proxy)
          return [];
        }
        throw new Error(
          "[hridlink] API_UPSTREAM_URL is required on Vercel Production. Add it in Project Settings → Environment Variables (Production)."
        );
      }
      // Local builds without the var: skip rewrites (API routes will 404 — run dev:stack instead)
      return [];
    }

    const proxy = (src, dest) => ({ source: src, destination: `${upstream}${dest}` });

    return [
      proxy("/api/patients", "/api/patients"),
      proxy("/api/patients/:path*", "/api/patients/:path*"),
      proxy("/api/ecg", "/api/ecg"),
      proxy("/api/ecg/:path*", "/api/ecg/:path*"),
      proxy("/api/admin/:path*", "/api/admin/:path*"),
    ];
  },
};

export default withPWA(nextConfig);
