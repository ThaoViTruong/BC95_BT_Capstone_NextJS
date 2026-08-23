import { ApiError } from "@/lib/api-error";
import type { AuthUser, SignInPayload, SignUpPayload } from "@/types/auth";

type AuthRequestOptions = {
  payload?: unknown;
};

async function parseResponseData(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

async function authRequest(path: string, options: AuthRequestOptions = {}) {
  const hasPayload = options.payload !== undefined;
  const response = await fetch(path, {
    method: "POST",
    headers: hasPayload
      ? {
          "Content-Type": "application/json",
        }
      : undefined,
    body: hasPayload ? JSON.stringify(options.payload) : undefined,
  });

  const data = await parseResponseData(response);

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "message" in data && typeof data.message === "string"
        ? data.message
        : "Không thể kết nối tới máy chủ.";

    throw new ApiError(message, response.status);
  }

  return data as AuthUser;
}

export const authService = {
  signIn(payload: SignInPayload) {
    return authRequest("/api/auth/signin", { payload });
  },

  signUp(payload: SignUpPayload) {
    return authRequest("/api/auth/signup", { payload });
  },

  signOut() {
    return authRequest("/api/auth/signout");
  },
};
