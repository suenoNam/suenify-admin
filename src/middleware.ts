import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname === "/login";
  const isApiLogin = pathname === "/api/auth/login";
  const isApiLogout = pathname === "/api/auth/logout";

  // ✅ 추가: 내부 API 허용
  const isInternalApi =
    pathname.startsWith("/api/internal") ||
    pathname.startsWith("/api/deploy") ||
    pathname.startsWith("/api/system");

  const isStaticFile =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".");

  if (
    isLoginPage ||
    isApiLogin ||
    isApiLogout ||
    isStaticFile ||
    isInternalApi // ✅ 이거 추가
  ) {
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