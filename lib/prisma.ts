import { PrismaClient } from "@prisma/client";
import { cleanEnv } from "@/lib/fly-proxy";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function prismaDatasourceUrl(): string | undefined {
  return cleanEnv(process.env.DATABASE_URL);
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: { db: { url: prismaDatasourceUrl() } },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
