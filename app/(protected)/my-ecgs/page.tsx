import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getSessionAppUser, hasAppRole } from "@/lib/auth/app-user";
import { serverFetchJson } from "@/lib/server-data";
import { MyEcgsList } from "./my-ecgs-list";

export const dynamic = "force-dynamic";

export const metadata = { title: "My ECGs" };

type MyEcgList = Parameters<typeof MyEcgsList>[0]["initialList"];

export default async function MyEcgsPage() {
  const row = await getSessionAppUser();
  if (!row) redirect("/sign-in");
  if (
    !hasAppRole(row.appRole, [
      UserRole.HEALTH_WORKER,
      UserRole.CARDIOLOGIST,
      UserRole.ADMIN,
    ])
  ) {
    redirect("/");
  }

  const initialList = await serverFetchJson<MyEcgList>("/api/ecg/mine?limit=50");
  return <MyEcgsList initialList={initialList} />;
}
