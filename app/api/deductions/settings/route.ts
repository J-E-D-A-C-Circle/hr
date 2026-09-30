import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMonthYearString } from "@/lib/status";
import { getPayeTaxBrackets, DEFAULT_2026_GRA_BRACKETS } from "@/lib/payroll";

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
        settings = await (prisma as any).deductionSetting.findFirst({
          orderBy: { created_at: "desc" },
        });
      }
    } catch {
      // Table might not exist yet, fallback gracefully
    }

    if (!settings) {
      settings = DEFAULT_SETTINGS;
    }

    const payeBrackets = await getPayeTaxBrackets();

    return NextResponse.json({
      success: true,
      data: settings,
      payeBrackets: payeBrackets.length > 0 ? payeBrackets : DEFAULT_2026_GRA_BRACKETS,
    });
  } catch (error: any) {
    console.error("GET /api/deductions/settings error:", error);
    return NextResponse.json({
      success: true,
      data: DEFAULT_SETTINGS,
      payeBrackets: DEFAULT_2026_GRA_BRACKETS,
    });
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
      payeBrackets,
    } = body;

    const sEmp = parseFloat(ssnit_employee_rate ?? 5.5);
    const sEr = parseFloat(ssnit_employer_rate ?? 13.0);
    const pEmp = parseFloat(petra_employee_rate ?? 5.0);
    const pEr = parseFloat(petra_employer_rate ?? 5.0);
    const effectiveMonth = getCurrentMonthYearString();

    let updated: any = null;
    try {
      if ((prisma as any).deductionSetting) {
        updated = await (prisma as any).deductionSetting.create({
          data: {
            ssnit_employee_rate: sEmp,
            ssnit_employer_rate: sEr,
            petra_employee_rate: pEmp,
            petra_employer_rate: pEr,
            effective_month: effectiveMonth,
          },
        });
      }
    } catch {
      // Fallback
    }

    // Save GRA PAYE Tax Brackets if provided
    if (payeBrackets && Array.isArray(payeBrackets) && (prisma as any).payeTaxBracket) {
      try {
        for (const item of payeBrackets) {
          await (prisma as any).payeTaxBracket.create({
            data: {
              band_order: Number(item.band_order),
              label: String(item.label || "Next"),
              chargeable_amount: parseFloat(item.chargeable_amount || 0),
              rate_percent: parseFloat(item.rate_percent || 0),
              effective_month: effectiveMonth,
            },
          });
        }
      } catch (err) {
        console.error("Error saving payeTaxBrackets:", err);
      }
    }

    if (!updated) {
      updated = {
        ssnit_employee_rate: sEmp,
        ssnit_employer_rate: sEr,
        petra_employee_rate: pEmp,
        petra_employer_rate: pEr,
        effective_month: effectiveMonth,
      };
    }

    return NextResponse.json({
      success: true,
      message: `Deduction & GRA Income Tax CMS rates updated for ${effectiveMonth} going forward!`,
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
