import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET() {
  try {
    const items = await prisma.clearanceItem.findMany({
      orderBy: { order: "asc" },
    });
    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch clearance items" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, requiredDept, order } = body;

    if (!title || !requiredDept) {
      return NextResponse.json({ error: "Title and Required Department are required" }, { status: 400 });
    }

    const item = await prisma.clearanceItem.create({
      data: {
        title,
        description,
        requiredDept,
        order: parseInt(order || "1", 10),
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to add clearance item" }, { status: 500 });
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
      return NextResponse.json({ error: "ID parameter required" }, { status: 400 });
    }

    await prisma.clearanceItem.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true, message: "Clearance item deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete clearance item" }, { status: 500 });
  }
}
