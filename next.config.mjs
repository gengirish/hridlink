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
  /**
   * Proxy data API to Fly.io while keeping `/api/auth/*` on Vercel (Neon Auth).
   * Set `API_UPSTREAM_URL` (e.g. https://hridlink-api.fly.dev) in Vercel + local `.env.local`.
   */
  async rewrites() {
    const api = process.env.API_UPSTREAM_URL?.trim();
    if (!api) return [];
    const origin = api.replace(/\/$/, "");
    return [
      { source: "/api/ecg/:id/finding", destination: `${origin}/api/ecg/:id/finding` },
      { source: "/api/patients", destination: `${origin}/api/patients` },
      { source: "/api/ecg", destination: `${origin}/api/ecg` },
      { source: "/api/admin/stats", destination: `${origin}/api/admin/stats` },
    ];
  },
};

export default withPWA(nextConfig);
