import { NextResponse } from "next/server";
import { getSessionAppUser } from "@/lib/auth/app-user";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await getSessionAppUser();
  return NextResponse.json({
    role: result?.appRole ?? null,
    name: result?.session?.user?.name ?? null,
    email: result?.session?.user?.email ?? null,
  });
}
