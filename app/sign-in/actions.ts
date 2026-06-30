"use server";

import { getSessionAppUser } from "@/lib/auth/app-user";
import { formatAuthActionError } from "@/lib/auth/format-auth-action-error";
import { auth } from "@/lib/auth/server";
import { syncAppUserFromSession } from "@/lib/auth/sync-app-user";
import { getFormString } from "@/lib/get-form-string";
import { defaultPathForRole } from "@/lib/roles";
import { redirect } from "next/navigation";

/** Append the post-login welcome flag so the client can surface a "signed in as" toast. */
function withWelcome(path: string): string {
  return path.includes("?") ? `${path}&welcome=1` : `${path}?welcome=1`;
}

function isSafeReturnTo(returnTo: string): boolean {
  const t = returnTo.trim();
  return t.startsWith("/") && !t.startsWith("//");
}

export async function signInWithEmail(
  _prevState: { error: string } | null,
  formData: FormData
) {
  const returnTo = getFormString(formData, "returnTo");
  const { data: existing } = await auth.getSession();
  if (existing?.user) {
    if (isSafeReturnTo(returnTo)) {
      redirect(returnTo.trim());
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

  if (isSafeReturnTo(returnTo)) {
    redirect(withWelcome(returnTo.trim()));
  }

  const appUser = await getSessionAppUser();
  redirect(withWelcome(defaultPathForRole(appUser?.appRole)));
}
