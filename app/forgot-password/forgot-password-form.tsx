"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { AuthShell } from "@/components/auth-shell";

function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError("Enter the email you signed up with.");
      return;
    }

    setLoading(true);
    try {
      const { error: resetError } = await authClient.requestPasswordReset({
        email: trimmed,
        redirectTo: `${window.location.origin}/reset-password`,
      });

      // Neon Auth returns success regardless of whether the email exists
      // (account-enumeration protection). We surface the generic confirmation
      // either way unless the request itself failed (network / rate limit).
      if (resetError) {
        setError(
          resetError.message || "Couldn't send the reset email. Please try again.",
        );
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="We'll email you a link to set a new one."
      footer={
        <p className="text-center text-sm text-ink-500">
          Remembered it?{" "}
          <Link href="/sign-in" className="link">
            Back to sign in
          </Link>
        </p>
      }
    >
      <div className="card p-6 shadow-lift sm:p-7">
        {submitted ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" aria-hidden />
            </div>
            <h2 className="text-lg font-semibold text-ink-900">Check your inbox</h2>
            <p className="text-sm text-ink-500">
              If an account exists for{" "}
              <span className="font-medium text-ink-800">{email.trim().toLowerCase()}</span>, we&apos;ve
              sent a password-reset link. It expires in 15 minutes and works once.
            </p>
            <p className="text-xs text-ink-400">
              Don&apos;t see it after a minute? Check spam, or{" "}
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setError(null);
                }}
                className="link"
              >
                try a different email
              </button>
              .
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
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
                  autoFocus
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  className="input"
                  placeholder="you@clinic.org"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "forgot-error" : undefined}
                />
              </div>

              {error ? (
                <p
                  id="forgot-error"
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                >
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                aria-busy={loading}
                className="btn-primary w-full py-3 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Sending…
                  </>
                ) : (
                  "Send reset link"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </AuthShell>
  );
}

export default ForgotPasswordForm;
