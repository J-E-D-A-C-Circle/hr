import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const file = searchParams.get("file");

    if (!file || !file.endsWith(".sql") || file.includes("..")) {
      return NextResponse.json({ error: "Invalid backup filename" }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), "database", "backups", file);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Backup file not found" }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/sql",
        "Content-Disposition": `attachment; filename="${file}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to download backup" }, { status: 500 });
  }
}
