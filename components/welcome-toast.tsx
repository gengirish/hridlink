"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { roleLabel } from "@/lib/roles";

/**
 * Shows a "Signed in as <role>" toast once after login.
 * Triggered by the `?welcome=1` flag set by the sign-in / sign-up server actions,
 * then strips the flag from the URL so a refresh doesn't repeat it.
 */
export function WelcomeToast() {
  // Root layout persists across navigation; re-run when the post-login redirect changes the path.
  const pathname = usePathname();

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("welcome") !== "1") return;

    url.searchParams.delete("welcome");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);

    let cancelled = false;
    fetch("/api/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { role?: string | null; name?: string | null; email?: string | null } | null) => {
        if (cancelled) return;
        const label = roleLabel(data?.role);
        const who = data?.name?.trim() || data?.email?.trim();
        toast.success(`Signed in as ${label}`, {
          description: who ? `Welcome back, ${who}` : undefined,
          duration: 4000,
        });
      })
      .catch(() => {
        if (!cancelled) toast.success("Signed in");
      });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}
