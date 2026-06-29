"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { memo, useEffect, useState } from "react";
import {
  Heart,
  UserPlus,
  Upload,
  Stethoscope,
  LayoutDashboard,
  LogIn,
  LogOut,
  BookOpen,
  ClipboardList,
} from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

type AppRole = "HEALTH_WORKER" | "CARDIOLOGIST" | "ADMIN";

const links = [
  { href: "/register", label: "Register", icon: UserPlus },
  { href: "/ecg-upload", label: "Upload ECG", icon: Upload },
  { href: "/my-ecgs", label: "My ECGs", icon: ClipboardList },
  { href: "/cardiologist", label: "Cardiologist", icon: Stethoscope },
  { href: "/admin", label: "Admin", icon: LayoutDashboard },
] as const;

type NavLink = (typeof links)[number];

// Safe default for a signed-in user whose role hasn't resolved yet (or HEALTH_WORKER).
function linksForRole(role: AppRole | null): readonly NavLink[] {
  switch (role) {
    case "ADMIN":
      return links.filter((l) => l.href === "/admin" || l.href === "/cardiologist");
    case "CARDIOLOGIST":
      return links.filter((l) => l.href === "/cardiologist" || l.href === "/ecg-upload");
    default:
      return links.filter(
        (l) => l.href === "/register" || l.href === "/ecg-upload" || l.href === "/my-ecgs"
      );
  }
}

const NavLinks = memo(function NavLinks({
  pathname,
  links: visibleLinks,
}: {
  pathname: string;
  links: readonly NavLink[];
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center justify-end gap-1 sm:justify-center sm:gap-0.5">
      <div className="flex max-w-[min(100%,28rem)] items-center gap-0.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:max-w-none [&::-webkit-scrollbar]:hidden">
        {visibleLinks.map((l) => {
          const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
          const Icon = l.icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition sm:px-3",
                active
                  ? "bg-brand-50 text-brand-800 ring-1 ring-brand-200/80"
                  : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
              )}
            >
              <Icon className="h-3.5 w-3.5 opacity-80" aria-hidden />
              <span className="hidden sm:inline">{l.label}</span>
              <span className="sm:hidden">{l.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
});

function NavAuth({
  pathname,
  session,
  isPending,
}: {
  pathname: string;
  session: ReturnType<typeof authClient.useSession>["data"];
  isPending: boolean;
}) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await authClient.signOut();
      router.refresh();
      router.push("/");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      <Link
        href="/demo"
        className={cn(
          "hidden items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition sm:inline-flex",
          pathname === "/demo"
            ? "bg-ink-100 text-ink-900"
            : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
        )}
      >
        <BookOpen className="h-3.5 w-3.5" aria-hidden />
        Demo
      </Link>
      {isPending ? (
        <span className="inline-flex min-w-[5.5rem] items-center justify-center rounded-xl border border-transparent px-2.5 py-2 text-xs font-semibold text-ink-400">
          …
        </span>
      ) : session?.user ? (
        <div className="flex items-center gap-1.5">
          <span
            className="hidden max-w-[10rem] truncate text-xs font-medium text-ink-600 sm:inline"
            title={session.user.email}
          >
            {session.user.name?.trim() || session.user.email}
          </span>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            disabled={signingOut}
            className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-2.5 py-2 text-xs font-semibold text-ink-800 shadow-sm transition hover:border-ink-300 hover:bg-ink-50 disabled:opacity-60"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden sm:inline">{signingOut ? "Signing out…" : "Sign out"}</span>
          </button>
        </div>
      ) : (
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-2.5 py-2 text-xs font-semibold text-ink-800 shadow-sm transition hover:border-ink-300 hover:bg-ink-50"
        >
          <LogIn className="h-3.5 w-3.5" aria-hidden />
          <span className="hidden sm:inline">Sign in</span>
        </Link>
      )}
    </div>
  );
}

export function AppNav() {
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();
  const signedIn = !!session?.user;
  const [role, setRole] = useState<AppRole | null>(null);

  useEffect(() => {
    if (!signedIn) {
      setRole(null);
      return;
    }
    let cancelled = false;
    fetch("/api/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { role?: AppRole | null } | null) => {
        if (!cancelled) setRole(data?.role ?? null);
      })
      .catch(() => {
        if (!cancelled) setRole(null);
      });
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  if (pathname.startsWith("/sign-")) return null;

  const visibleLinks = signedIn ? linksForRole(role) : [];

  return (
    <nav
      className="sticky top-0 z-40 border-b border-ink-200/60 bg-white/80 backdrop-blur-md"
      aria-label="Primary"
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2 rounded-lg py-1 text-ink-900 transition hover:text-brand-700"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm ring-1 ring-black/10 transition group-hover:bg-brand-700">
            <Heart className="h-4 w-4" aria-hidden />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-bold tracking-tight">HridLink</span>
            <span className="mt-0.5 hidden text-[10px] font-medium uppercase tracking-wider text-ink-500 sm:block">
              Rural cardiac care
            </span>
          </span>
        </Link>

        <NavLinks pathname={pathname} links={visibleLinks} />
        <NavAuth pathname={pathname} session={session} isPending={isPending} />
      </div>
    </nav>
  );
}
