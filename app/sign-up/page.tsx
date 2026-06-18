"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { signUpWithEmail } from "./actions";

export default function SignUpForm() {
  const [state, formAction] = useFormState(signUpWithEmail, null);

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-bold text-slate-800 text-center mb-1">Create account</h1>
        <p className="text-xs text-slate-500 text-center mb-6">HridLink · Neon Auth</p>

        <form action={formAction} className="card p-5 space-y-4">
          <div>
            <label htmlFor="name" className="label">
              Name
            </label>
            <input id="name" name="name" type="text" required className="input" placeholder="Your name" />
          </div>

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
              placeholder="you@example.com"
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
              placeholder="••••••••"
            />
          </div>

          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

          <button type="submit" className="btn-primary w-full">
            Create account
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-4">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-brand-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
