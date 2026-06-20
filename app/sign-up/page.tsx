import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import SignUpForm from "./sign-up-form";

export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  const { data: session } = await auth.getSession();
  if (session?.user) {
    redirect("/");
  }

  return <SignUpForm />;
}
