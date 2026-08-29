import { getAuthSession } from "@/lib/auth-session";
import { resolveSessionUser } from "@/lib/auth-session-user";

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

    return Response.json(
      {
        message:
          "API hiện tại chưa hỗ trợ đổi mật khẩu trực tiếp. Vui lòng dùng mật khẩu cũ để đăng nhập.",
      },
      { status: 501 },
    );
  } catch {
    return Response.json(
      { message: "Không thể kiểm tra yêu cầu đổi mật khẩu." },
      { status: 500 },
    );
  }
}
