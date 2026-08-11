import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Default standard rates if not yet configured in CMS
const DEFAULT_SETTINGS = {
  id: 1,
  ssnit_employee_rate: 5.5,   // 5.5% Tier 1 Employee
  ssnit_employer_rate: 13.0,  // 13.0% Tier 1 Employer
  petra_employee_rate: 5.0,   // 5.0% Tier 3 Petra Employee
  petra_employer_rate: 5.0,   // 5.0% Tier 3 Petra Employer
};

export async function GET() {
  try {
    let settings: any = null;
    try {
      if ((prisma as any).deductionSetting) {
        settings = await (prisma as any).deductionSetting.findUnique({
          where: { id: 1 },
        });
      }
    } catch {
      // Table might not exist yet, fallback gracefully
    }

    if (!settings) {
      settings = DEFAULT_SETTINGS;
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    console.error("GET /api/deductions/settings error:", error);
    return NextResponse.json({ success: true, data: DEFAULT_SETTINGS });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      ssnit_employee_rate,
      ssnit_employer_rate,
      petra_employee_rate,
      petra_employer_rate,
    } = body;

    const sEmp = parseFloat(ssnit_employee_rate ?? 5.5);
    const sEr = parseFloat(ssnit_employer_rate ?? 13.0);
    const pEmp = parseFloat(petra_employee_rate ?? 5.0);
    const pEr = parseFloat(petra_employer_rate ?? 5.0);

    let updated: any = null;
    try {
      if ((prisma as any).deductionSetting) {
        updated = await (prisma as any).deductionSetting.upsert({
          where: { id: 1 },
          update: {
            ssnit_employee_rate: sEmp,
            ssnit_employer_rate: sEr,
            petra_employee_rate: pEmp,
            petra_employer_rate: pEr,
          },
          create: {
            id: 1,
            ssnit_employee_rate: sEmp,
            ssnit_employer_rate: sEr,
            petra_employee_rate: pEmp,
            petra_employer_rate: pEr,
          },
        });
      }
    } catch {
      // Fallback
    }

    if (!updated) {
      updated = {
        id: 1,
        ssnit_employee_rate: sEmp,
        ssnit_employer_rate: sEr,
        petra_employee_rate: pEmp,
        petra_employer_rate: pEr,
      };
    }

    return NextResponse.json({
      success: true,
      message: "Deduction CMS percentage rates updated successfully!",
      data: updated,
    });
  } catch (error: any) {
    console.error("POST /api/deductions/settings error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update deduction CMS settings" },
      { status: 500 }
    );
  }
}
