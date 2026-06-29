/** Shared beta/demo account definitions — safe to show on /demo (pilot-only passwords). */

export const BETA_DEMO_PASSWORD = "HridLinkDemo2026!";

export const BETA_DEMO_APP_URL =
  (process.env.NEXT_PUBLIC_APP_URL ?? "https://hridlink.vercel.app").replace(/\/$/, "");

export const BETA_ACCOUNTS = [
  {
    role: "Health worker",
    email: "hw@hridlink.com",
    name: "Lakshmi Devi",
    phone: "+91 98765 43212",
    dashboard: "/my-ecgs",
    description: "Register patients, upload ECGs, read findings",
  },
  {
    role: "Cardiologist",
    email: "dr.cardiac@hridlink.com",
    name: "Dr. Anand Sharma",
    phone: "+91 90000 00001",
    dashboard: "/cardiologist",
    description: "Review pending queue and submit findings",
  },
  {
    role: "Admin",
    email: "admin@hridlink.com",
    name: "Pilot Admin",
    phone: "+91 90000 00002",
    dashboard: "/admin",
    description: "Pilot metrics, team roles, CSV export",
  },
] as const;

export const DEMO_PATIENT_PHONES = [
  { name: "Ramanna Goud", phone: "9876543210", village: "Kothapally" },
  { name: "Sarojamma Reddy", phone: "9876543211", village: "Bommalaramaram" },
] as const;
