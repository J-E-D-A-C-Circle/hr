import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureStationsTable } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-auth";
import { getAdminSession as getTempStaffSession, isManagerOrAdminSession } from "@/lib/auth";
import { OFFICIAL_STATIONS } from "@/lib/stations";

async function hasStationWriteAccess(): Promise<boolean> {
  const superAdmin = await getAdminSession();
  if (superAdmin) return true;
  const tempStaffSession = await getTempStaffSession();
  return isManagerOrAdminSession(tempStaffSession);
}

function normalizeName(raw: unknown): string {
  return String(raw || "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

interface RawStationRow {
  id: number;
  name: string;
  parent_station: string | null;
  is_active: number | boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
}

function formatStation(row: RawStationRow) {
  return {
    id: Number(row.id),
    name: String(row.name),
    parent_station: row.parent_station ? String(row.parent_station) : null,
    is_active: Boolean(row.is_active),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function GET() {
  try {
    await ensureStationsTable();
    let rows = (await prisma.$queryRawUnsafe(
      `SELECT id, name, parent_station, is_active, created_at, updated_at FROM \`stations\` ORDER BY name ASC`
    )) as RawStationRow[];

    if (!Array.isArray(rows) || rows.length === 0) {
      for (const stName of OFFICIAL_STATIONS) {
        await prisma.$executeRawUnsafe(
          `INSERT IGNORE INTO \`stations\` (\`name\`, \`parent_station\`, \`is_active\`, \`created_at\`, \`updated_at\`) VALUES (?, NULL, 1, NOW(3), NOW(3))`,
          stName
        );
      }
      rows = (await prisma.$queryRawUnsafe(
        `SELECT id, name, parent_station, is_active, created_at, updated_at FROM \`stations\` ORDER BY name ASC`
      )) as RawStationRow[];
    }

    return NextResponse.json({
      success: true,
      stations: rows.map(formatStation),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch stations" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await hasStationWriteAccess())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await ensureStationsTable();

    const body = await req.json();
    const name = normalizeName(body?.name);
    const parentStationRaw = normalizeName(body?.parent_station);
    const parent_station = parentStationRaw || null;

    if (!name) {
      return NextResponse.json(
        { error: "Station name is required" },
        { status: 400 }
      );
    }

    if (parent_station && parent_station === name) {
      return NextResponse.json(
        { error: "A station cannot be its own parent" },
        { status: 400 }
      );
    }

    const existing = (await prisma.$queryRawUnsafe(
      `SELECT id FROM \`stations\` WHERE UPPER(\`name\`) = ? LIMIT 1`,
      name
    )) as RawStationRow[];

    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json(
        { error: `Station "${name}" already exists` },
        { status: 409 }
      );
    }

    await prisma.$executeRawUnsafe(
      `INSERT INTO \`stations\` (\`name\`, \`parent_station\`, \`is_active\`, \`created_at\`, \`updated_at\`) VALUES (?, ?, 1, NOW(3), NOW(3))`,
      name,
      parent_station
    );

    const inserted = (await prisma.$queryRawUnsafe(
      `SELECT id, name, parent_station, is_active, created_at, updated_at FROM \`stations\` WHERE UPPER(\`name\`) = ? LIMIT 1`,
      name
    )) as RawStationRow[];

    return NextResponse.json({
      success: true,
      station: inserted[0] ? formatStation(inserted[0]) : { name, parent_station, is_active: true },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to add station" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!(await hasStationWriteAccess())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await ensureStationsTable();

    const body = await req.json();
    const id = Number(body?.id);
    if (!id) {
      return NextResponse.json({ error: "Station ID is required" }, { status: 400 });
    }

    const currentRows = (await prisma.$queryRawUnsafe(
      `SELECT id, name, parent_station, is_active FROM \`stations\` WHERE id = ? LIMIT 1`,
      id
    )) as RawStationRow[];

    if (!Array.isArray(currentRows) || currentRows.length === 0) {
      return NextResponse.json({ error: "Station not found" }, { status: 404 });
    }

    const current = currentRows[0];
    const newName = body?.name !== undefined ? normalizeName(body.name) : String(current.name);
    if (!newName) {
      return NextResponse.json({ error: "Station name cannot be empty" }, { status: 400 });
    }

    const parentStationRaw =
      body?.parent_station !== undefined
        ? normalizeName(body.parent_station)
        : normalizeName(current.parent_station);
    const parent_station = parentStationRaw || null;
    const is_active =
      body?.is_active !== undefined ? (body.is_active ? 1 : 0) : current.is_active ? 1 : 0;

    if (parent_station && parent_station === newName) {
      return NextResponse.json(
        { error: "A station cannot be its own parent" },
        { status: 400 }
      );
    }

    if (newName !== String(current.name).toUpperCase()) {
      const dup = (await prisma.$queryRawUnsafe(
        `SELECT id FROM \`stations\` WHERE UPPER(\`name\`) = ? AND id != ? LIMIT 1`,
        newName,
        id
      )) as RawStationRow[];
      if (Array.isArray(dup) && dup.length > 0) {
        return NextResponse.json(
          { error: `Another station named "${newName}" already exists` },
          { status: 409 }
        );
      }
    }

    await prisma.$executeRawUnsafe(
      `UPDATE \`stations\` SET \`name\` = ?, \`parent_station\` = ?, \`is_active\` = ?, \`updated_at\` = NOW(3) WHERE \`id\` = ?`,
      newName,
      parent_station,
      is_active,
      id
    );

    // If station name changed, cascade to child stations' parent_station and staff.department
    const oldNameUpper = String(current.name).trim().toUpperCase();
    if (newName !== oldNameUpper) {
      await prisma.$executeRawUnsafe(
        `UPDATE \`stations\` SET \`parent_station\` = ?, \`updated_at\` = NOW(3) WHERE UPPER(\`parent_station\`) = ?`,
        newName,
        oldNameUpper
      );
      await prisma.$executeRawUnsafe(
        `UPDATE \`staff\` SET \`department\` = ? WHERE UPPER(TRIM(\`department\`)) = ?`,
        newName,
        oldNameUpper
      );
    }

    const updatedRows = (await prisma.$queryRawUnsafe(
      `SELECT id, name, parent_station, is_active, created_at, updated_at FROM \`stations\` WHERE id = ? LIMIT 1`,
      id
    )) as RawStationRow[];

    return NextResponse.json({
      success: true,
      station: updatedRows[0] ? formatStation(updatedRows[0]) : { id, name: newName, parent_station, is_active: Boolean(is_active) },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update station" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!(await hasStationWriteAccess())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await ensureStationsTable();

    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));

    if (!id) {
      return NextResponse.json(
        { error: "ID parameter required" },
        { status: 400 }
      );
    }

    await prisma.$executeRawUnsafe(`DELETE FROM \`stations\` WHERE \`id\` = ?`, id);
    return NextResponse.json({
      success: true,
      message: "Station deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete station" },
      { status: 500 }
    );
  }
}
