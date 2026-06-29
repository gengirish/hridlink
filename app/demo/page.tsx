import Link from "next/link";
import { Heart, Stethoscope, BarChart3, Info, KeyRound } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import {
  BETA_ACCOUNTS,
  BETA_DEMO_APP_URL,
  BETA_DEMO_PASSWORD,
  DEMO_PATIENT_PHONES,
} from "@/lib/demo-beta";

export const metadata = { title: "Demo Guide" };

const roles = [
  {
    icon: Heart,
    accent: "border-brand-200/80 bg-brand-50/50",
    iconWrap: "bg-brand-600 text-white ring-1 ring-black/10",
    title: "Health worker",
    email: "hw@hridlink.com",
    steps: [
      "Sign up once at /sign-up with hw@hridlink.com and the demo password below.",
      "Open Register → add a patient (mobile is used to find them during upload).",
      "Open Upload ECG → search by mobile → attach an image or PDF → submit.",
      "Open My ECGs → track pending reviews and read cardiologist findings in-app.",
    ],
  },
  {
    icon: Stethoscope,
    accent: "border-clinical-200/80 bg-clinical-50/40",
    iconWrap: "bg-clinical-600 text-white ring-1 ring-black/10",
    title: "Cardiologist",
    email: "dr.cardiac@hridlink.com",
    steps: [
      "Sign up once at /sign-up with dr.cardiac@hridlink.com (claims seeded cardiologist role).",
      "Open Cardiologist → pending queue auto-refreshes (includes demo pending case).",
      "Tap a row → zoom the strip → submit severity + notes + recommendation.",
    ],
  },
  {
    icon: BarChart3,
    accent: "border-ink-200 bg-ink-50/60",
    iconWrap: "bg-ink-900 text-white ring-1 ring-black/10",
    title: "Admin",
    email: "admin@hridlink.com",
    steps: [
      "Sign up once at /sign-up with admin@hridlink.com.",
      "Open Admin → scan pilot counters (median response, completion rate) and triage mix.",
      "Use Team tab to promote real beta users — no DB edits needed.",
      "Export CSV for offline reporting (includes reviewer and clinical notes).",
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
          description="Beta accounts are pre-configured on production. Sign up once per role, then run the end-to-end flow."
        />

        <div className="card mb-6 border-brand-200/80 bg-brand-50/40 p-5 shadow-sm ring-1 ring-brand-100">
          <div className="flex items-start gap-3">
            <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink-900">Beta demo credentials</p>
              <p className="mt-1 text-xs text-ink-600">
                Shared password for all demo accounts:{" "}
                <code className="rounded bg-white/90 px-1.5 py-0.5 font-mono text-brand-800 ring-1 ring-brand-200/60">
                  {BETA_DEMO_PASSWORD}
                </code>
              </p>
              <p className="mt-2 text-xs text-ink-500">
                First visit: use <strong>Sign up</strong> (not sign-in). Mobile for health worker:{" "}
                <code className="font-mono">9876543212</code>
              </p>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto rounded-xl border border-brand-200/60 bg-white/80">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-brand-100 text-left text-xs uppercase tracking-wide text-ink-500">
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Dashboard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {BETA_ACCOUNTS.map((a) => (
                  <tr key={a.email}>
                    <td className="px-3 py-2.5 font-medium text-ink-900">{a.role}</td>
                    <td className="px-3 py-2.5">
                      <code className="font-mono text-xs text-ink-700">{a.email}</code>
                    </td>
                    <td className="px-3 py-2.5">
                      <Link href={a.dashboard} className="link text-xs">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/sign-up" className="btn-primary py-2 text-xs">
              Sign up (first time)
            </Link>
            <Link href="/sign-in" className="btn-secondary py-2 text-xs">
              Sign in (returning)
            </Link>
          </div>
        </div>

        <div className="card mb-6 flex gap-3 border-clinical-200/60 bg-clinical-50/35 p-4 shadow-sm ring-1 ring-clinical-100/80">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-clinical-700" aria-hidden />
          <div className="text-sm leading-relaxed text-clinical-950/90">
            <p className="font-medium">Pre-loaded demo patients</p>
            <ul className="mt-2 space-y-1 text-xs">
              {DEMO_PATIENT_PHONES.map((p) => (
                <li key={p.phone}>
                  <strong>{p.name}</strong> — phone{" "}
                  <code className="font-mono">{p.phone}</code> ({p.village})
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-clinical-800/80">
              Includes 1 pending, 1 reviewed, and 1 urgent sample ECG in the cardiologist queue.
              Re-seed anytime:{" "}
              <code className="rounded-md bg-white/80 px-1 font-mono ring-1 ring-clinical-200/60">
                npm run db:seed-beta
              </code>
            </p>
          </div>
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
              ["/my-ecgs", "My ECGs"],
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
              "Health worker (hw@…): register patient → upload ECG → open My ECGs.",
              "Cardiologist (dr.cardiac@…): open queue → review pending demo case → submit URGENT finding.",
              "Health worker: refresh My ECGs — finding appears (WhatsApp too if MSG91 configured).",
              "Admin (admin@…): confirm median response + export CSV.",
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

        <p className="mt-6 text-center text-xs text-ink-400">
          Production:{" "}
          <a href={BETA_DEMO_APP_URL} className="link text-xs">
            {BETA_DEMO_APP_URL}
          </a>
          {" · "}
          Full doc: docs/BETA-DEMO-USERS.md
        </p>
      </div>
    </main>
  );
}
