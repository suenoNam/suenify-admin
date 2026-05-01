import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname === "/login";
  const isApiLogin = pathname === "/api/auth/login";
  const isApiLogout = pathname === "/api/auth/logout";
  const isStaticFile =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".");

  if (isLoginPage || isApiLogin || isApiLogout || isStaticFile) {
    return NextResponse.next();
  }

  const sessionCookie =
    request.cookies.get("suenify_admin_session")?.value;

  if (sessionCookie !== "logged_in") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};