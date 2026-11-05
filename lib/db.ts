import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: any;
};

// Route to tempstaff_db which hosts the HR letters and payroll tables, without modifying .env
const resolvedDbUrl = process.env.DATABASE_URL?.includes("dvla_nss_portal")
  ? process.env.DATABASE_URL.replace("dvla_nss_portal", "tempstaff_db")
  : process.env.DATABASE_URL;

export const prisma: any =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: resolvedDbUrl ? { db: { url: resolvedDbUrl } } : undefined,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
