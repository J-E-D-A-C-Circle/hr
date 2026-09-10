import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET() {
  try {
    const grades = await prisma.retirementGrade.findMany({
      orderBy: { gradeName: "asc" },
    });
    return NextResponse.json({ success: true, grades });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch grades" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { gradeName, pensionFactor, description } = body;

    if (!gradeName) {
      return NextResponse.json({ error: "Grade Name is required" }, { status: 400 });
    }

    const grade = await prisma.retirementGrade.create({
      data: {
        gradeName,
        pensionFactor: parseFloat(pensionFactor || "1.0"),
        description,
      },
    });

    return NextResponse.json({ success: true, grade });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to add grade" }, { status: 500 });
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

    await prisma.retirementGrade.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true, message: "Grade deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete grade" }, { status: 500 });
  }
}
