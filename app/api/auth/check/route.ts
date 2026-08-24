import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth";

export async function GET() {
  const isValid = await verifyAdminSession();
  if (!isValid) {
    return NextResponse.json(
      { authenticated: false, error: "Session expired or unauthenticated" },
      { status: 401 }
    );
  }
  return NextResponse.json({ authenticated: true });
}
