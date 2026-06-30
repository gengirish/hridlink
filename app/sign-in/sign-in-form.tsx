"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { signInWithEmail } from "./actions";
import { AuthShell } from "@/components/auth-shell";

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="btn-primary w-full py-3 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Signing in…
        </>
      ) : (
        children
      )}
    </button>
  );
}

function SignInForm() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("redirect_url") ?? searchParams.get("returnTo") ?? "";
  const [state, formAction] = useFormState(signInWithEmail, null);

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in with your Neon Auth account to continue."
      footer={
        <p className="text-center text-sm text-ink-500">
          No account?{" "}
          <Link href="/sign-up" className="link">
            Create one
          </Link>
        </p>
      }
    >
      <form action={formAction} className="card p-6 shadow-lift sm:p-7">
        <input type="hidden" name="returnTo" value={returnTo} />

        <div className="space-y-5">
          <div>
            <label htmlFor="email" className="label">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="input"
              placeholder="you@clinic.org"
            />
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor="password" className="label">
                Password
              </label>
              <Link href="/forgot-password" className="link text-sm">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="input"
              placeholder="••••••••"
            />
          </div>

          {state?.error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {state.error}
            </p>
          ) : null}

          <SubmitButton>Sign in</SubmitButton>
        </div>
      </form>
    </AuthShell>
  );
}

export default SignInForm;
