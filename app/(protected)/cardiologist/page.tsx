import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getSessionAppUser, hasAppRole } from "@/lib/auth/app-user";
import { RoleGate } from "@/components/role-gate";
import { serverFetchJson } from "@/lib/server-data";
import { CardiologistQueue, type ECGListData } from "./cardiologist-queue";

export const dynamic = "force-dynamic";

export default async function CardiologistPage() {
  const row = await getSessionAppUser();
  if (!row) {
    redirect("/sign-in");
  }
  if (!hasAppRole(row.appRole, [UserRole.CARDIOLOGIST])) {
    return <RoleGate roleLabel="cardiologist" />;
  }

  const initialList = await serverFetchJson<ECGListData>("/api/ecg?status=PENDING&limit=50");
  return <CardiologistQueue initialList={initialList} />;
}
