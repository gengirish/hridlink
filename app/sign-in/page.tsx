import { Suspense } from "react";
import SignInForm from "./sign-in-form";

export const dynamic = "force-dynamic";

function SignInFallback() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-slate-400 text-sm">Loading…</p>
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
