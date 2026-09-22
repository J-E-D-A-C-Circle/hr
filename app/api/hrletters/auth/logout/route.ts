import { NextResponse } from "next/server";

const HR_LETTERS_COOKIE = "dvla_hrletters_session";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(HR_LETTERS_COOKIE, "logged_out", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });
  return response;
}
