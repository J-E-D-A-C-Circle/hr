import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [deductionSetting, retirementSettings] = await Promise.all([
      prisma.deductionSetting.findFirst(),
      prisma.retirementSetting.findMany(),
    ]);

    const retirementMap = retirementSettings.reduce((acc: any, item: any) => {
      acc[item.key] = item.value;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      settings: {
        tempstaff: deductionSetting || {
          ssnit_employee_rate: 5.5,
          ssnit_employer_rate: 13.0,
          petra_employee_rate: 5.0,
          petra_employer_rate: 5.0,
        },
        retirement: {
          noticeWindowDays: retirementMap["NOTICE_WINDOW_DAYS"] || "365",
          defaultRetirementAge: retirementMap["DEFAULT_RETIREMENT_AGE"] || "60",
          maintenanceMode: retirementMap["MAINTENANCE_MODE"] || "false",
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { tempstaff, retirement } = body;

    if (tempstaff) {
      await prisma.deductionSetting.upsert({
        where: { id: 1 },
        update: {
          ssnit_employee_rate: parseFloat(tempstaff.ssnit_employee_rate),
          ssnit_employer_rate: parseFloat(tempstaff.ssnit_employer_rate),
          petra_employee_rate: parseFloat(tempstaff.petra_employee_rate),
          petra_employer_rate: parseFloat(tempstaff.petra_employer_rate),
        },
        create: {
          id: 1,
          ssnit_employee_rate: parseFloat(tempstaff.ssnit_employee_rate),
          ssnit_employer_rate: parseFloat(tempstaff.ssnit_employer_rate),
          petra_employee_rate: parseFloat(tempstaff.petra_employee_rate),
          petra_employer_rate: parseFloat(tempstaff.petra_employer_rate),
        },
      });
    }

    if (retirement) {
      const keysToUpdate = [
        { key: "NOTICE_WINDOW_DAYS", value: String(retirement.noticeWindowDays || "365") },
        { key: "DEFAULT_RETIREMENT_AGE", value: String(retirement.defaultRetirementAge || "60") },
        { key: "MAINTENANCE_MODE", value: String(retirement.maintenanceMode || "false") },
      ];

      for (const item of keysToUpdate) {
        await prisma.retirementSetting.upsert({
          where: { key: item.key },
          update: { value: item.value },
          create: { key: item.key, value: item.value },
        });
      }
    }

    return NextResponse.json({ success: true, message: "Settings saved successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save settings" }, { status: 500 });
  }
}
