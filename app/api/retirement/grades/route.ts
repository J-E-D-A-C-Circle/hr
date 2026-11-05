import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRetirementSession } from "@/lib/retirement-auth";

export async function GET() {
  try {
    const session = await getRetirementSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const grades = await prisma.retirementGrade.findMany({
      orderBy: { gradeName: "asc" },
    });

    return NextResponse.json({ success: true, grades });
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
    const { gradeName, pensionFactor, description } = body;

    if (!gradeName) {
      return NextResponse.json({ error: "Grade name is required" }, { status: 400 });
    }

    const newGrade = await prisma.retirementGrade.create({
      data: {
        gradeName: gradeName.trim(),
        pensionFactor: Number(pensionFactor) || 1.0,
        description: description || null,
      },
    });

    return NextResponse.json({ success: true, grade: newGrade });
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

    await prisma.retirementGrade.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true, message: "Grade deleted" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

