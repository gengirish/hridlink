import Link from "next/link";
import { ArrowRight, Heart, Upload, Stethoscope, BarChart3, Shield, Radio, Clock, ClipboardList } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-[calc(100vh-3.5rem)]">
      <section className="border-b border-ink-200/60 bg-white/60 px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-semibold text-ink-600 shadow-sm">
              <Radio className="h-3.5 w-3.5 text-clinical-600" aria-hidden />
              Pilot · IntelliForge Digital Services
            </p>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl sm:leading-[1.1]">
              ECGs from the village. <span className="text-brand-700">Review in minutes.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-600 sm:text-lg">
              HridLink connects rural health workers with cardiologists for fast ECG triage—clear
              workflows, WhatsApp alerts, and an audit-friendly trail for the pilot.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="btn-primary px-5 py-3 text-base">
                Register a patient
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="/ecg-upload" className="btn-secondary px-5 py-3 text-base">
                Upload an ECG
              </Link>
            </div>
            <p className="mt-3 text-xs text-ink-500">
              You&apos;ll be asked to sign in.{" "}
              <Link href="/sign-in" className="link text-xs">
                Sign in
              </Link>
            </p>
            <ul className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                { icon: Shield, t: "Built for field use", d: "Large tap targets, simple steps, low clutter." },
                { icon: Clock, t: "Faster turnaround", d: "Cardiologist queue with pending-first refresh." },
                { icon: Stethoscope, t: "Role-aware access", d: "Workers, specialists, and admin each see what they need." },
              ].map(({ icon: Icon, t, d }) => (
                <li key={t} className="rounded-2xl border border-ink-200/80 bg-white/90 p-4 shadow-sm">
                  <Icon className="h-5 w-5 text-clinical-600" aria-hidden />
                  <p className="mt-2 text-sm font-semibold text-ink-900">{t}</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-500">{d}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-100/80 via-white to-clinical-100/70 blur-2xl" aria-hidden />
            <div className="card border-ink-200/90 p-6 shadow-lift sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">Workspace</p>
              <p className="mt-1 text-lg font-semibold text-ink-900">Where do you want to go?</p>
              <div className="mt-6 space-y-3">
                <Link
                  href="/register"
                  className="group flex items-center gap-4 rounded-2xl border border-ink-100 bg-ink-50/50 p-4 transition hover:border-brand-200 hover:bg-brand-50/60"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm ring-1 ring-black/10">
                    <Heart className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-ink-900">Register patient</span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-ink-400 transition group-hover:translate-x-0.5 group-hover:text-brand-700" />
                    </span>
                    <span className="mt-0.5 block text-sm text-ink-500">Demographics + village + contact</span>
                  </span>
                </Link>
                <Link
                  href="/ecg-upload"
                  className="group flex items-center gap-4 rounded-2xl border border-ink-100 bg-ink-50/50 p-4 transition hover:border-brand-200 hover:bg-brand-50/60"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-brand-700 shadow-sm ring-1 ring-ink-200">
                    <Upload className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-ink-900">Upload ECG</span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-ink-400 transition group-hover:translate-x-0.5 group-hover:text-brand-700" />
                    </span>
                    <span className="mt-0.5 block text-sm text-ink-500">Find by mobile → attach file → submit</span>
                  </span>
                </Link>
                <Link
                  href="/my-ecgs"
                  className="group flex items-center gap-4 rounded-2xl border border-ink-100 bg-ink-50/50 p-4 transition hover:border-brand-200 hover:bg-brand-50/60"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-brand-700 shadow-sm ring-1 ring-ink-200">
                    <ClipboardList className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-ink-900">My ECGs</span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-ink-400 transition group-hover:translate-x-0.5 group-hover:text-brand-700" />
                    </span>
                    <span className="mt-0.5 block text-sm text-ink-500">Track uploads and read findings</span>
                  </span>
                </Link>
                <Link
                  href="/cardiologist"
                  className="group flex items-center gap-4 rounded-2xl border border-ink-100 bg-ink-50/50 p-4 transition hover:border-clinical-200 hover:bg-clinical-50/70"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-clinical-600 text-white shadow-sm ring-1 ring-black/10">
                    <Stethoscope className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-ink-900">Cardiologist</span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-ink-400 transition group-hover:translate-x-0.5 group-hover:text-clinical-700" />
                    </span>
                    <span className="mt-0.5 block text-sm text-ink-500">Pending queue, viewer, findings</span>
                  </span>
                </Link>
                <Link
                  href="/admin"
                  className="group flex items-center gap-4 rounded-2xl border border-ink-100 bg-ink-50/50 p-4 transition hover:border-ink-300 hover:bg-white"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-900 text-white shadow-sm ring-1 ring-black/10">
                    <BarChart3 className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-ink-900">Admin</span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-ink-400 transition group-hover:translate-x-0.5 group-hover:text-ink-700" />
                    </span>
                    <span className="mt-0.5 block text-sm text-ink-500">Pilot stats and CSV export</span>
                  </span>
                </Link>
              </div>
              <p className="mt-6 text-center text-xs text-ink-400">
                New here?{" "}
                <Link href="/demo" className="link text-xs">
                  Open the demo guide
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-4 border-t border-ink-200/60 pt-10 sm:flex-row sm:items-center">
          <p className="text-sm text-ink-500">
            <span className="font-medium text-ink-700">HridLink</span> · Rural cardiac telemedicine
          </p>
          <p className="text-xs text-ink-400">BuildwithAiGiri · gen.girish@gmail.com</p>
        </div>
      </section>
    </main>
  );
}
