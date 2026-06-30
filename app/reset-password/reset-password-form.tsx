"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/client";
import { AuthShell } from "@/components/auth-shell";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  // Neon Auth redirects with ?error=INVALID_TOKEN when the link is bad/expired.
  const linkError = searchParams.get("error");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tokenMissing = !token || token.length < 10 || linkError != null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (resetError) {
        const msg =
          resetError.message ||
          "Couldn't reset your password. The link may have expired — request a new one.";
        setError(msg);
        return;
      }

      toast.success("Password reset — sign in with your new password");
      router.push("/sign-in");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Pick something you'll remember — at least 8 characters."
      footer={
        <p className="text-center text-sm text-ink-500">
          Remembered your password?{" "}
          <Link href="/sign-in" className="link">
            Sign in
          </Link>
        </p>
      }
    >
      <div className="card p-6 shadow-lift sm:p-7">
        {tokenMissing ? (
          <div className="space-y-4 text-center">
            <h2 className="text-lg font-semibold text-ink-900">
              This reset link looks broken
            </h2>
            <p className="text-sm text-ink-500">
              The link is missing, malformed, or has expired. Reset links work once and
              expire after 15 minutes — request a fresh one.
            </p>
            <Link href="/forgot-password" className="btn-primary inline-flex px-4 py-2.5">
              Request a new link
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <label htmlFor="password" className="label">
                  New password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  autoFocus
                  minLength={8}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  className="input"
                  placeholder="At least 8 characters"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "reset-error" : undefined}
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="label">
                  Confirm new password
                </label>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError(null);
                  }}
                  className="input"
                  placeholder="Type it again"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "reset-error" : undefined}
                />
              </div>

              {error ? (
                <p
                  id="reset-error"
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                >
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                aria-busy={loading}
                className="btn-primary w-full py-3 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Resetting…
                  </>
                ) : (
                  "Reset password"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </AuthShell>
  );
}

export default ResetPasswordForm;
