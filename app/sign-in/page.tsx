import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import SignInForm from "./sign-in-form";

export const dynamic = "force-dynamic";

function SignInFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <p className="text-sm text-ink-500">Loading…</p>
    </main>
  );
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const { data: session } = await auth.getSession();
  if (session?.user) {
    let target = "/";
    for (const key of ["redirect_url", "returnTo"] as const) {
      const v = searchParams[key];
      const raw = Array.isArray(v) ? v[0] : v;
      if (typeof raw === "string") {
        const t = raw.trim();
        if (t.startsWith("/") && !t.startsWith("//")) {
          target = t;
          break;
        }
      }
    }
    redirect(target);
  }

  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInForm />
    </Suspense>
  );
}
