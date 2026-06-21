import { serverFetchJson } from "@/lib/server-data";
import { AdminDashboard, type Stats } from "./admin-dashboard";

export default async function AdminPage() {
  const initialStats = await serverFetchJson<Stats>("/api/admin/stats?limit=200");
  return <AdminDashboard initialStats={initialStats} />;
}
