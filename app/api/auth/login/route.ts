import { NextRequest, NextResponse } from "next/server";
import { checkCredentials, createAdminSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const usernameOrEmail: string = body?.usernameOrEmail || body?.username || body?.email || "";
    const password: string = body?.password || "";

    if (!usernameOrEmail || !password) {
      return NextResponse.json(
        { success: false, error: "Username/email and password are required." },
        { status: 400 }
      );
    }

    if (!checkCredentials(usernameOrEmail, password)) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials. Please try again." },
        { status: 401 }
      );
    }

    await createAdminSession();
    return NextResponse.json({ success: true, message: "Logged in successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
