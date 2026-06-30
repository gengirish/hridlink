import { Suspense } from "react";
import ForgotPasswordForm from "./forgot-password-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Forgot password",
};

function Fallback() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <p className="text-sm text-ink-500">Loading…</p>
    </main>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
