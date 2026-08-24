import { NextRequest, NextResponse } from "next/server";
import { checkPasscode, createAdminSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    let passcode = "";
    try {
      const body = await request.json();
      passcode = body?.passcode || "";
    } catch (e) {
      try {
        const formData = await request.formData();
        passcode = (formData.get("passcode") as string) || "";
      } catch (err) {}
    }

    if (!passcode || !checkPasscode(passcode)) {
      return NextResponse.json(
        { success: false, error: "Invalid admin passcode. (Default: admin123)" },
        { status: 401 }
      );
    }

    await createAdminSession();
    return NextResponse.json({ success: true, message: "Logged in successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

