import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope");

  const res = NextResponse.json({ success: true });

  if (scope === "admin") {
    res.cookies.set(ADMIN_COOKIE_NAME, "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
    });
  } else {
    res.cookies.set(AUTH_COOKIE_NAME, "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
    });
  }

  return res;
}
