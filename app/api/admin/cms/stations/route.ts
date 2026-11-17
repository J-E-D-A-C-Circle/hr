import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-auth";
import { OFFICIAL_STATIONS } from "@/lib/stations";

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
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const name = normalizeName(body?.name);

    if (!name) {
      return NextResponse.json(
        { error: "Station name is required" },
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
      data: { name, is_active: true },
    });

    return NextResponse.json({ success: true, station });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to add station" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
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
