import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getSessionAppUser, hasAppRole } from "@/lib/auth/app-user";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const row = await getSessionAppUser();
  if (!row) {
    redirect("/sign-in");
  }
  if (!hasAppRole(row.appRole, [UserRole.ADMIN])) {
    redirect("/");
  }
  return children;
}
