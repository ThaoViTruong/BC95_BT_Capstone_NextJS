import { ApiError } from "@/lib/api-error";
import { getAuthSession } from "@/lib/auth-session";
import { resolveSessionUser } from "@/lib/auth-session-user";
import { validateCommentContent } from "@/lib/comment-validation";
import { bookingsService } from "@/services/bookings.service";
import { commentsService } from "@/services/comments.service";
import type { CommentPayload } from "@/types/comment";

type CommentRequestPayload = {
  maPhong?: number;
  noiDung?: string;
  saoBinhLuan?: number;
};

function createUnauthorizedResponse() {
  return Response.json(
    { message: "Vui lòng đăng nhập bằng tài khoản khách hàng để gửi đánh giá." },
    { status: 401 },
  );
}

export async function POST(request: Request) {
  const authSession = await getAuthSession();
  const resolvedUser = authSession ? await resolveSessionUser(authSession) : null;

  if (!authSession?.token || !resolvedUser?.id || authSession.roleKey !== "customer") {
    return createUnauthorizedResponse();
  }

  try {
    const payload = (await request.json()) as CommentRequestPayload;

    if (!payload.maPhong || payload.maPhong <= 0) {
      return Response.json(
        { message: "Không tìm thấy phòng cần đánh giá." },
        { status: 400 },
      );
    }

    if (
      typeof payload.saoBinhLuan !== "number" ||
      !Number.isInteger(payload.saoBinhLuan) ||
      payload.saoBinhLuan < 1 ||
      payload.saoBinhLuan > 5
    ) {
      return Response.json(
        { message: "Vui lòng chọn số sao từ 1 đến 5." },
        { status: 400 },
      );
    }

    const contentValidation = validateCommentContent(payload.noiDung ?? "");

    if (!contentValidation.isValid) {
      return Response.json(
        { message: contentValidation.message },
        { status: 400 },
      );
    }

    const userBookings = await bookingsService.getByUser(resolvedUser.id, authSession.token);
    const hasBookedCurrentRoom = userBookings.some((booking) => booking.maPhong === payload.maPhong);

    if (!hasBookedCurrentRoom) {
      return Response.json(
        { message: "Chỉ khách hàng đã đặt phòng này mới có thể gửi đánh giá." },
        { status: 403 },
      );
    }

    const commentPayload: CommentPayload = {
      maPhong: payload.maPhong,
      maNguoiBinhLuan: resolvedUser.id,
      ngayBinhLuan: new Date().toISOString(),
      noiDung: contentValidation.normalizedValue,
      saoBinhLuan: payload.saoBinhLuan,
    };

    const comment = await commentsService.create(commentPayload, authSession.token);

    return Response.json(comment);
  } catch (error) {
    if (error instanceof ApiError) {
      return Response.json({ message: error.message }, { status: error.status });
    }

    return Response.json(
      { message: "Không thể gửi đánh giá lúc này." },
      { status: 500 },
    );
  }
}
