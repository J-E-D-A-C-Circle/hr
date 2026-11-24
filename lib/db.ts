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

let stationsTableEnsured = false;

export async function ensureStationsTable(): Promise<void> {
  if (stationsTableEnsured) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`stations\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`name\` VARCHAR(191) NOT NULL,
        \`parent_station\` VARCHAR(191) NULL,
        \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`stations_name_key\`(\`name\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
    const cols: any[] = await prisma.$queryRawUnsafe(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'stations'
        AND COLUMN_NAME = 'parent_station'
    `);
    if (!Array.isArray(cols) || cols.length === 0) {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE \`stations\` ADD COLUMN \`parent_station\` VARCHAR(191) NULL`
      );
    }
    stationsTableEnsured = true;
  } catch (err) {
    console.warn("ensureStationsTable warning:", err);
  }
}

export async function getStationsHierarchy(): Promise<{ name: string; parent_station: string | null }[]> {
  try {
    await ensureStationsTable();
    const rows = (await prisma.$queryRawUnsafe(
      `SELECT name, parent_station FROM \`stations\` WHERE is_active = 1`
    )) as { name: string; parent_station: string | null }[];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}
