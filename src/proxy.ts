import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getAuthCookieName } from "@/lib/auth-session";

type RoleKey = "guest" | "customer" | "admin";
const AUTH_COOKIE_NAME = getAuthCookieName();

function decodeRoleFromCookie(rawValue: string | undefined): RoleKey {
  if (!rawValue) {
    return "guest";
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(rawValue)) as {
      token?: string;
      user?: { role?: string };
    };

    if (!parsed.token) {
      return "guest";
    }

    const normalizedRole = parsed.user?.role?.trim().toUpperCase();

    if (normalizedRole === "ADMIN") {
      return "admin";
    }

    return "customer";
  } catch {
    return "guest";
  }
}

function isAllowedPath(pathname: string, role: RoleKey) {
  if (pathname.startsWith("/quan-tri")) {
    return role === "admin";
  }

  if (pathname.startsWith("/chuyen-di")) {
    return role !== "guest";
  }

  return true;
}

function getRedirectPathByRole(role: RoleKey) {
  if (role === "admin") {
    return "/quan-tri";
  }

  if (role === "customer") {
    return "/tai-khoan";
  }

  return "/";
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/tai-khoan") {
    return NextResponse.next();
  }

  const rawCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const role = decodeRoleFromCookie(rawCookie);

  if (!isAllowedPath(pathname, role)) {
    const targetPath = role === "guest" ? "/tai-khoan" : getRedirectPathByRole(role);
    return NextResponse.redirect(new URL(targetPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/quan-tri/:path*", "/chuyen-di/:path*"],
};
