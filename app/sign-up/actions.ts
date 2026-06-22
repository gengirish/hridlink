"use server";

import { formatAuthActionError } from "@/lib/auth/format-auth-action-error";
import { auth } from "@/lib/auth/server";
import { syncAppUserFromSession } from "@/lib/auth/sync-app-user";
import { getFormString } from "@/lib/get-form-string";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

function normalizeIndianPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91") && /^[6-9]/.test(digits[2]!)) return `+${digits}`;
  return raw.trim();
}

export async function signUpWithEmail(
  _prevState: { error: string } | null,
  formData: FormData
) {
  const { data: existing } = await auth.getSession();
  if (existing?.user) {
    redirect("/");
  }

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

  const rawPhone = getFormString(formData, "phone");
  if (rawPhone?.trim()) {
    const normalizedPhone = normalizeIndianPhone(rawPhone);
    if (!/^\+91[6-9]\d{9}$/.test(normalizedPhone)) {
      return { error: "Enter a valid 10-digit Indian mobile number, or leave it blank." };
    }
    const { data: session } = await auth.getSession();
    if (session?.user?.id) {
      await prisma.user.update({
        where: { authUserId: session.user.id },
        data: { phone: normalizedPhone },
      });
    }
  }

  redirect("/");
}
