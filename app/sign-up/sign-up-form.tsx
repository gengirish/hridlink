"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { signUpWithEmail } from "./actions";
import { AuthShell } from "@/components/auth-shell";

export default function SignUpForm() {
  const [state, formAction] = useFormState(signUpWithEmail, null);

  return (
    <AuthShell
      title="Create your account"
      subtitle="Use a pilot email pattern if you need a specific role—see the demo guide."
      footer={
        <p className="text-center text-sm text-ink-500">
          Already registered?{" "}
          <Link href="/sign-in" className="link">
            Sign in
          </Link>
        </p>
      }
    >
      <form action={formAction} className="card p-6 shadow-lift sm:p-7">
        <div className="space-y-5">
          <div>
            <label htmlFor="name" className="label">
              Full name
            </label>
            <input id="name" name="name" type="text" required className="input" placeholder="Dr. Ananya Rao" />
          </div>

          <div>
            <label htmlFor="email" className="label">
              Work email
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
              autoComplete="new-password"
              className="input"
              placeholder="At least 8 characters"
            />
          </div>

          {state?.error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {state.error}
            </p>
          ) : null}

          <button type="submit" className="btn-primary w-full py-3">
            Create account
          </button>
        </div>
      </form>
    </AuthShell>
  );
}
