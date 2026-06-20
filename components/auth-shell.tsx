import Link from "next/link";
import { Heart } from "lucide-react";
import type { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 20% 10%, rgb(254 202 202 / 0.5), transparent 55%), radial-gradient(ellipse 60% 45% at 85% 20%, rgb(153 246 228 / 0.35), transparent 50%), linear-gradient(180deg, rgb(248 250 252) 0%, rgb(241 245 249) 100%)",
        }}
      />
      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-12 sm:px-6">
        <Link
          href="/"
          className="mx-auto mb-8 flex items-center gap-2 rounded-2xl border border-ink-200/80 bg-white/90 px-3 py-2 text-sm font-semibold text-ink-800 shadow-sm backdrop-blur transition hover:border-brand-200 hover:text-brand-800"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm ring-1 ring-black/10">
            <Heart className="h-4 w-4" aria-hidden />
          </span>
          HridLink
        </Link>

        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-ink-500">{subtitle}</p> : null}
        </div>

        <div className="mt-8">{children}</div>

        {footer ? <div className="mt-6">{footer}</div> : null}
      </div>
    </main>
  );
}
