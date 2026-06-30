import { Suspense } from "react";
import ResetPasswordForm from "./reset-password-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reset password",
};

function Fallback() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <p className="text-sm text-ink-500">Loading…</p>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
