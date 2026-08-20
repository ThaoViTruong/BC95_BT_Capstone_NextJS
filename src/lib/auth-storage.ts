import type { AuthUser, StoredAuth } from "@/types/auth";

const AUTH_KEY = "bc95-booking-auth";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getStoredAuth(): StoredAuth | null {
  if (!isBrowser()) {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredAuth;
  } catch {
    window.localStorage.removeItem(AUTH_KEY);
    return null;
  }
}

export function getAccessToken() {
  return getStoredAuth()?.token ?? "";
}

export function getCurrentUser(): AuthUser | null {
  return getStoredAuth()?.user ?? null;
}

export function setStoredAuth(data: StoredAuth) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(AUTH_KEY, JSON.stringify(data));
}

export function clearStoredAuth() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(AUTH_KEY);
}
