// middleware.js
import { NextResponse } from "next/server";

export function middleware(req) {
  const token = req.cookies.get("auth_token")?.value;
  const { pathname } = req.nextUrl;

  // Protect all /organization and /dashboard routes
  if (!token && (pathname.startsWith("/organization") || pathname.startsWith("/dashboard"))) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/organization/:path*", "/dashboard/:path*"],
};
