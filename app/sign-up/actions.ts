"use server";

import { formatAuthActionError } from "@/lib/auth/format-auth-action-error";
import { auth } from "@/lib/auth/server";
import { syncAppUserFromSession } from "@/lib/auth/sync-app-user";
import { getFormString } from "@/lib/get-form-string";
import { redirect } from "next/navigation";

export async function signUpWithEmail(
  _prevState: { error: string } | null,
  formData: FormData
) {
  const email = getFormString(formData, "email");
  const name = getFormString(formData, "name");
  const password = getFormString(formData, "password");

  if (!email?.trim()) {
    return { error: "Email is required." };
  }

  const { error } = await auth.signUp.email({
    email: email.trim(),
    name: name?.trim() || email.split("@")[0] || "User",
    password,
  });

  if (error) {
    return {
      error: formatAuthActionError(error.message, "Failed to create account."),
    };
  }

  await syncAppUserFromSession();

  redirect("/");
}
