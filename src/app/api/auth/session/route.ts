import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-session";
import { resolveSessionUser } from "@/lib/auth-session-user";

export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json(
        { user: null },
        { status: 401 },
      );
    }

    const user = await resolveSessionUser({
      token: session.token,
      user: session.user,
    });

    if (!user) {
      return NextResponse.json(
        { user: null },
        { status: 401 },
      );
    }

    const { token: _token, ...safeUser } = user;

    return NextResponse.json({
      user: safeUser,
    });
  } catch (error) {
    console.error("Lỗi lấy session:", error);

    return NextResponse.json(
      { message: "Không thể lấy phiên đăng nhập." },
      { status: 500 },
    );
  }
}