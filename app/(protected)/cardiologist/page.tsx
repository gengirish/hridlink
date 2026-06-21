import { serverFetchJson } from "@/lib/server-data";
import { CardiologistQueue, type ECGListData } from "./cardiologist-queue";

export default async function CardiologistPage() {
  const initialList = await serverFetchJson<ECGListData>("/api/ecg?status=PENDING&limit=50");
  return <CardiologistQueue initialList={initialList} />;
}
