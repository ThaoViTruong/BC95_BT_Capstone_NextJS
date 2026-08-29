import { NextResponse } from "next/server";

import { ApiError } from "@/lib/api-error";
import {
  createAuthCookieValue,
  getAuthCookieMaxAge,
  getAuthCookieName,
} from "@/lib/auth-session";
import { resolveSessionUser } from "@/lib/auth-session-user";
import { getProfileSeed, mergeUserWithProfileSeed, setProfileSeed } from "@/lib/profile-seed";
import { apiRequest } from "@/lib/api-client";
import type { AuthUser, SignInPayload } from "@/types/auth";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as SignInPayload;
    const profileSeed = await getProfileSeed();
    const apiUser = await apiRequest<AuthUser>("/api/auth/signin", {
      method: "POST",
      body: payload,
    });
    const user =
      (apiUser.token
        ? await resolveSessionUser({
            token: apiUser.token,
            user: {
              ...apiUser,
              email: apiUser.email || payload.email,
            },
          })
        : null) ??
      {
        ...apiUser,
        email: apiUser.email || payload.email,
      };
    const mergedUser = mergeUserWithProfileSeed(user, profileSeed, payload.email);

    const response = NextResponse.json(mergedUser);

    if (mergedUser.token) {
      response.cookies.set({
        name: getAuthCookieName(),
        value: createAuthCookieValue({
          token: mergedUser.token,
          user: mergedUser,
        }),
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: getAuthCookieMaxAge(),
      });

      setProfileSeed(response, mergedUser);
    }

    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 400 || error.status === 401) {
        return Response.json({ message: "Email hoặc mật khẩu sai" }, { status: 401 });
      }

      return Response.json({ message: error.message }, { status: error.status });
    }

    return Response.json(
      { message: "Không thể xử lý yêu cầu đăng nhập." },
      { status: 500 },
    );
  }
}
