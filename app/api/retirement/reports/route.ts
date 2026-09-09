import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateRetirement } from "@/lib/retirement";
import * as xlsx from "xlsx";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type") || "summary"; // 'summary', 'upcoming', 'department', 'retired'
    const exportFormat = searchParams.get("export"); // 'excel' or null
    const departmentId = searchParams.get("departmentId");

    const today = new Date();
    const allStaff = await prisma.retirementStaff.findMany({
      where: { active: true },
      include: { department: true },
      orderBy: { retirementDate: "asc" },
    });

    const calculatedStaff = allStaff.map((s) => {
      const calc = calculateRetirement(s.dateOfBirth, s.dateOfFirstAppointment, today);
      return {
        ...s,
        currentAge: calc.currentAge,
        currentAgeFormatted: calc.currentAgeFormatted,
        retirementDateFormatted: calc.retirementDateFormatted,
        yearsRemaining: calc.yearsRemaining,
        monthsRemaining: calc.monthsRemaining,
        daysRemaining: calc.daysRemaining,
        timeRemainingFormatted: calc.timeRemainingFormatted,
        computedStatus: calc.status,
        statusLabel: calc.statusLabel,
      };
    });

    // Filtering by department if specified
    const filteredStaff = departmentId && departmentId !== "ALL"
      ? calculatedStaff.filter((s) => s.departmentId === parseInt(departmentId, 10))
      : calculatedStaff;

    if (reportType === "summary") {
      const activeCount = filteredStaff.filter((s) => s.computedStatus === "ACTIVE").length;
      const nearingCount = filteredStaff.filter((s) => s.computedStatus === "NEARING_RETIREMENT").length;
      const dueCount = filteredStaff.filter((s) => s.computedStatus === "DUE_THIS_YEAR").length;
      const retiredCount = filteredStaff.filter((s) => s.computedStatus === "RETIRED").length;
      const totalCount = filteredStaff.length;

      const responsePayload = {
        title: "DVLA Staff Retirement Summary Report",
        generatedAt: today.toISOString(),
        summary: {
          totalStaff: totalCount,
          active: activeCount,
          nearingRetirement: nearingCount,
          dueThisYear: dueCount,
          retired: retiredCount,
          activePercentage: totalCount ? Math.round((activeCount / totalCount) * 100) : 0,
          nearingPercentage: totalCount ? Math.round((nearingCount / totalCount) * 100) : 0,
          duePercentage: totalCount ? Math.round((dueCount / totalCount) * 100) : 0,
          retiredPercentage: totalCount ? Math.round((retiredCount / totalCount) * 100) : 0,
        },
        records: filteredStaff,
      };

      if (exportFormat === "excel") {
        const rows = filteredStaff.map((s) => ({
          "Staff ID": s.staffId,
          "Full Name": s.fullName,
          "Gender": s.gender,
          "Department": s.departmentName || s.department?.name || "N/A",
          "Job Title": s.jobTitle,
          "Current Age": s.currentAgeFormatted,
          "Retirement Date": s.retirementDateFormatted,
          "Time Remaining": s.timeRemainingFormatted,
          "Status": s.statusLabel,
        }));
        const ws = xlsx.utils.json_to_sheet(rows);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "Retirement Summary");
        const buf = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
        return new NextResponse(buf, {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": 'attachment; filename="DVLA_Retirement_Summary_Report.xlsx"',
          },
        });
      }

      return NextResponse.json(responsePayload);
    }

    if (reportType === "upcoming") {
      const upcomingRecords = filteredStaff.filter(
        (s) => s.computedStatus === "DUE_THIS_YEAR" || s.computedStatus === "NEARING_RETIREMENT"
      );

      if (exportFormat === "excel") {
        const rows = upcomingRecords.map((s) => ({
          "Staff ID": s.staffId,
          "Full Name": s.fullName,
          "Department": s.departmentName || s.department?.name || "N/A",
          "Job Title": s.jobTitle,
          "Retirement Date": s.retirementDateFormatted,
          "Time Remaining": s.timeRemainingFormatted,
          "Urgency": s.computedStatus === "DUE_THIS_YEAR" ? "DUE THIS YEAR (<1y)" : "NEARING (1-5y)",
        }));
        const ws = xlsx.utils.json_to_sheet(rows);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "Upcoming Retirements");
        const buf = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
        return new NextResponse(buf, {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": 'attachment; filename="DVLA_Upcoming_Retirements_Report.xlsx"',
          },
        });
      }

      return NextResponse.json({
        title: "DVLA Upcoming Retirements Report (Next 5 Years)",
        generatedAt: today.toISOString(),
        totalCount: upcomingRecords.length,
        records: upcomingRecords,
      });
    }

    if (reportType === "department") {
      const depts = await prisma.retirementDepartment.findMany({
        include: { staff: { where: { active: true } } },
      });

      const deptSummary = depts.map((d) => {
        const dStaff = calculatedStaff.filter((s) => s.departmentId === d.id);
        return {
          id: d.id,
          code: d.code,
          name: d.name,
          headOfDept: d.headOfDept,
          totalStaff: dStaff.length,
          active: dStaff.filter((s) => s.computedStatus === "ACTIVE").length,
          nearingRetirement: dStaff.filter((s) => s.computedStatus === "NEARING_RETIREMENT").length,
          dueThisYear: dStaff.filter((s) => s.computedStatus === "DUE_THIS_YEAR").length,
          retired: dStaff.filter((s) => s.computedStatus === "RETIRED").length,
        };
      });

      if (exportFormat === "excel") {
        const rows = deptSummary.map((d) => ({
          "Department Code": d.code,
          "Department Name": d.name,
          "Head of Dept": d.headOfDept || "N/A",
          "Total Staff": d.totalStaff,
          "Active": d.active,
          "Nearing Retirement (1-5y)": d.nearingRetirement,
          "Due This Year (<1y)": d.dueThisYear,
          "Retired Records": d.retired,
        }));
        const ws = xlsx.utils.json_to_sheet(rows);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "Department Breakdown");
        const buf = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
        return new NextResponse(buf, {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": 'attachment; filename="DVLA_Department_Retirement_Exposure.xlsx"',
          },
        });
      }

      return NextResponse.json({
        title: "DVLA Department Retirement Exposure Report",
        generatedAt: today.toISOString(),
        departments: deptSummary,
      });
    }

    if (reportType === "retired") {
      const retiredRecords = filteredStaff.filter((s) => s.computedStatus === "RETIRED");

      if (exportFormat === "excel") {
        const rows = retiredRecords.map((s) => ({
          "Staff ID": s.staffId,
          "Full Name": s.fullName,
          "Department": s.departmentName || s.department?.name || "N/A",
          "Job Title": s.jobTitle,
          "Date of Birth": s.dateOfBirth.toISOString().split("T")[0],
          "Statutory Retirement Date": s.retirementDateFormatted,
          "Actual Exit Date": s.actualRetirementDate ? s.actualRetirementDate.toISOString().split("T")[0] : s.retirementDateFormatted,
        }));
        const ws = xlsx.utils.json_to_sheet(rows);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "Retired Staff Archive");
        const buf = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
        return new NextResponse(buf, {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": 'attachment; filename="DVLA_Retired_Staff_Historical_Report.xlsx"',
          },
        });
      }

      return NextResponse.json({
        title: "DVLA Retired Staff Historical Report",
        generatedAt: today.toISOString(),
        totalCount: retiredRecords.length,
        records: retiredRecords,
      });
    }

    return NextResponse.json({ error: "Invalid report type requested." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to generate report." }, { status: 500 });
  }
}
