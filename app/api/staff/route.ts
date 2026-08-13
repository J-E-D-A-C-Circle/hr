import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateEndDate, computeContractStatus, computeDaysRemaining, parseFlexibleDate } from "@/lib/status";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const statusFilter = searchParams.get("status") || "";
    const departmentFilter = searchParams.get("department") || "";
    const roleFilter = searchParams.get("role") || "";

    // Fetch staff with contracts
    const whereClause: any = {};

    if (departmentFilter) {
      whereClause.department = departmentFilter;
    }
    if (roleFilter) {
      whereClause.role = roleFilter;
    }
    if (search) {
      whereClause.OR = [
        { full_name: { contains: search } },
        { staff_code: { contains: search } },
        { ssnit_no: { contains: search } },
        { nia_number: { contains: search } },
        { role: { contains: search } },
        { department: { contains: search } },
      ];
    }

    const staffList = await prisma.staff.findMany({
      where: whereClause,
      include: {
        contracts: {
          orderBy: {
            created_at: "desc",
          },
        },
        validations: {
          orderBy: {
            validated_at: "desc",
          },
        },
      },
      orderBy: {
        id: "desc",
      },
    });

    // Map and annotate with server-side computed status and days remaining
    const annotatedStaff = staffList.map((item: any) => {
      const currentContract = item.contracts.find((c: any) => c.is_current) || item.contracts[0] || null;
      const status = computeContractStatus(currentContract);
      const daysRemaining = currentContract ? computeDaysRemaining(currentContract.end_date) : 0;

      return {
        ...item,
        currentContract,
        computedStatus: status,
        daysRemaining: currentContract && !currentContract.is_terminated ? daysRemaining : null,
      };
    });

    // Filter by computed status if requested
    const filteredStaff = statusFilter
      ? annotatedStaff.filter((s: any) => s.computedStatus.toLowerCase() === statusFilter.toLowerCase())
      : annotatedStaff;

    return NextResponse.json({ success: true, data: filteredStaff });
  } catch (error: any) {
    console.error("GET /api/staff error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch staff" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      staff_code,
      full_name,
      date_of_birth,
      gender,
      email,
      ssnit_no,
      nia_number,
      role,
      department,
      phone,
      bank_name,
      bank_branch,
      bank_account,
      salary,
      insurance_provider,
      insurance_policy_no,
      insurance_premium,
      start_date,
    } = body;

    if (!full_name || !start_date) {
      return NextResponse.json(
        { success: false, error: "Full Name and Start Date are required." },
        { status: 400 }
      );
    }

    // Check duplicate staff_code if provided
    if (staff_code) {
      const existing = await prisma.staff.findUnique({
        where: { staff_code },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, error: `Staff Code "${staff_code}" already exists.` },
          { status: 400 }
        );
      }
    }

    const startDateObj = parseFlexibleDate(start_date) || new Date();
    const endDateObj = calculateEndDate(startDateObj);

    // Create staff + initial contract
    const newStaff = await prisma.staff.create({
      data: {
        staff_code: staff_code || null,
        full_name,
        date_of_birth: parseFlexibleDate(date_of_birth),
        gender: gender || null,
        email: email || null,
        ssnit_no: ssnit_no || null,
        nia_number: nia_number || null,
        role: role || null,
        department: department || null,
        phone: phone || null,
        bank_name: bank_name || null,
        bank_branch: bank_branch || null,
        bank_account: bank_account || null,
        salary: salary ? parseFloat(salary) : null,
        insurance_provider: insurance_provider || "Petra",
        insurance_policy_no: insurance_policy_no || null,
        insurance_premium: insurance_premium ? parseFloat(insurance_premium) : null,
        contracts: {
          create: {
            start_date: startDateObj,
            end_date: endDateObj,
            renewal_number: 1,
            is_current: true,
          },
        },
      },
      include: {
        contracts: true,
      },
    });

    return NextResponse.json({ success: true, data: newStaff }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/staff error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create staff member." },
      { status: 500 }
    );
  }
}
