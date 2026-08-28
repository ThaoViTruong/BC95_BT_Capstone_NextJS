import { cookies } from "next/headers";

import type { AuthUser } from "@/types/auth";

const AUTH_COOKIE_NAME = "stayora_auth";
const AUTH_MAX_AGE = 60 * 60 * 24 * 7;

type AuthSessionPayload = {
  token: string;
  user: AuthUser | null;
};

type AuthSession = AuthSessionPayload & {
  roleKey: "guest" | "customer" | "admin";
};

function resolveRoleKey(
  role: string | undefined,
  isAuthenticated: boolean,
): AuthSession["roleKey"] {
  if (!isAuthenticated) {
    return "guest";
  }

  const normalizedRole = role?.trim().toUpperCase();

  if (normalizedRole === "ADMIN") {
    return "admin";
  }

  return "customer";
}

function encodeSession(data: AuthSessionPayload) {
  return encodeURIComponent(JSON.stringify(data));
}

function decodeSession(value: string): AuthSessionPayload | null {
  const candidates = [value];
  let nextValue = value;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      nextValue = decodeURIComponent(nextValue);
      candidates.push(nextValue);
    } catch {
      break;
    }
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as AuthSessionPayload;
    } catch {
      // Thử các định dạng cũ của cookie nếu có.
    }
  }

  return null;
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
    roleKey: resolveRoleKey(session.user?.role, true),
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
