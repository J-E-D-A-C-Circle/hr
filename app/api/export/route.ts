import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeContractStatus } from "@/lib/status";
import { buildExportWorkbook } from "@/lib/excel";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "currently_employed"; // default Active + Expiring Soon
    const department = searchParams.get("department") || "";
    const format = searchParams.get("format") || "excel";

    const whereClause: any = {};
    if (department) {
      whereClause.department = department;
    }

    const staffList = await prisma.staff.findMany({
      where: whereClause,
      include: {
        contracts: {
          orderBy: {
            created_at: "desc",
          },
        },
      },
      orderBy: {
        full_name: "asc",
      },
    });

    // Annotate and filter
    const annotated = staffList.map((item: any) => {
      const currentContract = item.contracts.find((c: any) => c.is_current) || item.contracts[0] || null;
      const status = computeContractStatus(currentContract);
      return {
        ...item,
        currentContract,
        computedStatus: status,
      };
    });

    const filtered = annotated.filter((item: any) => {
      if (filter === "currently_employed") {
        // Active + Expiring Soon
        return item.computedStatus === "Active" || item.computedStatus === "Expiring Soon";
      } else if (filter === "active") {
        return item.computedStatus === "Active";
      } else if (filter === "expiring") {
        return item.computedStatus === "Expiring Soon";
      } else if (filter === "expired") {
        return item.computedStatus === "Expired";
      } else if (filter === "terminated") {
        return item.computedStatus === "Terminated";
      }
      return true; // "all"
    });

    if (format === "json") {
      return NextResponse.json({ success: true, count: filtered.length, data: filtered });
    }

    // Generate Excel Buffer
    const excelBuffer = buildExportWorkbook(filtered);
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `Payroll_Petra_Insurance_${filter}_${dateStr}.xlsx`;

    return new NextResponse(excelBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("GET /api/export error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate export file" },
      { status: 500 }
    );
  }
}
