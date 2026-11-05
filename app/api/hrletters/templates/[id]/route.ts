import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getHrLettersSession } from "@/lib/hrletters-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getHrLettersSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const template = await prisma.hrLetterTemplate.findUnique({
      where: { id },
      include: { _count: { select: { letters: true } } },
    });

    if (!template) {
      return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: template });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getHrLettersSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!["HR_OFFICER", "HR_DIRECTOR"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { title, type, description, content, isActive } = body;

    const existing = await prisma.hrLetterTemplate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (content !== undefined) updateData.content = content.trim();
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    // Increment version if content or title changed
    if (
      (content !== undefined && content.trim() !== existing.content) ||
      (title !== undefined && title.trim() !== existing.title)
    ) {
      updateData.version = (existing.version || 1) + 1;
    }

    const updated = await prisma.hrLetterTemplate.update({
      where: { id },
      data: updateData,
    });

    // Audit log
    await prisma.hrLetterAuditLog.create({
      data: {
        action: "TEMPLATE_UPDATED",
        actorName: session.fullName,
        actorRole: session.role,
        targetId: updated.id,
        targetType: "HrLetterTemplate",
        details: `Updated template '${updated.title}' (${updated.type}, v${updated.version})`,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Template PUT error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getHrLettersSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!["HR_OFFICER", "HR_DIRECTOR"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const { id } = await params;
    const existing = await prisma.hrLetterTemplate.findUnique({
      where: { id },
      include: { _count: { select: { letters: true } } },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });
    }

    // Safely delete template - letters will retain null templateId
    await prisma.hrLetterTemplate.delete({
      where: { id },
    });

    // Audit log
    await prisma.hrLetterAuditLog.create({
      data: {
        action: "TEMPLATE_DELETED",
        actorName: session.fullName,
        actorRole: session.role,
        targetId: id,
        targetType: "HrLetterTemplate",
        details: `Deleted template '${existing.title}' (${existing.type})`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Template '${existing.title}' deleted successfully.`,
    });
  } catch (error: any) {
    console.error("Template DELETE error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

