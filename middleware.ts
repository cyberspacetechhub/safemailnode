import { NextRequest, NextResponse } from "next/server";
import {
  verifyAuthTokenEdge,
  AUTH_COOKIE_NAME,
  ADMIN_COOKIE_NAME,
} from "@/lib/auth-edge";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Admin routes (/admin, /admin/* except /admin/login and /admin/register) ──
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login" || pathname === "/admin/register") {
      return NextResponse.next();
    }

    const adminToken =
      req.cookies.get(ADMIN_COOKIE_NAME)?.value ||
      req.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!adminToken) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    const decoded = await verifyAuthTokenEdge(adminToken);
    if (!decoded || decoded.role !== "admin") {
      const res = NextResponse.redirect(new URL("/admin/login", req.url));
      res.cookies.delete(ADMIN_COOKIE_NAME);
      res.cookies.delete(AUTH_COOKIE_NAME);
      return res;
    }

    return NextResponse.next();
  }

  // ── User dashboard (/dashboard) ──
  if (pathname.startsWith("/dashboard")) {
    const userToken =
      req.cookies.get(AUTH_COOKIE_NAME)?.value ||
      req.cookies.get(ADMIN_COOKIE_NAME)?.value;

    if (!userToken) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const decoded = await verifyAuthTokenEdge(userToken);
    if (!decoded) {
      const res = NextResponse.redirect(new URL("/login", req.url));
      res.cookies.delete(AUTH_COOKIE_NAME);
      return res;
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
