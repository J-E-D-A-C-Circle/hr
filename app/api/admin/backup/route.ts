import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

const BACKUP_DIR = path.join(process.cwd(), "database", "backups");

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    ensureBackupDir();

    const files = fs.readdirSync(BACKUP_DIR);
    const backups = files
      .filter((f) => f.endsWith(".sql"))
      .map((fileName) => {
        const filePath = path.join(BACKUP_DIR, fileName);
        const stats = fs.statSync(filePath);
        return {
          fileName,
          sizeBytes: stats.size,
          sizeFormatted: (stats.size / (1024 * 1024)).toFixed(2) + " MB",
          createdAt: stats.birthtime || stats.mtime,
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Calculate next automated backup date (every 14 days from latest backup)
    const latestBackup = backups[0];
    const lastBackupTime = latestBackup ? new Date(latestBackup.createdAt) : new Date();
    const nextScheduledBackup = new Date(lastBackupTime.getTime() + 14 * 24 * 60 * 60 * 1000);

    return NextResponse.json({
      success: true,
      backups,
      schedule: {
        frequency: "Bi-Weekly (Every 14 Days)",
        lastBackup: lastBackupTime.toISOString(),
        nextBackup: nextScheduledBackup.toISOString(),
        totalBackups: backups.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to list backups" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    ensureBackupDir();

    const timestamp = new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14);
    const fileName = `dvla_biweekly_backup_${timestamp}.sql`;
    const filePath = path.join(BACKUP_DIR, fileName);

    const dbHost = process.env.DB_HOST || "127.0.0.1";
    const dbPort = process.env.DB_PORT || "3307";
    const dbUser = process.env.DB_USER || "root";
    const dbPass = process.env.DB_PASSWORD || "root";
    const dbName = process.env.DB_NAME || "tempstaff_db";

    const mysqldumpPath =
      process.platform === "win32"
        ? `"C:\\MAMP\\bin\\mysql\\bin\\mysqldump.exe"`
        : "mysqldump";

    const cmd = `${mysqldumpPath} -h ${dbHost} -P ${dbPort} -u ${dbUser} -p${dbPass} ${dbName} > "${filePath}"`;

    await new Promise<void>((resolve, reject) => {
      exec(cmd, (error) => {
        if (error) return reject(error);
        resolve();
      });
    });

    const stats = fs.statSync(filePath);

    // Also copy to main database/sql_backup_YYYY_MM_DD.sql for safety
    const mainBackupPath = path.join(
      process.cwd(),
      "database",
      `sql_backup_${new Date().toISOString().slice(0, 10).replace(/-/g, "_")}.sql`
    );
    fs.copyFileSync(filePath, mainBackupPath);

    // Log audit event
    try {
      await prisma.auditLog.create({
        data: {
          user_name: session.name || session.username,
          user_role: "SUPER_ADMIN",
          action: "DATABASE_BACKUP_CREATED",
          details: `Manual/Bi-Weekly backup created: ${fileName} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`,
        },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: "Database backup created successfully",
      backup: {
        fileName,
        sizeFormatted: (stats.size / (1024 * 1024)).toFixed(2) + " MB",
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Backup creation failed:", error);
    return NextResponse.json({ error: error.message || "Failed to create database backup" }, { status: 500 });
  }
}
