import Link from "next/link";
import { Heart, Home } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 ring-1 ring-brand-200/80">
          <Heart className="h-7 w-7" aria-hidden />
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-ink-500">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink-900">This page does not exist</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-600">
          The link may be outdated, or the page was moved. Head back to the workspace home.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary inline-flex gap-2">
            <Home className="h-4 w-4" aria-hidden />
            Back to home
          </Link>
          <Link href="/demo" className="btn-secondary">
            Demo guide
          </Link>
        </div>
      </div>
    </main>
  );
}
