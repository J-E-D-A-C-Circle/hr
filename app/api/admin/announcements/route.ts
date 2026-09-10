import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const target = searchParams.get("target");

    const where: any = {};
    if (target) {
      where.OR = [{ target: "ALL" }, { target }];
      where.isActive = true;
    }

    const announcements = await prisma.systemAnnouncement.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, announcements });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch announcements" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, message, target, severity, expiresAt } = body;

    if (!title || !message) {
      return NextResponse.json({ error: "Title and Message are required" }, { status: 400 });
    }

    const announcement = await prisma.systemAnnouncement.create({
      data: {
        title,
        message,
        target: target || "ALL",
        severity: severity || "INFO",
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: session.name || session.username,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, announcement });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create announcement" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, isActive, title, message, target, severity } = body;

    if (!id) {
      return NextResponse.json({ error: "Announcement ID is required" }, { status: 400 });
    }

    const updated = await prisma.systemAnnouncement.update({
      where: { id },
      data: {
        ...(typeof isActive === "boolean" ? { isActive } : {}),
        ...(title ? { title } : {}),
        ...(message ? { message } : {}),
        ...(target ? { target } : {}),
        ...(severity ? { severity } : {}),
      },
    });

    return NextResponse.json({ success: true, announcement: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update announcement" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Announcement ID is required" }, { status: 400 });
    }

    await prisma.systemAnnouncement.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Announcement deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete announcement" }, { status: 500 });
  }
}
