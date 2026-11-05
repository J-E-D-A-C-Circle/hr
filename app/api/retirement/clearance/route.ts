import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRetirementSession } from "@/lib/retirement-auth";

export async function GET() {
  try {
    const session = await getRetirementSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const items = await prisma.clearanceItem.findMany({
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getRetirementSession();
    if (!session || session.role !== "HR_ADMINISTRATOR") {
      return NextResponse.json({ error: "Forbidden: Administrator access required" }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, requiredDept, order } = body;

    if (!title || !requiredDept) {
      return NextResponse.json({ error: "Title and Required Department are required" }, { status: 400 });
    }

    const newItem = await prisma.clearanceItem.create({
      data: {
        title,
        description: description || null,
        requiredDept,
        order: Number(order) || 1,
      },
    });

    return NextResponse.json({ success: true, item: newItem });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getRetirementSession();
    if (!session || session.role !== "HR_ADMINISTRATOR") {
      return NextResponse.json({ error: "Forbidden: Administrator access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    await prisma.clearanceItem.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true, message: "Clearance item deleted" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

