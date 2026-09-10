import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET() {
  try {
    const providers = await prisma.insuranceProvider.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, providers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch providers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, policyType, defaultPremium } = body;

    if (!name) {
      return NextResponse.json({ error: "Provider Name is required" }, { status: 400 });
    }

    const provider = await prisma.insuranceProvider.create({
      data: {
        name,
        policyType: policyType || "TIER_3",
        defaultPremium: parseFloat(defaultPremium || "0.0"),
      },
    });

    return NextResponse.json({ success: true, provider });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to add insurance provider" }, { status: 500 });
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

    await prisma.insuranceProvider.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true, message: "Insurance provider deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete insurance provider" }, { status: 500 });
  }
}
