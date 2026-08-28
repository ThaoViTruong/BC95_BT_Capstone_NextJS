import type { AuthUser, RememberedSignIn, StoredAuth } from "@/types/auth";
import { AUTH_STORAGE_KEY, REMEMBERED_SIGNIN_KEY } from "@/lib/auth-constants";

export const AUTH_STORAGE_EVENT = "stayora-auth-storage-change";

function isBrowser() {
  return typeof window !== "undefined";
}

function dispatchAuthChange() {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new Event(AUTH_STORAGE_EVENT));
}

export function getStoredAuth(): StoredAuth | null {
  if (!isBrowser()) {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredAuth;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
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

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
  dispatchAuthChange();
}

export function clearStoredAuth() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  dispatchAuthChange();
}

export function getRememberedSignIn(): RememberedSignIn | null {
  if (!isBrowser()) {
    return null;
  }

  const raw = window.localStorage.getItem(REMEMBERED_SIGNIN_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<RememberedSignIn>;

    if (typeof parsed.email !== "string") {
      window.localStorage.removeItem(REMEMBERED_SIGNIN_KEY);
      return null;
    }

    return {
      email: parsed.email,
      password: typeof parsed.password === "string" ? parsed.password : "",
    };
  } catch {
    window.localStorage.removeItem(REMEMBERED_SIGNIN_KEY);
    return null;
  }
}

export function setRememberedSignIn(data: RememberedSignIn) {
  if (!isBrowser()) {
    return;
  }

  const normalizedData: RememberedSignIn = {
    email: data.email.trim(),
    password: data.password,
  };

  window.localStorage.setItem(REMEMBERED_SIGNIN_KEY, JSON.stringify(normalizedData));
}

export function clearRememberedSignIn() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(REMEMBERED_SIGNIN_KEY);
}
