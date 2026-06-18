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
   * All **data** HTTP routes are served only on Fly.io. Next.js has no `app/api` handlers
   * for patients/ECG/admin (only `/api/auth/*` remains here). Requests to `/api/patients`,
   * `/api/ecg`, etc. are rewritten to `API_UPSTREAM_URL` (same-origin from the browser; cookies forwarded).
   */
  async rewrites() {
    const api = process.env.API_UPSTREAM_URL?.trim();
    if (!api) {
      if (process.env.NODE_ENV === "production") {
        throw new Error(
          "API_UPSTREAM_URL is required for production builds. Data APIs live on Fly only; set e.g. https://hridlink-api.fly.dev (no trailing slash)."
        );
      }
      console.warn(
        "[next.config] API_UPSTREAM_URL is not set — /api/patients, /api/ecg, /api/admin/stats will 404. For local dev set API_UPSTREAM_URL=http://127.0.0.1:8080 and run `npm run dev:stack` (or Fly URL against a deployed API)."
      );
      return [];
    }
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
