import { NextResponse } from "next/server";

import { ApiError } from "@/lib/api-error";
import {
  createAuthCookieValue,
  getAuthCookieMaxAge,
  getAuthCookieName,
} from "@/lib/auth-session";
import { hydrateSignedUpUser } from "@/lib/auth-user";
import { setProfileSeed } from "@/lib/profile-seed";
import { apiRequest } from "@/lib/api-client";
import type { AuthUser, SignUpPayload } from "@/types/auth";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as SignUpPayload;
    const apiUser = await apiRequest<AuthUser>("/api/auth/signup", {
      method: "POST",
      body: payload,
    });
    const user = hydrateSignedUpUser(apiUser, payload);

    const response = NextResponse.json(user);

    if (user.token) {
      response.cookies.set({
        name: getAuthCookieName(),
        value: createAuthCookieValue({
          token: user.token,
          user,
        }),
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: getAuthCookieMaxAge(),
      });

      setProfileSeed(response, user);
    }

    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      return Response.json({ message: error.message }, { status: error.status });
    }

    return Response.json(
      { message: "Không thể xử lý yêu cầu đăng ký." },
      { status: 500 },
    );
  }
}
