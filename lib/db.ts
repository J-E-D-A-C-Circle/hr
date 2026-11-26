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

/**
 * Automatically applies any profile/bank/station edits that were trapped in staff.pending_edits
 * directly onto the staff row so exports and directory views reflect the saved data immediately.
 */
export async function flushPendingStaffEdits(): Promise<void> {
  try {
    const pendingList = await prisma.staff.findMany({
      where: {
        pending_edits: { not: null },
      },
      select: {
        id: true,
        pending_edits: true,
        salary: true,
      },
    });

    for (const row of pendingList) {
      if (!row.pending_edits) continue;
      let parsed: any = null;
      try {
        parsed = JSON.parse(row.pending_edits);
      } catch {
        continue;
      }
      const ch = parsed?.changes;
      if (!ch || typeof ch !== "object") continue;

      const sal =
        ch.salary !== undefined && ch.salary !== null && String(ch.salary).trim() !== ""
          ? parseFloat(String(ch.salary))
          : undefined;

      await prisma.staff.update({
        where: { id: row.id },
        data: {
          staff_code: ch.staff_code ? String(ch.staff_code).trim() : undefined,
          full_name: ch.full_name ? String(ch.full_name).trim() : undefined,
          gender: ch.gender || undefined,
          email: ch.email || undefined,
          ssnit_no: ch.ssnit_no || undefined,
          nia_number: ch.nia_number || undefined,
          role: ch.role || undefined,
          department: ch.department || undefined,
          phone: ch.phone || undefined,
          bank_name: ch.bank_name || undefined,
          bank_branch: ch.bank_branch || undefined,
          bank_account: ch.bank_account || undefined,
          salary: sal !== undefined && !isNaN(sal) ? sal : undefined,
          approval_status: "APPROVED",
          pending_edits: null,
        },
      });
    }
  } catch (err) {
    console.warn("flushPendingStaffEdits warning:", err);
  }
}
