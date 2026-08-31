import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const templates = await prisma.letterTemplate.findMany({
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ success: true, data: templates });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const template = await prisma.letterTemplate.create({
      data: {
        title: body.title,
        type: body.type,
        description: body.description,
        content: body.content,
        version: body.version || 1,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "TEMPLATE_CREATED",
        actorName: "HR Officer",
        actorRole: "HR Officer",
        targetId: template.id,
        targetType: "LetterTemplate",
        details: `Created template: ${template.title}`,
      },
    });

    return NextResponse.json({ success: true, data: template });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const template = await prisma.letterTemplate.update({
      where: { id: body.id },
      data: {
        title: body.title,
        description: body.description,
        content: body.content,
        version: { increment: 1 },
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "TEMPLATE_UPDATED",
        actorName: "HR Officer",
        actorRole: "HR Officer",
        targetId: template.id,
        targetType: "LetterTemplate",
        details: `Updated template ${template.title} to version ${template.version}`,
      },
    });

    return NextResponse.json({ success: true, data: template });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
