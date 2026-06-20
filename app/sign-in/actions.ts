"use server";

import { formatAuthActionError } from "@/lib/auth/format-auth-action-error";
import { auth } from "@/lib/auth/server";
import { syncAppUserFromSession } from "@/lib/auth/sync-app-user";
import { getFormString } from "@/lib/get-form-string";
import { redirect } from "next/navigation";

export async function signInWithEmail(
  _prevState: { error: string } | null,
  formData: FormData
) {
  const returnTo = getFormString(formData, "returnTo");
  const { data: existing } = await auth.getSession();
  if (existing?.user) {
    const target = returnTo.trim();
    if (target.startsWith("/") && !target.startsWith("//")) {
      redirect(target);
    }
    redirect("/");
  }

  const email = getFormString(formData, "email");
  const password = getFormString(formData, "password");

  const { error } = await auth.signIn.email({ email, password });

  if (error) {
    return {
      error: formatAuthActionError(error.message, "Failed to sign in. Try again."),
    };
  }

  await syncAppUserFromSession();

  if (returnTo.startsWith("/") && !returnTo.startsWith("//")) {
    redirect(returnTo);
  }
  redirect("/");
}
