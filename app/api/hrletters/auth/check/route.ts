import { NextResponse } from "next/server";
import { getHrLettersSession } from "@/lib/hrletters-auth";

export async function GET() {
  const session = await getHrLettersSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, user: session });
}
