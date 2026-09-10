import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET() {
  try {
    const banks = await prisma.bankMaster.findMany({
      orderBy: { bankName: "asc" },
    });
    return NextResponse.json({ success: true, banks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch banks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bankName, branchName, code } = body;

    if (!bankName || !branchName) {
      return NextResponse.json({ error: "Bank Name and Branch Name are required" }, { status: 400 });
    }

    const bank = await prisma.bankMaster.create({
      data: {
        bankName,
        branchName,
        code: code || `${bankName.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      },
    });

    return NextResponse.json({ success: true, bank });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to add bank" }, { status: 500 });
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

    await prisma.bankMaster.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true, message: "Bank deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete bank" }, { status: 500 });
  }
}
