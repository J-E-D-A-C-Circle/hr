import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "DEPARTMENT" | "STATION" | "ALL"
    const search = searchParams.get("search") || "";

    const where: any = {};
    if (type && type !== "ALL") {
      where.type = type;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      where.OR = [
        { code: { contains: q } },
        { name: { contains: q } },
        { location: { contains: q } },
        { headOfDept: { contains: q } },
      ];
    }

    const items = await prisma.retirementDepartment.findMany({
      where,
      include: {
        staff: {
          select: {
            id: true,
            retirementStatus: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const formatted = items.map((item: any) => {
      const staffList = item.staff || [];
      const totalStaff = staffList.length;
      const active = staffList.filter((s: any) => s.retirementStatus === "ACTIVE").length;
      const nearingRetirement = staffList.filter((s: any) => s.retirementStatus === "NEARING_RETIREMENT").length;
      const dueThisYear = staffList.filter((s: any) => s.retirementStatus === "DUE_THIS_YEAR").length;
      const retired = staffList.filter((s: any) => s.retirementStatus === "RETIRED").length;

      return {
        id: item.id,
        code: item.code,
        name: item.name,
        type: item.type || "DEPARTMENT",
        location: item.location || "Head Office, Accra",
        headOfDept: item.headOfDept || "Unassigned",
        description: item.description || "",
        totalStaff,
        active,
        nearingRetirement,
        dueThisYear,
        retired,
      };
    });

    // Summary KPIs
    const allUnits = await prisma.retirementDepartment.findMany({
      include: { staff: { select: { id: true } } },
    });

    const totalUnits = allUnits.length;
    const totalDepartments = allUnits.filter((u: any) => (u.type || "DEPARTMENT") === "DEPARTMENT").length;
    const totalStations = allUnits.filter((u: any) => u.type === "STATION").length;
    const totalStaffAllocated = allUnits.reduce((acc: number, u: any) => acc + (u.staff?.length || 0), 0);

    return NextResponse.json({
      success: true,
      units: formatted,
      summary: {
        totalUnits,
        totalDepartments,
        totalStations,
        totalStaffAllocated,
      },
    });
  } catch (error: any) {
    console.error("GET /api/retirement/departments error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch departments/stations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, type, location, headOfDept, description } = body;

    if (!code || !name) {
      return NextResponse.json(
        { success: false, error: "Code and Name are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.retirementDepartment.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Unit code '${code.trim().toUpperCase()}' is already in use.` },
        { status: 400 }
      );
    }

    const created = await prisma.retirementDepartment.create({
      data: {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        type: type || "DEPARTMENT",
        location: location?.trim() || "Head Office, Accra",
        headOfDept: headOfDept?.trim() || null,
        description: description?.trim() || null,
      },
    });

    // Create Audit Log
    try {
      await prisma.retirementAuditLog.create({
        data: {
          userName: "HR Administrator",
          userRole: "HR_ADMINISTRATOR",
          action: "CREATE_UNIT",
          details: `Created ${created.type} '${created.name}' (${created.code})`,
        },
      });
    } catch (e) {
      console.error(e);
    }

    return NextResponse.json({ success: true, unit: created });
  } catch (error: any) {
    console.error("POST /api/retirement/departments error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create station/department" },
      { status: 500 }
    );
  }
}
