import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateRetirement, validateDateOfBirth } from "@/lib/retirement";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const departmentId = searchParams.get("departmentId") || "";
    const gender = searchParams.get("gender") || "";
    const retirementYear = searchParams.get("retirementYear") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const skip = (page - 1) * limit;

    const whereClause: any = { active: true };

    if (search.trim()) {
      whereClause.OR = [
        { fullName: { contains: search.trim() } },
        { staffId: { contains: search.trim() } },
        { jobTitle: { contains: search.trim() } },
        { departmentName: { contains: search.trim() } },
      ];
    }

    if (status) {
      whereClause.retirementStatus = status;
    }

    if (departmentId && departmentId !== "ALL") {
      whereClause.departmentId = parseInt(departmentId, 10);
    }

    if (gender && gender !== "ALL") {
      whereClause.gender = gender;
    }

    const today = new Date();
    const rawStaffList = await prisma.retirementStaff.findMany({
      where: whereClause,
      include: { department: true },
      orderBy: { retirementDate: "asc" },
    });

    // Compute live dynamic calculations for all records
    const processedList = rawStaffList
      .map((staff) => {
        const calc = calculateRetirement(staff.dateOfBirth, staff.dateOfFirstAppointment, today);
        return {
          ...staff,
          currentAge: calc.currentAge,
          currentAgeFormatted: calc.currentAgeFormatted,
          retirementDateFormatted: calc.retirementDateFormatted,
          yearsRemaining: calc.yearsRemaining,
          monthsRemaining: calc.monthsRemaining,
          daysRemaining: calc.daysRemaining,
          timeRemainingFormatted: calc.timeRemainingFormatted,
          computedStatus: calc.status,
          statusLabel: calc.statusLabel,
          badgeVariant: calc.badgeVariant,
          percentageCompleted: calc.percentageCompleted,
          retirementYear: calc.retirementDate.getFullYear(),
        };
      })
      .filter((staff) => {
        if (retirementYear && retirementYear !== "ALL") {
          return staff.retirementYear === parseInt(retirementYear, 10);
        }
        return true;
      });

    const totalCount = processedList.length;
    const paginatedList = processedList.slice(skip, skip + limit);

    // Fetch department list for filters
    const departments = await prisma.retirementDepartment.findMany({ orderBy: { name: "asc" } });

    return NextResponse.json({
      staff: paginatedList,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit) || 1,
      departments,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch staff list." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      staffId,
      fullName,
      dateOfBirth,
      gender,
      departmentId,
      jobTitle,
      grade,
      dateOfFirstAppointment,
      email,
      phone,
    } = body;

    if (!staffId || !fullName || !dateOfBirth || !gender || !jobTitle) {
      return NextResponse.json({ error: "Please fill in all required fields (Staff ID, Full Name, DOB, Gender, Job Title)." }, { status: 400 });
    }

    // DOB Validation
    const dobValidation = validateDateOfBirth(dateOfBirth);
    if (!dobValidation.valid) {
      return NextResponse.json({ error: dobValidation.message }, { status: 400 });
    }

    // Check unique staff ID
    const existing = await prisma.retirementStaff.findUnique({
      where: { staffId: staffId.trim() },
    });
    if (existing) {
      return NextResponse.json({ error: `Staff ID '${staffId}' already exists in system.` }, { status: 400 });
    }

    const dobDate = new Date(dateOfBirth);
    const dofaDate = dateOfFirstAppointment ? new Date(dateOfFirstAppointment) : new Date();
    const calc = calculateRetirement(dobDate, dofaDate);

    let deptName = null;
    let deptIdNum = null;
    if (departmentId) {
      deptIdNum = parseInt(departmentId, 10);
      const deptObj = await prisma.retirementDepartment.findUnique({ where: { id: deptIdNum } });
      if (deptObj) deptName = deptObj.name;
    }

    const newStaff = await prisma.retirementStaff.create({
      data: {
        staffId: staffId.trim(),
        fullName: fullName.trim(),
        dateOfBirth: dobDate,
        gender,
        departmentId: deptIdNum,
        departmentName: deptName,
        jobTitle: jobTitle.trim(),
        grade: grade ? grade.trim() : null,
        dateOfFirstAppointment: dofaDate,
        retirementDate: calc.retirementDate,
        actualRetirementDate: calc.status === "RETIRED" ? calc.retirementDate : null,
        retirementStatus: calc.status,
        email: email ? email.trim() : null,
        phone: phone ? phone.trim() : null,
        active: true,
      },
      include: { department: true },
    });

    // Create initial milestone alert if applicable
    if (calc.status === "DUE_THIS_YEAR" || calc.status === "NEARING_RETIREMENT") {
      const milestone = calc.yearsRemaining < 1 ? "1_YEAR" : calc.yearsRemaining <= 3 ? "3_YEARS" : "5_YEARS";
      await prisma.retirementAlert.create({
        data: {
          staffId: newStaff.id,
          milestone,
          status: "UNREAD",
        },
      });
    }

    // Log Audit
    await prisma.retirementAuditLog.create({
      data: {
        userName: "HR Officer",
        userRole: "HR User",
        action: "CREATE_STAFF",
        details: `Added new staff member '${fullName}' (${staffId}) in ${deptName || "Unassigned"}. Statutory retirement date: ${calc.retirementDateFormatted}`,
        staffId: newStaff.id,
      },
    });

    return NextResponse.json({
      success: true,
      staff: newStaff,
      calculation: calc,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create staff record." }, { status: 500 });
  }
}
