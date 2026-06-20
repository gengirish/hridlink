"use client";

import { useFormState } from "react-dom";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { signInWithEmail } from "./actions";
import { AuthShell } from "@/components/auth-shell";

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
            <label htmlFor="password" className="label">
              Password
            </label>
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

          <button type="submit" className="btn-primary w-full py-3">
            Sign in
          </button>
        </div>
      </form>
    </AuthShell>
  );
}

export default SignInForm;
