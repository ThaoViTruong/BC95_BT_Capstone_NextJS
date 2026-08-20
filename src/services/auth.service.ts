import { apiRequest } from "@/lib/api-client";
import type { AuthUser, SignInPayload, SignUpPayload } from "@/types/auth";

export const authService = {
  signIn(payload: SignInPayload) {
    return apiRequest<AuthUser>("/api/auth/signin", {
      method: "POST",
      body: payload,
    });
  },

  signUp(payload: SignUpPayload) {
    return apiRequest<AuthUser>("/api/auth/signup", {
      method: "POST",
      body: payload,
    });
  },
};
