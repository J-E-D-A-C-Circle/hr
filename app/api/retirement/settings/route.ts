import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRetirementSession } from "@/lib/retirement-auth";

export async function GET() {
  try {
    const settings = await prisma.retirementSetting.findMany();
    const settingsMap: Record<string, string> = {
      statutory_retirement_age: "60",
      alert_milestones: "5_YEARS,3_YEARS,1_YEAR,6_MONTHS",
      email_notifications: "enabled",
    };

    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return NextResponse.json({
      settings: settingsMap,
      systemInfo: {
        appName: "DVLA Staff Retirement Tracking System",
        version: "v2.4.0 Enterprise",
        environment: process.env.NODE_ENV || "development",
        headOffice: "DVLA Head Office — HR Directorate, Accra",
        statutoryAge: 60,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch settings." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getRetirementSession();
    if (!session || session.role !== "HR_ADMINISTRATOR") {
      return NextResponse.json({ error: "Unauthorized access. HR Administrator privileges required." }, { status: 403 });
    }

    const body = await request.json();
    const { settings } = body; // e.g. { alert_milestones: "..." }

    if (settings && typeof settings === "object") {
      for (const [key, value] of Object.entries(settings)) {
        await prisma.retirementSetting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        });
      }
    }

    return NextResponse.json({ success: true, message: "Settings updated successfully." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update settings." }, { status: 500 });
  }
}
