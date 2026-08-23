import { cookies } from "next/headers";

import type { AuthUser } from "@/types/auth";

const AUTH_COOKIE_NAME = "stayora_auth";
const AUTH_MAX_AGE = 60 * 60 * 24 * 7;

type AuthSessionPayload = {
  token: string;
  user: AuthUser | null;
};

type AuthSession = AuthSessionPayload & {
  roleKey: "guest" | "customer" | "host" | "admin";
};

function resolveRoleKey(role?: string): AuthSession["roleKey"] {
  const normalizedRole = role?.trim().toUpperCase();

  switch (normalizedRole) {
    case "ADMIN":
      return "admin";
    case "HOST":
      return "host";
    case "USER":
      return "customer";
    default:
      return "guest";
  }
}

function encodeSession(data: AuthSessionPayload) {
  return encodeURIComponent(JSON.stringify(data));
}

function decodeSession(value: string): AuthSessionPayload | null {
  try {
    const raw = decodeURIComponent(value);
    return JSON.parse(raw) as AuthSessionPayload;
  } catch {
    return null;
  }
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!rawValue) {
    return null;
  }

  const session = decodeSession(rawValue);

  if (!session?.token) {
    return null;
  }

  return {
    ...session,
    roleKey: resolveRoleKey(session.user?.role),
  };
}

export function createAuthCookieValue(data: AuthSessionPayload) {
  return encodeSession(data);
}

export function getAuthCookieName() {
  return AUTH_COOKIE_NAME;
}

export function getAuthCookieMaxAge() {
  return AUTH_MAX_AGE;
}
