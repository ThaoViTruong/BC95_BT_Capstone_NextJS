import { NextResponse } from "next/server";

import { ApiError } from "@/lib/api-error";
import {
  createAuthCookieValue,
  getAuthCookieMaxAge,
  getAuthCookieName,
  getAuthSession,
} from "@/lib/auth-session";
import { resolveSessionUser } from "@/lib/auth-session-user";
import { setProfileSeed } from "@/lib/profile-seed";
import { usersService } from "@/services/users.service";

function createUnauthorizedResponse() {
  return Response.json(
    { message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." },
    { status: 401 },
  );
}

export async function PUT(request: Request) {
  const authSession = await getAuthSession();
  const resolvedUser = authSession ? await resolveSessionUser(authSession) : null;

  if (!authSession?.token || !resolvedUser?.id) {
    return createUnauthorizedResponse();
  }

  try {
    const payload = (await request.json()) as { password?: string };

    if (!payload.password?.trim()) {
      return Response.json(
        { message: "Vui lòng nhập mật khẩu mới." },
        { status: 400 },
      );
    }

    const user = await usersService.update(
      resolvedUser.id,
      { password: payload.password.trim() },
      authSession.token,
    );
    const response = NextResponse.json(user);

    response.cookies.set({
      name: getAuthCookieName(),
      value: createAuthCookieValue({
        token: authSession.token,
        user: {
          ...user,
          token: authSession.token,
        },
      }),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: getAuthCookieMaxAge(),
    });
    setProfileSeed(response, {
      ...user,
      token: authSession.token,
    });

    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      return Response.json({ message: error.message }, { status: error.status });
    }

    return Response.json(
      { message: "Không thể cập nhật mật khẩu." },
      { status: 500 },
    );
  }
}
