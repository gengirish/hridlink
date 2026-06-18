import Link from "next/link";
import { Heart, Stethoscope, BarChart3, Upload, Info } from "lucide-react";

export const metadata = { title: "Demo Guide" };

const roles = [
  {
    icon: Heart,
    color: "bg-brand-100 text-brand-600",
    title: "Health Worker",
    email: "any email (no role needed)",
    steps: [
      "Sign up at /sign-up with any email",
      "Go to /register → add patient Ramanna Goud, +919876543210",
      "Go to /ecg-upload → search patient → upload any image",
    ],
  },
  {
    icon: Stethoscope,
    color: "bg-blue-100 text-blue-600",
    title: "Cardiologist",
    email: "dr.cardiac@hridlink.com",
    steps: [
      "Sign up at /sign-up with dr.cardiac@hridlink.com",
      "Go to /cardiologist → see pending ECGs",
      "Click a row → view ECG → submit severity + clinical notes",
    ],
  },
  {
    icon: BarChart3,
    color: "bg-purple-100 text-purple-600",
    title: "Admin",
    email: "admin@hridlink.com",
    steps: [
      "Sign up at /sign-up with admin@hridlink.com",
      "Go to /admin → see pilot stats + CSV export",
    ],
  },
];

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-none">HridLink Demo Guide</h1>
            <p className="text-xs text-slate-500">IntelliForge Digital Services</p>
          </div>
        </div>

        <div className="card p-4 mb-4 flex gap-3 bg-blue-50 border border-blue-100">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            Roles are assigned by email. Sign up with the exact email shown below to get that role.
            The database already has seed patients and ECG records — run{" "}
            <code className="bg-blue-100 px-1 rounded text-xs">npm run db:seed</code> if needed.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          {roles.map((r) => {
            const Icon = r.icon;
            return (
              <div key={r.title} className="card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-lg ${r.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{r.title}</p>
                    <p className="text-xs font-mono text-slate-500">{r.email}</p>
                  </div>
                </div>
                <ol className="space-y-1 ml-11">
                  {r.steps.map((s, i) => (
                    <li key={i} className="text-sm text-slate-600 flex gap-2">
                      <span className="text-slate-400 font-mono text-xs mt-0.5">{i + 1}.</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
        </div>

        <div className="card p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Quick Links
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              ["/sign-up", "Sign Up"],
              ["/sign-in", "Sign In"],
              ["/register", "Register Patient"],
              ["/ecg-upload", "Upload ECG"],
              ["/cardiologist", "Cardiologist"],
              ["/admin", "Admin Stats"],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="btn-secondary text-xs text-center">
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="card p-5 mt-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Demo Flow (end-to-end)
          </p>
          <ol className="space-y-2">
            {[
              "Sign up as HW (any email) → register patient → upload ECG photo",
              "Open new tab → sign up as cardiologist (dr.cardiac@hridlink.com)",
              "Go to /cardiologist → see the new ECG → click → submit URGENT finding",
              "Open new tab → sign up as admin (admin@hridlink.com)",
              "Go to /admin → see Urgent count increase + export CSV",
            ].map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-700">
                <span className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </main>
  );
}
