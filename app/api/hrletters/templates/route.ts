import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getHrLettersSession } from "@/lib/hrletters-auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getHrLettersSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const where: any = { isActive: true };
    if (type) where.type = type;

    const templates = await prisma.hrLetterTemplate.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: templates });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getHrLettersSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!["HR_OFFICER", "HR_DIRECTOR"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const { title, type, description, content } = body;

    if (!title || !type || !content) {
      return NextResponse.json({ success: false, error: "Title, type, and content are required" }, { status: 400 });
    }

    const template = await prisma.hrLetterTemplate.create({
      data: {
        title: title.trim(),
        type,
        description: description ? description.trim() : null,
        content: content.trim(),
      },
    });

    // Audit log
    await prisma.hrLetterAuditLog.create({
      data: {
        action: "TEMPLATE_CREATED",
        actorName: session.fullName,
        actorRole: session.role,
        targetId: template.id,
        targetType: "HrLetterTemplate",
        details: `Created new letter template '${template.title}' (${template.type})`,
      },
    });

    return NextResponse.json({ success: true, data: template });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getHrLettersSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!["HR_OFFICER", "HR_DIRECTOR"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const { id, title, type, description, content, isActive } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Template ID is required" }, { status: 400 });
    }

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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getHrLettersSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!["HR_OFFICER", "HR_DIRECTOR"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ success: false, error: "Template ID is required" }, { status: 400 });
    }

    const existing = await prisma.hrLetterTemplate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });
    }

    await prisma.hrLetterTemplate.delete({ where: { id } });

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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
