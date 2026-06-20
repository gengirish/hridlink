import { Suspense } from "react";
import SignInForm from "./sign-in-form";

export const dynamic = "force-dynamic";

function SignInFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <p className="text-sm text-ink-500">Loading…</p>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInForm />
    </Suspense>
  );
}
