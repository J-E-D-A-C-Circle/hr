import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getHrLettersSession } from "@/lib/hrletters-auth";

export async function GET() {
  try {
    const session = await getHrLettersSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const templates = await prisma.hrLetterTemplate.findMany({
      where: { isActive: true },
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

    const body = await req.json();
    const { title, type, description, content } = body;

    if (!title || !type || !content) {
      return NextResponse.json({ success: false, error: "Title, type, and content are required" }, { status: 400 });
    }

    const template = await prisma.hrLetterTemplate.create({
      data: { title, type, description, content },
    });

    return NextResponse.json({ success: true, data: template });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
