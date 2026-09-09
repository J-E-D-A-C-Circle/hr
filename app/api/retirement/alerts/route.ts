import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateRetirement } from "@/lib/retirement";

const db = prisma as any;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const whereClause: any = {};
    if (unreadOnly) {
      whereClause.status = "UNREAD";
    }

    const alerts = await db.retirementAlert.findMany({
      where: whereClause,
      include: {
        staff: {
          include: { department: true },
        },
      },
      orderBy: { triggeredAt: "desc" },
    });

    const processed = alerts.map((alert: any) => {
      const calc = calculateRetirement(alert.staff.dateOfBirth, alert.staff.dateOfFirstAppointment);
      return {
        ...alert,
        timeRemainingFormatted: calc.timeRemainingFormatted,
        retirementDateFormatted: calc.retirementDateFormatted,
      };
    });

    const unreadCount = await db.retirementAlert.count({ where: { status: "UNREAD" } });

    return NextResponse.json({
      alerts: processed,
      unreadCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch alerts." }, { status: 500 });
  }
}

export async function POST() {
  // Trigger automatic milestone scan for all active staff
  try {
    const activeStaff = await db.retirementStaff.findMany({
      where: { active: true, retirementStatus: { not: "RETIRED" } },
    });

    let newAlertsTriggered = 0;
    const today = new Date();

    for (const staff of activeStaff) {
      const calc = calculateRetirement(staff.dateOfBirth, staff.dateOfFirstAppointment, today);
      const monthsLeft = calc.monthsRemaining;

      const milestonesToEvaluate: { milestone: string; condition: boolean }[] = [
        { milestone: "6_MONTHS", condition: monthsLeft <= 6 && monthsLeft > 0 },
        { milestone: "1_YEAR", condition: monthsLeft <= 12 && monthsLeft > 6 },
        { milestone: "3_YEARS", condition: monthsLeft <= 36 && monthsLeft > 12 },
        { milestone: "5_YEARS", condition: monthsLeft <= 60 && monthsLeft > 36 },
      ];

      for (const m of milestonesToEvaluate) {
        if (m.condition) {
          const existing = await db.retirementAlert.findUnique({
            where: {
              staffId_milestone: {
                staffId: staff.id,
                milestone: m.milestone,
              },
            },
          });

          if (!existing) {
            await db.retirementAlert.create({
              data: {
                staffId: staff.id,
                milestone: m.milestone,
                status: "UNREAD",
              },
            });
            newAlertsTriggered++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Alert scan complete. ${newAlertsTriggered} new milestone notifications generated.`,
      newAlertsTriggered,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to run alert scan." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  // Mark alert as READ or mark all as READ
  try {
    const body = await request.json();
    const { alertId, markAllRead } = body;

    if (markAllRead) {
      await db.retirementAlert.updateMany({
        where: { status: "UNREAD" },
        data: { status: "READ" },
      });
      return NextResponse.json({ success: true, message: "All alerts marked as read." });
    }

    if (alertId) {
      await db.retirementAlert.update({
        where: { id: parseInt(alertId, 10) },
        data: { status: "READ" },
      });
      return NextResponse.json({ success: true, message: "Alert marked as read." });
    }

    return NextResponse.json({ error: "Missing alertId or markAllRead flag." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update alert." }, { status: 500 });
  }
}

