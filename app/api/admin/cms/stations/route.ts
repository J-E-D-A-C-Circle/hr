import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
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

export async function GET() {
  try {
    let stations = await prisma.station.findMany({
      orderBy: { name: "asc" },
    });

    if (stations.length === 0) {
      await prisma.station.createMany({
        data: OFFICIAL_STATIONS.map((name) => ({ name })),
        skipDuplicates: true,
      });
      stations = await prisma.station.findMany({
        orderBy: { name: "asc" },
      });
    }

    return NextResponse.json({ success: true, stations });
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

    const existing = await prisma.station.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json(
        { error: `Station "${name}" already exists` },
        { status: 409 }
      );
    }

    const station = await prisma.station.create({
      data: { name, parent_station, is_active: true },
    });

    return NextResponse.json({ success: true, station });
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

    const body = await req.json();
    const id = Number(body?.id);
    if (!id) {
      return NextResponse.json({ error: "Station ID is required" }, { status: 400 });
    }

    const current = await prisma.station.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: "Station not found" }, { status: 404 });
    }

    const parentStationRaw = normalizeName(body?.parent_station);
    const parent_station = parentStationRaw || null;

    if (parent_station && parent_station === current.name) {
      return NextResponse.json(
        { error: "A station cannot be its own parent" },
        { status: 400 }
      );
    }

    const station = await prisma.station.update({
      where: { id },
      data: { parent_station },
    });

    return NextResponse.json({ success: true, station });
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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID parameter required" },
        { status: 400 }
      );
    }

    await prisma.station.delete({ where: { id: Number(id) } });
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
