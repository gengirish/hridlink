import Link from "next/link";
import { Heart, Stethoscope, BarChart3, Upload, Info } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Demo Guide" };

const roles = [
  {
    icon: Heart,
    accent: "border-brand-200/80 bg-brand-50/50",
    iconWrap: "bg-brand-600 text-white ring-1 ring-black/10",
    title: "Health worker",
    email: "Any email (no special role)",
    steps: [
      "Sign up at /sign-up with any email you control.",
      "Open Register → add a patient (mobile will be used to find them later).",
      "Open Upload ECG → search by mobile → attach an image or PDF → submit.",
    ],
  },
  {
    icon: Stethoscope,
    accent: "border-clinical-200/80 bg-clinical-50/40",
    iconWrap: "bg-clinical-600 text-white ring-1 ring-black/10",
    title: "Cardiologist",
    email: "dr.cardiac@hridlink.com",
    steps: [
      "Sign up at /sign-up with dr.cardiac@hridlink.com (seed role mapping).",
      "Open Cardiologist → pending queue auto-refreshes.",
      "Tap a row → review the strip → submit severity + notes + recommendation.",
    ],
  },
  {
    icon: BarChart3,
    accent: "border-ink-200 bg-ink-50/60",
    iconWrap: "bg-ink-900 text-white ring-1 ring-black/10",
    title: "Admin",
    email: "admin@hridlink.com",
    steps: [
      "Sign up at /sign-up with admin@hridlink.com.",
      "Open Admin → scan pilot counters and triage mix.",
      "Export CSV for offline reporting.",
    ],
  },
] as const;

export default function DemoPage() {
  return (
    <main className="min-h-[calc(100vh-3.5rem)] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <PageHeader
          icon={Heart}
          title="Demo guide"
          description="Walk each role once—then run the end-to-end flow to validate WhatsApp hand-offs and CSV export."
        />

        <div className="card mb-6 flex gap-3 border-clinical-200/60 bg-clinical-50/35 p-4 shadow-sm ring-1 ring-clinical-100/80">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-clinical-700" aria-hidden />
          <p className="text-sm leading-relaxed text-clinical-950/90">
            Roles are assigned from email at sign-up. If lists look empty, run{" "}
            <code className="rounded-md bg-white/80 px-1.5 py-0.5 font-mono text-xs text-ink-800 ring-1 ring-clinical-200/60">
              npm run db:seed
            </code>{" "}
            locally.
          </p>
        </div>

        <div className="space-y-4">
          {roles.map((r) => {
            const Icon = r.icon;
            return (
              <section
                key={r.title}
                className={`card p-5 shadow-sm ring-1 ring-black/5 sm:p-6 ${r.accent}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${r.iconWrap}`}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-ink-900">{r.title}</h2>
                    <p className="mt-0.5 font-mono text-xs text-ink-600">{r.email}</p>
                  </div>
                </div>
                <ol className="mt-4 space-y-2 border-t border-white/40 pt-4">
                  {r.steps.map((s, i) => (
                    <li key={s} className="flex gap-3 text-sm leading-relaxed text-ink-700">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/80 text-xs font-bold text-ink-600 ring-1 ring-ink-200/80">
                        {i + 1}
                      </span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
              </section>
            );
          })}
        </div>

        <div className="card mt-6 p-5 shadow-sm sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">Quick links</p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              ["/sign-up", "Sign up"],
              ["/sign-in", "Sign in"],
              ["/register", "Register patient"],
              ["/ecg-upload", "Upload ECG"],
              ["/cardiologist", "Cardiologist"],
              ["/admin", "Admin stats"],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="btn-secondary justify-center py-2.5 text-center text-xs">
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="card mt-4 p-5 shadow-sm sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">End-to-end smoke</p>
          <ol className="mt-4 space-y-3">
            {[
              "Health worker: register patient → upload ECG photo.",
              "New session: sign up as cardiologist → open queue → submit an URGENT finding.",
              "New session: sign up as admin → confirm counters + export CSV.",
            ].map((step, i) => (
              <li key={step} className="flex gap-3 text-sm leading-relaxed text-ink-700">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white shadow-sm ring-1 ring-black/10">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </main>
  );
}
