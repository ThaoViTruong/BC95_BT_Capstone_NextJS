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

export async function POST(request: Request) {
  const authSession = await getAuthSession();
  const resolvedUser = authSession ? await resolveSessionUser(authSession) : null;

  if (!authSession?.token || !resolvedUser?.id) {
    return createUnauthorizedResponse();
  }

  try {
    const formData = await request.formData();
    const file = formData.get("formFile");

    if (!(file instanceof Blob)) {
      return Response.json(
        { message: "Vui lòng chọn ảnh đại diện hợp lệ." },
        { status: 400 },
      );
    }

    await usersService.uploadAvatar(file, authSession.token);
    const user = await usersService.getById(resolvedUser.id, authSession.token);
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
      { message: "Không thể cập nhật ảnh đại diện." },
      { status: 500 },
    );
  }
}
