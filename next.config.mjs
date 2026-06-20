import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },

  async rewrites() {
    const upstream = process.env.API_UPSTREAM_URL?.replace(/\/$/, "");

    if (!upstream) {
      // VERCEL=1 is set in all Vercel build/runtime environments
      if (process.env.VERCEL === "1") {
        throw new Error(
          "[hridlink] API_UPSTREAM_URL is required on Vercel. Add it in Project Settings → Environment Variables."
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
