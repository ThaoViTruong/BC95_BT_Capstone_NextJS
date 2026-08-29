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
import type { UpdateUserPayload } from "@/types/user";

function buildFullProfilePayload(
  resolvedUser: NonNullable<Awaited<ReturnType<typeof resolveSessionUser>>>,
  payload: UpdateUserPayload,
): UpdateUserPayload {
  return {
    name: payload.name ?? resolvedUser.name,
    email: payload.email ?? resolvedUser.email,
    phone: payload.phone ?? resolvedUser.phone,
    birthday: payload.birthday ?? resolvedUser.birthday,
    gender: payload.gender ?? resolvedUser.gender,
    role: payload.role ?? resolvedUser.role,
    ...(payload.password ? { password: payload.password } : {}),
  };
}

function createUnauthorizedResponse() {
  return Response.json(
    { message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." },
    { status: 401 },
  );
}

export async function GET() {
  const authSession = await getAuthSession();
  const resolvedUser = authSession ? await resolveSessionUser(authSession) : null;

  if (!authSession?.token || !resolvedUser?.id) {
    return createUnauthorizedResponse();
  }

  try {
    const response = NextResponse.json(resolvedUser);

    response.cookies.set({
      name: getAuthCookieName(),
      value: createAuthCookieValue({
        token: authSession.token,
        user: {
          ...resolvedUser,
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
      ...resolvedUser,
      token: authSession.token,
    });

    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      return Response.json({ message: error.message }, { status: error.status });
    }

    return Response.json(
      { message: "Không thể tải thông tin hồ sơ." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const authSession = await getAuthSession();
  const resolvedUser = authSession ? await resolveSessionUser(authSession) : null;

  if (!authSession?.token || !resolvedUser?.id) {
    return createUnauthorizedResponse();
  }

  try {
    const payload = (await request.json()) as UpdateUserPayload;
    const fullPayload = buildFullProfilePayload(resolvedUser, payload);
    const user = await usersService.update(resolvedUser.id, fullPayload, authSession.token);
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
      { message: "Không thể cập nhật thông tin hồ sơ." },
      { status: 500 },
    );
  }
}
